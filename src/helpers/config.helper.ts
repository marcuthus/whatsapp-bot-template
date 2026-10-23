import { env } from "@marcuth/env"

export const configHelper = {
    commands: {
        prefix: "!",
        argumentsSeparator: " "
    },
    auth: {
        directory: "auth",
        // Optional: when set, the bot asks for a pairing code instead of printing a QR code.
        pairingNumber: env("WHATSAPP_PAIRING_NUMBER", false) || undefined
    },
    admin: {
        number: env("WHATSAPP_ADMIN_NUMBER")
    }
}
