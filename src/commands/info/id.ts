import { z } from "zod"

import { Command } from "../../interfaces/command/index.js"

// Arguments are positional: `!id [@mention]` (the mention itself is read from the message, not from the text)
const schema = z.object({
    mention: z.string().optional()
})

export const command: Command<typeof schema> = {
    name: "id",
    description: "Mostra o seu ID ou o de quem for mencionado. Uso: !id [@pessoa]",
    schema: schema,
    run: async (context) => {
        const [mentioned] = context.mentionedJids

        const heading = mentioned ? "O ID da pessoa mencionada é" : "O seu ID de usuário é"
        const ids = mentioned ? [mentioned] : context.senderIds

        await context.reply(`${heading}:\n${ids.map((id) => `\`${id}\``).join("\n")}`)
    }
}
