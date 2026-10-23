import * as baileys from "@whiskeysockets/baileys"

const phoneLength = { min: 8, max: 15 }

function isPhoneNumber(value: string) {
    return value.length >= phoneLength.min && value.length <= phoneLength.max
}

export function extractPhoneNumbers(vcard: string) {
    const numbers = new Set<string>()

    for (const line of vcard.split(/\r?\n/)) {
        if (!/^(item\d+\.)?TEL/i.test(line)) continue

        const waid = line.match(/waid=(\d+)/i)?.[1]
        const digits = waid ?? line.slice(line.lastIndexOf(":") + 1).replace(/\D/g, "")

        if (isPhoneNumber(digits)) numbers.add(digits)
    }

    return Array.from(numbers)
}

export function extractQuotedContactNumbers(message: baileys.WAMessage) {
    const own = baileys.normalizeMessageContent(message.message)
    const contextInfo = own?.extendedTextMessage?.contextInfo
    const quoted = baileys.normalizeMessageContent(contextInfo?.quotedMessage)

    const vcards = [
        quoted?.contactMessage?.vcard,
        ...(quoted?.contactsArrayMessage?.contacts?.map((contact) => contact.vcard) ?? [])
    ].filter((vcard): vcard is string => !!vcard)

    return Array.from(new Set(vcards.flatMap(extractPhoneNumbers)))
}
