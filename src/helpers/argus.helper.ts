import { Argus } from "@marcuth/argus"

import { configHelper } from "./config.helper.js"

export const argus = new Argus({
    prefix: configHelper.commands.prefix,
    argumentSeparator: configHelper.commands.argumentsSeparator
})
