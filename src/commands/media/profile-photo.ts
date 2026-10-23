import * as baileys from "@whiskeysockets/baileys"
import { z } from "zod"

import { Command } from "../../interfaces/command/index.js"

// Arguments are positional: `!profile-photo [@mention]` (the mention itself is read from the message, not from the text)
const schema = z.object({
    mention: z.string().optional()
})

export const command: Command<typeof schema> = {
    name: "profile-photo",
    description: "Envia a sua foto de perfil ou a da pessoa mencionada. Uso: !profile-photo [@pessoa]",
    schema: schema,
    run: async (context) => {
        const [mentioned] = context.mentionedJids

        const target = mentioned ?? context.senderIds.find((id) => id.endsWith("@s.whatsapp.net")) ?? context.sender

        const url = await context.client.socket.profilePictureUrl(target, "image").catch(() => undefined)

        if (!url) {
            await context.reply(
                mentioned
                    ? "Não foi possível obter a foto de perfil: a pessoa não tem foto ou ela está privada."
                    : "Não foi possível obter a sua foto de perfil: você não tem foto ou ela está privada."
            )
            return
        }

        const user = baileys.jidDecode(target)?.user ?? target

        await context.client.socket.sendMessage(
            context.jid,
            {
                image: { url },
                caption: mentioned ? `Foto de perfil de @${user}` : "Sua foto de perfil",
                mentions: mentioned ? [mentioned] : []
            },
            { quoted: context.message }
        )
    }
}
