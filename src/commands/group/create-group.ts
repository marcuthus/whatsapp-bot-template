import { Command } from "../../interfaces/command/index.js"
import { isOwner } from "../../utils/command/identity.js"

export const command: Command = {
    name: "create-group",
    description:
        "Cria um grupo, adiciona você como admin e o trava para admins (apenas dono). Uso: !create-group <nome>",
    rawArguments: true,
    run: async (context) => {
        if (!(await isOwner(context))) {
            await context.reply("Você não possui permissão para usar este comando.")
            return
        }

        if (!context.args) {
            await context.reply("Informe o nome do grupo. Uso: !create-group <nome>")
            return
        }

        const owner = context.senderIds.find((id) => id.endsWith("@s.whatsapp.net")) ?? context.sender

        const metadata = await context.client.socket.groupCreate(context.args, [owner])

        await context.client.socket.groupParticipantsUpdate(metadata.id, [owner], "promote")
        await context.client.socket.groupSettingUpdate(metadata.id, "locked")
        await context.client.socket.groupMemberAddMode(metadata.id, "admin_add")

        await context.reply(
            `Grupo *${metadata.subject}* criado!\nID: \`${metadata.id}\`\n\nVocê é administrador. Somente administradores editam os dados do grupo e adicionam membros.`
        )
    }
}
