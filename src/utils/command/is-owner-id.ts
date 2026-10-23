import * as baileys from "@whiskeysockets/baileys"

import { configHelper } from "../../helpers/config.helper.js"

export function isBotOwnerId(ids: string[]) {
    return ids.some((id) => baileys.jidDecode(id)?.user === configHelper.admin.number)
}
