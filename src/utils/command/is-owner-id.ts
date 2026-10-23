import * as baileys from "@whiskeysockets/baileys"

import { configHelper } from "../../helpers/config.helper.js"

import { sameNumber } from "./phone.js"

export function isBotOwnerId(ids: string[]) {
    return ids.some((id) => sameNumber(baileys.jidDecode(id)?.user ?? id, configHelper.admin.number))
}
