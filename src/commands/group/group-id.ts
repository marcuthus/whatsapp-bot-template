import { Command } from "../../interfaces/command/index.js"

export const command: Command = {
    name: "group-id",
    description: "Mostra o ID do grupo.",
    run: async (context) => {
        if (!context.isGroup) {
            await context.reply("Este comando só funciona em grupos.")
            return
        }

        await context.reply(`O ID deste grupo é:\n\`${context.jid}\``)
    }
}
