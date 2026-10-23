import { z } from "zod"

import { requireGroupAdmin } from "../../utils/command/require-group-admin.js"
import { Command } from "../../interfaces/command/index.js"

// Arguments are positional: `!ban-member @mention` (the mention itself is read from the message, not from the text)
const schema = z.object({
    mention: z.string().optional()
})

export const command: Command<typeof schema> = {
    name: "ban-member",
    description: "Bane um membro do grupo (apenas administradores). Uso: !ban-member @pessoa",
    schema: schema,
    run: async (context) => {
        const [target] = context.mentionedJids

        if (!target) {
            await context.reply("Mencione quem deve ser banido. Uso: !ban-member @pessoa")
            return
        }

        if (!(await requireGroupAdmin(context))) return

        if (context.senderIds.includes(target)) {
            await context.reply("Você não pode banir a si mesmo.")
            return
        }

        const [result] = await context.client.socket.groupParticipantsUpdate(context.jid, [target], "remove")

        if (result?.status === "200") {
            await context.reply(`\`${target}\` foi removido do grupo.`)
            return
        }

        await context.reply(
            `Não foi possível banir \`${target}\` (status ${result?.status ?? "desconhecido"}). O bot precisa ser administrador do grupo.`
        )
    }
}
