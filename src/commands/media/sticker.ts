import * as baileys from "@whiskeysockets/baileys"
import sharp from "sharp"
import pino from "pino"
import { z } from "zod"

import { Command } from "../../interfaces/command/index.js"

const stickerSize = 512

const lowercase = (value: unknown) => (typeof value === "string" ? value.toLowerCase() : value)

// Arguments are positional: `!sticker [crop] [center]`
//   crop:   true (default) fills the square and crops the overflow, false fits the whole image
//           with transparent bars, dented stretches the image to the square (squashed).
//   center: true (default) centers the crop/image, false anchors it to the top-left corner.
const schema = z.object({
    crop: z.preprocess(lowercase, z.enum(["true", "false", "dented"])).optional(),
    center: z.preprocess(lowercase, z.enum(["true", "false"])).optional()
})

type StickerOptions = z.infer<typeof schema>

function createStickerTransform(options: StickerOptions) {
    const position = options.center === "false" ? "left top" : "centre"

    if (options.crop === "dented") {
        return sharp().resize(stickerSize, stickerSize, { fit: "fill" })
    }

    if (options.crop === "false") {
        return sharp().resize(stickerSize, stickerSize, {
            fit: "contain",
            position: position,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
    }

    return sharp().resize(stickerSize, stickerSize, { fit: "cover", position: position })
}

export async function createSticker(image: Buffer, options: StickerOptions) {
    return sharp(image)
        .pipelineColourspace("srgb")
        .ensureAlpha()
        .pipe(createStickerTransform(options))
        .webp({ quality: 75 })
        .toBuffer()
}

export const command: Command<typeof schema> = {
    name: "sticker",
    description:
        "Cria uma figurinha a partir de uma imagem (legenda ou resposta). Uso: !sticker [crop: true|false|dented] [center: true|false]",
    schema: schema,
    run: async (context, options) => {
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

        const sticker = await createSticker(image, options)

        await context.client.socket.sendMessage(context.jid, { sticker }, { quoted: context.message })
    }
}
