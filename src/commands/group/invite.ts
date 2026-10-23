import { z } from "zod"

import { requireGroupAdmin } from "../../utils/command/require-group-admin.js"
import { Command } from "../../interfaces/command/index.js"

// Arguments are positional: `!invite [number]`
const schema = z.object({
    number: z.string().optional()
})

export const command: Command<typeof schema> = {
    name: "invite",
    description: "Mostra o link de convite do grupo, ou o envia no privado. Uso: !invite [número]",
    schema: schema,
    run: async (context, options) => {
        const metadata = await requireGroupAdmin(context)

        if (!metadata) return

        const code = await context.client.socket.groupInviteCode(context.jid)

        if (!code) {
            await context.reply("Não foi possível gerar o link. O bot precisa ser administrador do grupo.")
            return
        }

        const link = `https://chat.whatsapp.com/${code}`

        if (!options.number) {
            await context.reply(`Link de convite de *${metadata.subject}*:\n${link}`)
            return
        }

        const number = options.number.replace(/\D/g, "")

        if (number.length < 8 || number.length > 15) {
            await context.reply("Informe o número com código do país, apenas dígitos. Ex.: !invite 5511999999999")
            return
        }

        await context.client.socket.sendMessage(`${number}@s.whatsapp.net`, {
            text: `Você foi convidado para o grupo *${metadata.subject}*:\n${link}`
        })

        await context.reply(`Convite enviado para \`${number}\`.`)
    }
}
