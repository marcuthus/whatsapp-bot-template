import * as baileys from "@whiskeysockets/baileys"

import { Client } from "../../client.js"

export interface ExtendedContext {
    client: Client
    message: baileys.WAMessage
    /** Chat JID (user or group) where the message was received. */
    jid: string
    /** JID of who sent the message. */
    sender: string
    /** Every known identifier of the sender (JID and LID), used for owner checks. */
    senderIds: string[]
    senderName: string
    isGroup: boolean
    text: string
    /** Text after the command name (empty when there is none). */
    args: string
    /** JIDs (or LIDs) mentioned in the message with @. */
    mentionedJids: string[]
    reply: (text: string) => Promise<baileys.WAMessage | undefined>
    send: (text: string) => Promise<baileys.WAMessage | undefined>
    /** Sends the text to the sender in a private chat (in a private chat it is the same as `send`). */
    sendPrivately: (text: string) => Promise<baileys.WAMessage | undefined>
    edit: (target: baileys.WAMessage, text: string) => Promise<void>
    react: (emoji: string) => Promise<void>
}
