import fs from "node:fs/promises"
import path from "node:path"

import { runFfmpeg, withTempDirectory } from "./ffmpeg.js"

const stickerSize = 512
const maxDurationSeconds = 10
const maxStickerBytes = 500 * 1024

// From the best to the smallest output; the first one that fits the WhatsApp limit wins.
const attempts = [
    { fps: 15, quality: 60 },
    { fps: 12, quality: 45 },
    { fps: 10, quality: 30 },
    { fps: 8, quality: 20 }
]

export interface VideoStickerOptions {
    crop?: "true" | "false" | "dented"
    center?: "true" | "false"
}

export function buildStickerFilter(options: VideoStickerOptions, fps: number) {
    const centered = options.center !== "false"
    const size = stickerSize

    if (options.crop === "dented") {
        return `fps=${fps},scale=${size}:${size}`
    }

    if (options.crop === "false") {
        const offset = centered ? "(ow-iw)/2:(oh-ih)/2" : "0:0"

        return `fps=${fps},scale=${size}:${size}:force_original_aspect_ratio=decrease,format=rgba,pad=${size}:${size}:${offset}:color=black@0`
    }

    const origin = centered ? "" : ":0:0"

    return `fps=${fps},scale=${size}:${size}:force_original_aspect_ratio=increase,crop=${size}:${size}${origin}`
}

export async function videoToAnimatedSticker(video: Buffer, options: VideoStickerOptions) {
    return withTempDirectory(async (directory) => {
        await fs.writeFile(path.join(directory, "input"), video)

        let smallest: Buffer | undefined

        for (const attempt of attempts) {
            await runFfmpeg(directory, [
                ...["-t", String(maxDurationSeconds), "-i", "input"],
                ...["-vf", buildStickerFilter(options, attempt.fps)],
                ...["-c:v", "libwebp", "-q:v", String(attempt.quality), "-loop", "0", "-an", "out.webp"]
            ])

            const output = await fs.readFile(path.join(directory, "out.webp"))

            if (output.length <= maxStickerBytes) return output

            smallest = output
        }

        throw new Error(`O sticker animado ficou com ${smallest?.length} bytes (limite: ${maxStickerBytes}).`)
    })
}
