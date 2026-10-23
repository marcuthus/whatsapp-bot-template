import { configHelper } from "../../helpers/config.helper.js"
import { Command } from "../../interfaces/command/index.js"
import { Embed } from "../../utils/message/embed.js"

const categoryLabels: Record<string, string> = {
    info: "ℹ️ Informações",
    example: "🧪 Exemplos",
    group: "👥 Grupo",
    media: "🖼️ Mídia",
    admin: "🔐 Administração"
}

export const command: Command = {
    name: "menu",
    description: "Exibe o menu de comandos por categoria.",
    run: async (context) => {
        const groups = new Map<string, string[]>()

        for (const command of context.client.commands.values()) {
            const category = context.client.commandCategories.get(command.name) ?? "other"
            const lines = groups.get(category) ?? []

            lines.push(`• \`${configHelper.commands.prefix}${command.name}\` - ${command.description}`)
            groups.set(category, lines)
        }

        const fields = Array.from(groups.entries()).map(([category, lines]) => ({
            name: categoryLabels[category] ?? category,
            value: lines.join("\n")
        }))

        const menuEmbed = new Embed()
            .setAuthor({ name: "WhatsApp Bot", emoji: "🤖" })
            .setTitle("📋 Menu")
            .setDescription(`Olá ${context.senderName}, estes são os meus comandos:`)
            .setFields(fields)
            .setFooter({ text: "By Marcuth", emoji: "👨‍💻" })

        await context.reply(menuEmbed.build())
    }
}
