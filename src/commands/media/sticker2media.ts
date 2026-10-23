import * as baileys from "@whiskeysockets/baileys"
import sharp from "sharp"
import pino from "pino"

import { framesToMp4, VideoFrame } from "../../utils/media/frames-to-video.js"
import { Command } from "../../interfaces/command/index.js"

const minFrameDelayMs = 20
const defaultFrameDelayMs = 100
const maxFrames = 300

export type StickerMedia = { type: "image"; buffer: Buffer } | { type: "video"; buffer: Buffer }

async function toFlatPng(sticker: Buffer, page: number) {
    return sharp(sticker, { page }).flatten({ background: "#ffffff" }).png().toBuffer()
}

export async function convertSticker(sticker: Buffer): Promise<StickerMedia> {
    const metadata = await sharp(sticker, { pages: -1 }).metadata()
    const pages = Math.min(metadata.pages ?? 1, maxFrames)

    if (pages <= 1) {
        return { type: "image", buffer: await toFlatPng(sticker, 0) }
    }

    const frames: VideoFrame[] = await Promise.all(
        Array.from({ length: pages }, async (_, page) => ({
            png: await toFlatPng(sticker, page),
            delayMs: Math.max(metadata.delay?.[page] || defaultFrameDelayMs, minFrameDelayMs)
        }))
    )

    return { type: "video", buffer: await framesToMp4(frames) }
}

export const command: Command = {
    name: "sticker2media",
    description:
        "Transforma um sticker em imagem (ou em vídeo, se for animado). Responda um sticker com !sticker2media.",
    run: async (context) => {
        const own = baileys.normalizeMessageContent(context.message.message)
        const contextInfo = own?.extendedTextMessage?.contextInfo
        const quoted = baileys.normalizeMessageContent(contextInfo?.quotedMessage)

        if (!quoted?.stickerMessage) {
            await context.reply("Responda um sticker com !sticker2media.")
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

        const media = await convertSticker(sticker).catch(async (error: NodeJS.ErrnoException) => {
            await context.reply(
                error.code === "ENOENT"
                    ? "Não foi possível converter o sticker animado: o ffmpeg não está instalado no servidor."
                    : "Não foi possível converter este sticker."
            )
        })

        if (!media) return

        if (media.type === "image") {
            await context.client.socket.sendMessage(context.jid, { image: media.buffer }, { quoted: context.message })
            return
        }

        await context.client.socket.sendMessage(
            context.jid,
            { video: media.buffer, mimetype: "video/mp4", gifPlayback: true },
            { quoted: context.message }
        )
    }
}
