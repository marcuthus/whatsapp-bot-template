import { configHelper } from "../../helpers/config.helper.js"
import { Command } from "../../interfaces/command/index.js"
import { Embed } from "../../utils/message/embed.js"

export const command: Command = {
    name: "help",
    description: "Lista os comandos disponíveis.",
    run: async (context) => {
        const fields = Array.from(context.client.commands.values()).map((command) => ({
            name: `${configHelper.commands.prefix}${command.name}`,
            value: command.description
        }))

        const helpEmbed = new Embed().setTitle("📖 Comandos").setFields(fields)

        await context.reply(helpEmbed.build())
    }
}
