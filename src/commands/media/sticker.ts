import * as baileys from "@whiskeysockets/baileys"
import sharp from "sharp"
import pino from "pino"
import { z } from "zod"

import { videoToAnimatedSticker } from "../../utils/media/video-to-sticker.js"
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
        "Cria uma figurinha a partir de uma imagem, GIF ou vídeo (legenda ou resposta). Uso: !sticker [crop: true|false|dented] [center: true|false]",
    schema: schema,
    run: async (context, options) => {
        const own = baileys.normalizeMessageContent(context.message.message)
        const contextInfo =
            own?.imageMessage?.contextInfo ?? own?.videoMessage?.contextInfo ?? own?.extendedTextMessage?.contextInfo
        const quoted = baileys.normalizeMessageContent(contextInfo?.quotedMessage)

        const quotedMessage: baileys.WAMessage = {
            key: {
                remoteJid: context.jid,
                id: contextInfo?.stanzaId,
                participant: contextInfo?.participant
            },
            message: contextInfo?.quotedMessage
        }

        const [source, isVideo] = own?.imageMessage
            ? [context.message, false]
            : own?.videoMessage
              ? [context.message, true]
              : quoted?.imageMessage
                ? [quotedMessage, false]
                : quoted?.videoMessage
                  ? [quotedMessage, true]
                  : [undefined, false]

        if (!source) {
            await context.reply(
                "Envie uma imagem, GIF ou vídeo com a legenda !sticker ou responda um deles com !sticker."
            )
            return
        }

        const media = await baileys.downloadMediaMessage(
            source,
            "buffer",
            {},
            { logger: pino({ level: "silent" }), reuploadRequest: context.client.socket.updateMediaMessage }
        )

        if (!isVideo) {
            const sticker = await createSticker(media, options)

            await context.client.socket.sendMessage(context.jid, { sticker }, { quoted: context.message })
            return
        }

        const sticker = await videoToAnimatedSticker(media, options).catch(async (error: NodeJS.ErrnoException) => {
            await context.reply(
                error.code === "ENOENT"
                    ? "Não foi possível criar o sticker animado: o ffmpeg não está instalado no servidor."
                    : "Não foi possível criar o sticker animado. Tente um vídeo mais curto ou mais simples."
            )
        })

        if (!sticker) return

        await context.client.socket.sendMessage(context.jid, { sticker, isAnimated: true }, { quoted: context.message })
    }
}
