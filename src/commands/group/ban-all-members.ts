import { requireGroupAdmin } from "../../utils/command/require-group-admin.js"
import { Command } from "../../interfaces/command/index.js"

const batchSize = 50
const maxListedFailures = 20

export function buildReport(removed: number, failures: { user: string; reason: string }[]) {
    const lines = [`✅ *Removidos:* ${removed}`]

    if (failures.length > 0) {
        lines.push(
            "",
            `❌ *Falharam (${failures.length}):*`,
            ...failures.slice(0, maxListedFailures).map((failure) => `• \`${failure.user}\` - ${failure.reason}`)
        )

        if (failures.length > maxListedFailures) {
            lines.push(`• ... e mais ${failures.length - maxListedFailures}`)
        }
    }

    return lines.join("\n")
}

export const command: Command = {
    name: "ban-all-members",
    description:
        "Bane todos os membros que não são administradores (apenas administradores). Uso: !ban-all-members confirm",
    rawArguments: true,
    run: async (context) => {
        const metadata = await requireGroupAdmin(context)

        if (!metadata) return

        const targets = metadata.participants
            .filter(
                (participant) =>
                    !participant.admin &&
                    ![participant.id, participant.lid, participant.phoneNumber].some(
                        (id) => id && context.senderIds.includes(id)
                    )
            )
            .map((participant) => participant.id)

        if (targets.length === 0) {
            await context.reply("Não há membros para banir: só restam administradores.")
            return
        }

        if (context.args.trim().toLowerCase() !== "confirm") {
            await context.reply(
                `⚠️ Isto removerá *${targets.length}* membros (administradores e você são poupados). Para continuar, envie:\n!ban-all-members confirm`
            )
            return
        }

        let removed = 0
        const failures: { user: string; reason: string }[] = []

        for (let start = 0; start < targets.length; start += batchSize) {
            const batch = targets.slice(start, start + batchSize)

            try {
                const results = await context.client.socket.groupParticipantsUpdate(context.jid, batch, "remove")

                for (const [index, participant] of batch.entries()) {
                    const result = results.find((item) => item.jid === participant) ?? results[index]

                    if (result?.status === "200") {
                        removed++
                    } else {
                        failures.push({ user: participant, reason: `status ${result?.status ?? "desconhecido"}` })
                    }
                }
            } catch (error) {
                failures.push(...batch.map((user) => ({ user, reason: String(error) })))
            }
        }

        await context.reply(buildReport(removed, failures))
    }
}
