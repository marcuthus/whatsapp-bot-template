import * as baileys from "@whiskeysockets/baileys"

import { requireGroupAdmin } from "../../utils/command/require-group-admin.js"
import { Command } from "../../interfaces/command/index.js"

const mentionsPerMessage = 100
const defaultAnnouncement = "📢 Atenção, pessoal!"

export function buildPages(announcement: string, users: string[]) {
    const pages: string[] = []

    for (let start = 0; start < users.length; start += mentionsPerMessage) {
        const mentions = users
            .slice(start, start + mentionsPerMessage)
            .map((user) => `@${user}`)
            .join(" ")

        pages.push(start === 0 ? `${announcement}\n\n${mentions}` : mentions)
    }

    return pages
}

export const command: Command = {
    name: "everyone",
    description: "Menciona todos os membros do grupo (apenas administradores). Uso: !everyone [mensagem]",
    rawArguments: true,
    run: async (context) => {
        const metadata = await requireGroupAdmin(context)

        if (!metadata) return

        const participants = metadata.participants.map((participant) => participant.id)
        const users = participants.map((id) => baileys.jidDecode(id)?.user ?? id)
        const pages = buildPages(context.args || defaultAnnouncement, users)

        for (const [index, text] of pages.entries()) {
            const start = index * mentionsPerMessage

            await context.client.socket.sendMessage(context.jid, {
                text,
                mentions: participants.slice(start, start + mentionsPerMessage)
            })
        }
    }
}
