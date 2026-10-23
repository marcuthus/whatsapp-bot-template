import { execFile } from "node:child_process"
import { promisify } from "node:util"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"

const run = promisify(execFile)

const defaultTimeoutMs = 60_000

export async function withTempDirectory<T>(task: (directory: string) => Promise<T>) {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "media-"))

    try {
        return await task(directory)
    } finally {
        await fs.rm(directory, { recursive: true, force: true })
    }
}

export async function runFfmpeg(directory: string, args: string[], timeoutMs = defaultTimeoutMs) {
    await run(process.env.FFMPEG_PATH ?? "ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], {
        cwd: directory,
        timeout: timeoutMs
    })
}
