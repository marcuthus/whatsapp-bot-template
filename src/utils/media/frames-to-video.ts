import { execFile } from "node:child_process"
import { promisify } from "node:util"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"

const run = promisify(execFile)

const framesPerSecond = 25
const timeoutMs = 60_000

export interface VideoFrame {
    png: Buffer
    delayMs: number
}

export function buildConcatList(frames: VideoFrame[]) {
    const lines = frames.flatMap((frame, index) => [
        `file 'frame-${index}.png'`,
        `duration ${(frame.delayMs / 1000).toFixed(3)}`
    ])

    // The concat demuxer ignores the duration of the last entry unless the file is repeated.
    lines.push(`file 'frame-${frames.length - 1}.png'`)

    return lines.join("\n")
}

export async function framesToMp4(frames: VideoFrame[]) {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "sticker-"))

    try {
        await Promise.all(
            frames.map((frame, index) => fs.writeFile(path.join(directory, `frame-${index}.png`), frame.png))
        )
        await fs.writeFile(path.join(directory, "list.txt"), buildConcatList(frames))

        await run(
            process.env.FFMPEG_PATH ?? "ffmpeg",
            [
                ...["-y", "-hide_banner", "-loglevel", "error"],
                ...["-f", "concat", "-safe", "0", "-i", "list.txt"],
                ...["-vf", `fps=${framesPerSecond},scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p`],
                ...["-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-an", "-movflags", "+faststart"],
                "out.mp4"
            ],
            { cwd: directory, timeout: timeoutMs }
        )

        return await fs.readFile(path.join(directory, "out.mp4"))
    } finally {
        await fs.rm(directory, { recursive: true, force: true })
    }
}
