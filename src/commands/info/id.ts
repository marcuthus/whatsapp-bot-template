import { parsePrivateReply } from "../../utils/command/parse-private-reply.js"
import { Command } from "../../interfaces/command/index.js"

export const command: Command = {
    name: "id",
    description:
        "Mostra o seu ID ou o de quem for mencionado. Uso: !id [@pessoa] [private-reply: true|false, padrão true]",
    rawArguments: true,
    run: async (context) => {
        const { privateReply, rest, invalid } = parsePrivateReply(context.args)

        if (invalid || rest.length > 1) {
            await context.reply("Uso: !id [@pessoa] [private-reply: true|false]")
            return
        }

        const [mentioned] = context.mentionedJids

        const heading = mentioned ? "O ID da pessoa mencionada é" : "O seu ID de usuário é"
        const ids = mentioned ? [mentioned] : context.senderIds
        const text = `${heading}:\n${ids.map((id) => `\`${id}\``).join("\n")}`

        if (privateReply && context.isGroup) {
            await context.sendPrivately(text)
            await context.react("📩")
            return
        }

        await context.reply(text)
    }
}
