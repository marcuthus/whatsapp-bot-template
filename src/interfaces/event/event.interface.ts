import * as baileys from "@whiskeysockets/baileys"

import { EventType } from "../../enums/index.js"
import { Client } from "../../client.js"

type RunFunc<K extends keyof baileys.BaileysEventMap> = (
    client: Client,
    data: baileys.BaileysEventMap[K]
) => Promise<void>

export interface Event<K extends keyof baileys.BaileysEventMap = keyof baileys.BaileysEventMap> {
    name: K
    type: EventType | `${EventType}`
    run: RunFunc<K>
}

// Events with different names must share one registry type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyEvent = Event<any>
