import * as baileys from "@whiskeysockets/baileys"
import sharp from "sharp"
import pino from "pino"

import { Command } from "../../interfaces/command/index.js"

export async function stickerToImage(sticker: Buffer) {
    return sharp(sticker).flatten({ background: "#ffffff" }).png().toBuffer()
}

export const command: Command = {
    name: "sticker2image",
    description: "Transforma um sticker em imagem. Responda um sticker com !sticker2image.",
    run: async (context) => {
        const own = baileys.normalizeMessageContent(context.message.message)
        const contextInfo = own?.extendedTextMessage?.contextInfo
        const quoted = baileys.normalizeMessageContent(contextInfo?.quotedMessage)

        if (!quoted?.stickerMessage) {
            await context.reply("Responda um sticker com !sticker2image.")
            return
        }

        const source: baileys.WAMessage = {
            key: {
                remoteJid: context.jid,
                id: contextInfo?.stanzaId,
                participant: contextInfo?.participant
            },
            message: contextInfo?.quotedMessage
        }

        const sticker = await baileys.downloadMediaMessage(
            source,
            "buffer",
            {},
            { logger: pino({ level: "silent" }), reuploadRequest: context.client.socket.updateMediaMessage }
        )

        const image = await stickerToImage(sticker)

        await context.client.socket.sendMessage(context.jid, { image }, { quoted: context.message })
    }
}
