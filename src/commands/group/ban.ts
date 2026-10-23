import { z } from "zod"

import { isBotOwnerId } from "../../utils/command/is-owner-id.js"
import { Command } from "../../interfaces/command/index.js"

// Arguments are positional: `!ban @mention` (the mention itself is read from the message, not from the text)
const schema = z.object({
    mention: z.string().optional()
})

export const command: Command<typeof schema> = {
    name: "ban",
    description: "Bane um membro do grupo (apenas administradores). Uso: !ban @pessoa",
    schema: schema,
    run: async (context) => {
        if (!context.isGroup) {
            await context.reply("Este comando só funciona em grupos.")
            return
        }

        const [target] = context.mentionedJids

        if (!target) {
            await context.reply("Mencione quem deve ser banido. Uso: !ban @pessoa")
            return
        }

        const metadata = await context.client.socket.groupMetadata(context.jid)

        const isGroupAdmin = metadata.participants.some(
            (participant) =>
                participant.admin &&
                [participant.id, participant.lid, participant.phoneNumber].some(
                    (id) => id && context.senderIds.includes(id)
                )
        )

        if (!isGroupAdmin && !isBotOwnerId(context.senderIds)) {
            await context.reply("Você não possui permissão para usar este comando.")
            return
        }

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
