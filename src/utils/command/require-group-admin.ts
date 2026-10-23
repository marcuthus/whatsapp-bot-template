import * as baileys from "@whiskeysockets/baileys"

import { ExtendedContext } from "../../interfaces/context/index.js"

import { isOwner } from "./identity.js"

export async function requireGroupAdmin(context: ExtendedContext): Promise<baileys.GroupMetadata | undefined> {
    if (!context.isGroup) {
        await context.reply("Este comando só funciona em grupos.")
        return undefined
    }

    const metadata = await context.client.socket.groupMetadata(context.jid)

    const isGroupAdmin = metadata.participants.some(
        (participant) =>
            participant.admin &&
            [participant.id, participant.lid, participant.phoneNumber].some(
                (id) => id && context.senderIds.includes(id)
            )
    )

    if (!isGroupAdmin && !(await isOwner(context, metadata))) {
        await context.reply("Você não possui permissão para usar este comando.")
        return undefined
    }

    return metadata
}
