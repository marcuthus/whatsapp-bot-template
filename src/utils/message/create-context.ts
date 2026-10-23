import * as baileys from "@whiskeysockets/baileys"

import { ExtendedContext } from "../../interfaces/context/index.js"
import { Client } from "../../client.js"

export function extractText(message: baileys.WAMessage) {
    const content = baileys.normalizeMessageContent(message.message)

    return (
        content?.conversation ??
        content?.extendedTextMessage?.text ??
        content?.imageMessage?.caption ??
        content?.videoMessage?.caption ??
        ""
    )
}

export function extractMentionedJids(message: baileys.WAMessage) {
    const content = baileys.normalizeMessageContent(message.message)
    const type = content ? baileys.getContentType(content) : undefined
    const body = type ? (content?.[type] as { contextInfo?: baileys.proto.IContextInfo } | undefined) : undefined

    return body?.contextInfo?.mentionedJid ?? []
}

export function createContext(client: Client, message: baileys.WAMessage): ExtendedContext {
    const jid = message.key.remoteJid!
    const isGroup = baileys.isJidGroup(jid) === true

    const senderIds = [
        isGroup ? message.key.participant : jid,
        isGroup ? message.key.participantAlt : message.key.remoteJidAlt
    ].filter((id): id is string => !!id)

    async function send(text: string, quoted?: baileys.WAMessage) {
        return client.socket.sendMessage(jid, { text }, { quoted })
    }

    return {
        client,
        message,
        jid,
        sender: senderIds[0] ?? jid,
        senderIds,
        senderName: message.pushName ?? "usuário",
        isGroup,
        text: extractText(message),
        args: extractText(message).split(/s+/).slice(1).join(" "),
        mentionedJids: extractMentionedJids(message),
        reply: (text) => send(text, message),
        send: (text) => send(text),
        edit: async (target, text) => {
            await client.socket.sendMessage(jid, { text, edit: target.key })
        },
        react: async (emoji) => {
            await client.socket.sendMessage(jid, { react: { text: emoji, key: message.key } })
        }
    }
}
