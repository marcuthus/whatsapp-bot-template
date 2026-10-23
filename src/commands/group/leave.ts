import { requireGroupAdmin } from "../../utils/command/require-group-admin.js"
import { Command } from "../../interfaces/command/index.js"

export const command: Command = {
    name: "leave",
    description: "Faz o bot sair do grupo (apenas administradores).",
    run: async (context) => {
        if (!(await requireGroupAdmin(context))) return

        await context.send("Até mais! 👋")
        await context.client.socket.groupLeave(context.jid)
    }
}
