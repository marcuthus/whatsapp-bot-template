import { z } from "zod"

import { requireGroupAdmin } from "../../utils/command/require-group-admin.js"
import { extractQuotedContactNumbers } from "../../utils/message/vcard.js"
import { Command } from "../../interfaces/command/index.js"

// Arguments are positional: `!add-member [number]` (contacts come from the message being replied to)
const schema = z.object({
    number: z.string().optional()
})

const failureReasons: Record<string, string> = {
    "403": "privacidade do contato (use !invite)",
    "408": "saiu do grupo recentemente",
    "409": "já está no grupo"
}

export const command: Command<typeof schema> = {
    name: "add-member",
    description:
        "Adiciona ao grupo um número ou os contatos da mensagem respondida (apenas administradores). Uso: !add-member <número> ou responda um contato com !add-member",
    schema: schema,
    run: async (context, options) => {
        const typed = options.number?.replace(/\D/g, "")

        if (typed !== undefined && (typed.length < 8 || typed.length > 15)) {
            await context.reply("Informe o número com código do país, apenas dígitos. Ex.: !add-member 5511999999999")
            return
        }

        const numbers = Array.from(
            new Set([...(typed ? [typed] : []), ...extractQuotedContactNumbers(context.message)])
        )

        if (numbers.length === 0) {
            await context.reply(
                "Informe um número (!add-member 5511999999999) ou responda uma mensagem de contato com !add-member."
            )
            return
        }

        if (!(await requireGroupAdmin(context))) return

        const results = await context.client.socket.groupParticipantsUpdate(
            context.jid,
            numbers.map((number) => `${number}@s.whatsapp.net`),
            "add"
        )

        const outcomes = numbers.map((number, index) => {
            const result = results.find((item) => item.jid?.startsWith(`${number}@`)) ?? results[index]
            const status = result?.status ?? "sem resposta"

            return { number, status }
        })

        const added = outcomes.filter((outcome) => outcome.status === "200")
        const failed = outcomes.filter((outcome) => outcome.status !== "200")

        const lines: string[] = []

        if (added.length > 0) {
            lines.push(`✅ *Adicionados (${added.length}):*`, ...added.map((outcome) => `• \`${outcome.number}\``))
        }

        if (failed.length > 0) {
            if (lines.length > 0) lines.push("")

            lines.push(
                `❌ *Falharam (${failed.length}):*`,
                ...failed.map(
                    (outcome) =>
                        `• \`${outcome.number}\` - ${failureReasons[outcome.status] ?? `erro ${outcome.status}`}`
                )
            )
        }

        await context.reply(lines.join("\n"))
    }
}
