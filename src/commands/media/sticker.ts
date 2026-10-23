import * as baileys from "@whiskeysockets/baileys"
import sharp from "sharp"
import pino from "pino"

import { Command } from "../../interfaces/command/index.js"

const stickerSize = 512

export const command: Command = {
    name: "sticker",
    description: "Cria uma figurinha. Envie uma imagem com a legenda !sticker ou responda uma imagem com !sticker.",
    run: async (context) => {
        const own = baileys.normalizeMessageContent(context.message.message)
        const contextInfo = own?.imageMessage?.contextInfo ?? own?.extendedTextMessage?.contextInfo
        const quoted = baileys.normalizeMessageContent(contextInfo?.quotedMessage)

        const source: baileys.WAMessage | undefined = own?.imageMessage
            ? context.message
            : quoted?.imageMessage
              ? {
                    key: {
                        remoteJid: context.jid,
                        id: contextInfo?.stanzaId,
                        participant: contextInfo?.participant
                    },
                    message: contextInfo?.quotedMessage
                }
              : undefined

        if (!source) {
            await context.reply("Envie uma imagem com a legenda !sticker ou responda uma imagem com !sticker.")
            return
        }

        const image = await baileys.downloadMediaMessage(
            source,
            "buffer",
            {},
            { logger: pino({ level: "silent" }), reuploadRequest: context.client.socket.updateMediaMessage }
        )

        const sticker = await sharp(image)
            .resize(stickerSize, stickerSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 75 })
            .toBuffer()

        await context.client.socket.sendMessage(context.jid, { sticker }, { quoted: context.message })
    }
}
