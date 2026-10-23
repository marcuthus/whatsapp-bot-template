import fs from "node:fs/promises"
import path from "node:path"

import { runFfmpeg, withTempDirectory } from "./ffmpeg.js"

const framesPerSecond = 25

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
    return withTempDirectory(async (directory) => {
        await Promise.all(
            frames.map((frame, index) => fs.writeFile(path.join(directory, `frame-${index}.png`), frame.png))
        )
        await fs.writeFile(path.join(directory, "list.txt"), buildConcatList(frames))

        await runFfmpeg(directory, [
            ...["-f", "concat", "-safe", "0", "-i", "list.txt"],
            ...["-vf", `fps=${framesPerSecond},scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p`],
            ...["-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-an", "-movflags", "+faststart"],
            "out.mp4"
        ])

        return fs.readFile(path.join(directory, "out.mp4"))
    })
}
