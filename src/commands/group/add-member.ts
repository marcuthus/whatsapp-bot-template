import { z } from "zod"

import { requireGroupAdmin } from "../../utils/command/require-group-admin.js"
import { Command } from "../../interfaces/command/index.js"

// Arguments are positional: `!add-member <number>`
const schema = z.object({
    number: z.string()
})

const statusMessages: Record<string, string> = {
    "200": "foi adicionado ao grupo.",
    "403": "não pôde ser adicionado diretamente (privacidade). Envie um convite com !invite.",
    "408": "saiu do grupo recentemente e não pôde ser adicionado.",
    "409": "já está no grupo."
}

export const command: Command<typeof schema> = {
    name: "add-member",
    description: "Adiciona um número ao grupo (apenas administradores). Uso: !add-member <número>",
    schema: schema,
    run: async (context, options) => {
        const number = options.number.replace(/\D/g, "")

        if (number.length < 8 || number.length > 15) {
            await context.reply("Informe o número com código do país, apenas dígitos. Ex.: !add-member 5511999999999")
            return
        }

        if (!(await requireGroupAdmin(context))) return

        const [result] = await context.client.socket.groupParticipantsUpdate(
            context.jid,
            [`${number}@s.whatsapp.net`],
            "add"
        )

        const status = result?.status ?? "desconhecido"
        const outcome = statusMessages[status] ?? `não pôde ser adicionado (status ${status}).`

        await context.reply(`\`${number}\` ${outcome}`)
    }
}
