import { pathToFileURL } from "node:url"
import path from "node:path"
import fs from "node:fs"

import { ArgusError } from "@marcuth/argus"
import { z } from "zod"

import { createContext } from "../utils/message/create-context.js"
import { createScopedLogger } from "../helpers/logger.helper.js"
import { ExtendedContext } from "../interfaces/context/index.js"
import { AnyCommand } from "../interfaces/command/index.js"
import { argus } from "../helpers/argus.helper.js"
import { Client } from "../client.js"

const logger = createScopedLogger("client")

export default async (client: Client) => {
    const commandsDirPath = path.join(import.meta.dirname, "../commands")
    const fileExtension = path.extname(import.meta.filename)

    const commandDirs = fs
        .readdirSync(commandsDirPath)
        .filter((dir) => fs.lstatSync(path.join(commandsDirPath, dir)).isDirectory())

    for (const dir of commandDirs) {
        const subFolder = path.join(commandsDirPath, dir)
        const commandFiles = fs.readdirSync(subFolder).filter((file) => file.endsWith(fileExtension))

        for (const file of commandFiles) {
            const commandFilePath = path.join(subFolder, file)
            const command = await importCommand(commandFilePath)

            if (!command.name) {
                logger.error(`Not valid command name on: ${commandFilePath}`)
                throw new Error(`Not valid command name on: ${commandFilePath}`)
            }

            if (!command.run) {
                logger.error(`Not valid command run on: ${commandFilePath}`)
                throw new Error(`Not valid command run on: ${commandFilePath}`)
            }

            if (!/^[a-z0-9_]{1,32}$/.test(command.name)) {
                const message = `Invalid command name '${command.name}' on: ${commandFilePath}. Only 1-32 lowercase letters, digits and underscores are allowed.`
                logger.error(message)
                throw new Error(message)
            }

            if (!command.description || command.description.length < 3 || command.description.length > 256) {
                const message = `Invalid command description on: ${commandFilePath}. 3-256 characters are required.`
                logger.error(message)
                throw new Error(message)
            }

            client.commands.set(command.name, command)

            logger.info(`The command '${command.name}' loaded.`)
        }
    }

    client.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify") return

        for (const message of messages) {
            if (!message.message || message.key.fromMe || !message.key.remoteJid) continue

            const context = createContext(client, message)

            if (!argus.isCommand(context.text)) continue

            const command = client.commands.get(argus.extractCommandProps(context.text).name)

            if (!command) continue

            await runCommand(command, context)
        }
    })

    async function runCommand(command: AnyCommand, context: ExtendedContext) {
        let options: Record<string, unknown> = {}

        try {
            const props = argus.extractCommandProps(context.text)

            options = argus.validateCommandWithArguments({
                name: command.name,
                arguments: props.arguments,
                schema: command.schema ?? z.object({})
            }).options
        } catch (error) {
            if (error instanceof ArgusError) {
                await context.reply(`*Erro de argumentos:*\n\n${error.message}`)
                return
            }

            if (error instanceof z.ZodError) {
                const issues = error.issues
                    .map((issue) => `- \`${issue.path.join(".")}\` | _${issue.message}_`)
                    .join("\n")

                await context.reply(`*Erro de argumentos:*\n\n${issues}`)
                return
            }

            throw error
        }

        try {
            logger.info(`Running the command '${command.name}'.`)
            await command.run(context, options)
        } catch (error) {
            logger.error(error)

            await context.reply(`Ocorreu um erro ao tentar executar o comando \`${command.name}\`!`)
        }
    }

    async function importCommand(commandFilePath: string) {
        const command: AnyCommand = (await import(pathToFileURL(commandFilePath).href)).command
        return command
    }
}
