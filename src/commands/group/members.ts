import { parsePrivateReply } from "../../utils/command/parse-private-reply.js"
import { Command } from "../../interfaces/command/index.js"
import { Embed } from "../../utils/message/embed.js"

const membersPerMessage = 40

export const command: Command = {
    name: "members",
    description: "Lista os membros do grupo e revela seus IDs. Uso: !members [private-reply: true|false, padrão true]",
    rawArguments: true,
    run: async (context) => {
        const { privateReply, rest, invalid } = parsePrivateReply(context.args)

        if (invalid || rest.length > 0) {
            await context.reply("Uso: !members [private-reply: true|false]")
            return
        }

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

            await (privateReply ? context.sendPrivately(membersEmbed.build()) : context.send(membersEmbed.build()))
        }

        if (privateReply) await context.react("📩")
    }
}
