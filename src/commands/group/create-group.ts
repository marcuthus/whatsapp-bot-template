import { isBotOwnerId } from "../../utils/command/is-owner-id.js"
import { Command } from "../../interfaces/command/index.js"

export const command: Command = {
    name: "create-group",
    description: "Cria um grupo e adiciona você (apenas dono). Uso: !create-group <nome>",
    rawArguments: true,
    run: async (context) => {
        if (!isBotOwnerId(context.senderIds)) {
            await context.reply("Você não possui permissão para usar este comando.")
            return
        }

        if (!context.args) {
            await context.reply("Informe o nome do grupo. Uso: !create-group <nome>")
            return
        }

        const owner = context.senderIds.find((id) => id.endsWith("@s.whatsapp.net")) ?? context.sender

        const metadata = await context.client.socket.groupCreate(context.args, [owner])

        await context.reply(`Grupo *${metadata.subject}* criado!\nID: \`${metadata.id}\``)
    }
}
