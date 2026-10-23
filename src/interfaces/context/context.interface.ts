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
    reply: (text: string) => Promise<baileys.WAMessage | undefined>
    send: (text: string) => Promise<baileys.WAMessage | undefined>
    edit: (target: baileys.WAMessage, text: string) => Promise<void>
    react: (emoji: string) => Promise<void>
}
