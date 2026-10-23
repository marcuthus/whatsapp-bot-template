import { Command } from "../../interfaces/command/index.js"
import { Embed } from "../../utils/message/embed.js"

export const command: Command = {
    name: "ping",
    description: "Envia o ping do bot.",
    run: async (context) => {
        const startTime = Date.now()

        const sent = await context.reply("Calculando ping...")

        const ping = Date.now() - startTime

        const pingEmbed = new Embed()
            .setAuthor({ name: "WhatsApp Bot", emoji: "🤖" })
            .setTitle("🏓 Pong!")
            .setDescription(`Olá ${context.senderName}, meu ping está em \`${ping}ms\``)
            .setTimestamp()
            .setFooter({ text: "By Marcuth", emoji: "👨‍💻" })

        if (!sent) return

        await context.edit(sent, pingEmbed.build())
    }
}
