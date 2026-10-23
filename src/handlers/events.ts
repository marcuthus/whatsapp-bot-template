import { pathToFileURL } from "node:url"
import path from "node:path"
import fs from "node:fs"

import { createScopedLogger } from "../helpers/logger.helper.js"
import { AnyEvent } from "../interfaces/event/index.js"
import { Client } from "../client.js"

const logger = createScopedLogger("client")

export default async (client: Client) => {
    const eventsDirPath = path.join(import.meta.dirname, "../events")
    const fileExtension = path.extname(import.meta.filename)

    const eventFiles = fs.readdirSync(eventsDirPath).filter((file) => file.endsWith(fileExtension))

    for (const file of eventFiles) {
        const eventFilePath = path.join(eventsDirPath, file)
        const event = await importEvent(eventFilePath)

        switch (event.type) {
            case "on":
                client.on(event.name, (data) => event.run(client, data))
                break
            case "once": {
                let alreadyRan = false

                client.on(event.name, async (data) => {
                    if (alreadyRan) return

                    alreadyRan = true
                    await event.run(client, data)
                })
                break
            }
            default:
                logger.error(`The value '${event.type}' that informed for the type of the event is invalid.`, {
                    eventFilePath: eventFilePath
                })
                throw new Error(`The value '${event.type}' that informed for the type of the event is invalid.`)
        }

        logger.info(`The event '${event.name}' loaded.`, { eventFilePath: eventFilePath })
    }

    async function importEvent(eventFilePath: string) {
        const event: AnyEvent = (await import(pathToFileURL(eventFilePath).href)).event
        return event
    }
}
