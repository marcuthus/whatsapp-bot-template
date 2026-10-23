import * as baileys from "@whiskeysockets/baileys"
import qrcode from "qrcode-terminal"
import pino from "pino"

import { createScopedLogger } from "./helpers/logger.helper.js"
import { AnyCommand } from "./interfaces/command/index.js"
import { configHelper } from "./helpers/config.helper.js"
import handleCommands from "./handlers/commands.js"
import handleEvents from "./handlers/events.js"

const logger = createScopedLogger("client")

type Listener = (data: never) => unknown

export class Client {
    public commands: Map<string, AnyCommand> = new Map()
    public commandCategories: Map<string, string> = new Map()
    public socket!: baileys.WASocket

    // Listeners are kept here because the socket is recreated on every reconnection.
    private listeners: { name: keyof baileys.BaileysEventMap; handler: Listener }[] = []

    public on<K extends keyof baileys.BaileysEventMap>(
        name: K,
        handler: (data: baileys.BaileysEventMap[K]) => unknown
    ) {
        this.listeners.push({ name, handler: handler as Listener })
    }

    public bindListeners() {
        for (const { name, handler } of this.listeners) {
            this.socket.ev.on(name, handler as (data: unknown) => void)
        }
    }
}

function createClient() {
    const client = new Client()

    let stopped = false

    async function connect() {
        const { state, saveCreds } = await baileys.useMultiFileAuthState(configHelper.auth.directory)
        const { version } = await baileys.fetchLatestBaileysVersion()

        client.socket = baileys.makeWASocket({
            version: version,
            auth: state,
            logger: pino({ level: "warn" }),
            browser: baileys.Browsers.ubuntu("Chrome"),
            markOnlineOnConnect: false
        })

        client.socket.ev.on("creds.update", saveCreds)
        client.socket.ev.on("connection.update", onConnectionUpdate)
        client.bindListeners()
    }

    async function onConnectionUpdate(update: Partial<baileys.ConnectionState>) {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            if (configHelper.auth.pairingNumber) {
                const code = await client.socket.requestPairingCode(configHelper.auth.pairingNumber)
                logger.info(`Pairing code: ${code}`)
            } else {
                logger.info("Scan the QR code below with WhatsApp (Linked devices):")
                qrcode.generate(qr, { small: true })
            }
        }

        if (connection === "open") {
            logger.info(`Successfully started as '${client.socket.user?.name ?? client.socket.user?.id}'`)
        }

        if (connection === "close") {
            const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output
                ?.statusCode

            if (stopped) return

            if (statusCode === baileys.DisconnectReason.loggedOut) {
                logger.error(`Logged out. Delete the '${configHelper.auth.directory}' folder and start again.`)
                return
            }

            logger.warn(`Connection closed (code ${statusCode}). Reconnecting...`)
            await connect()
        }
    }

    async function start() {
        logger.info("Starting...")

        stopped = false

        await handleEvents(client)
        await handleCommands(client)

        await connect()
    }

    function stop(_reason?: string) {
        logger.info("Stoping...")

        stopped = true
        client.socket?.end(undefined)

        logger.info("Successfully stopped!")
    }

    async function restart() {
        stop("restart")
        await start()
    }

    return { start, stop, restart }
}

export default createClient
