import { parsePrivateReply } from "../../utils/command/parse-private-reply.js"
import { Command } from "../../interfaces/command/index.js"

export const command: Command = {
    name: "group-id",
    description: "Mostra o ID do grupo. Uso: !group-id [private-reply: true|false, padrão true]",
    rawArguments: true,
    run: async (context) => {
        const { privateReply, rest, invalid } = parsePrivateReply(context.args)

        if (invalid || rest.length > 0) {
            await context.reply("Uso: !group-id [private-reply: true|false]")
            return
        }

        if (!context.isGroup) {
            await context.reply("Este comando só funciona em grupos.")
            return
        }

        const text = `O ID deste grupo é:\n\`${context.jid}\``

        if (privateReply) {
            await context.sendPrivately(text)
            await context.react("📩")
            return
        }

        await context.reply(text)
    }
}
