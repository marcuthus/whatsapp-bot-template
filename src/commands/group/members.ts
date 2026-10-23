import { Command } from "../../interfaces/command/index.js"
import { Embed } from "../../utils/message/embed.js"

const membersPerMessage = 40

export const command: Command = {
    name: "members",
    description: "Lista os membros do grupo e revela seus IDs.",
    run: async (context) => {
        if (!context.isGroup) {
            await context.reply("Este comando só funciona em grupos.")
            return
        }

        const metadata = await context.client.socket.groupMetadata(context.jid)

        const lines = metadata.participants.map((participant, index) => {
            const role = participant.admin ? "👑 " : ""
            const phone = participant.phoneNumber ? ` | tel: \`${participant.phoneNumber}\`` : ""

            return `${index + 1}. ${role}\`${participant.id}\`${phone}`
        })

        for (let start = 0; start < lines.length; start += membersPerMessage) {
            const page = lines.slice(start, start + membersPerMessage)

            const membersEmbed = new Embed()
                .setTitle(`👥 ${metadata.subject} (${lines.length} membros)`)
                .setDescription(page.join("\n"))

            await context.send(membersEmbed.build())
        }
    }
}
