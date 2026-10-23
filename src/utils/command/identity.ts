import * as baileys from "@whiskeysockets/baileys"

import { ExtendedContext } from "../../interfaces/context/index.js"
import { createScopedLogger } from "../../helpers/logger.helper.js"

import { isBotOwnerId } from "./is-owner-id.js"
import { sameNumber } from "./phone.js"

const logger = createScopedLogger("client")

export type Protection = "bot" | "owner"

function userOf(id: string) {
    return baileys.jidDecode(id)?.user ?? id
}

export async function resolveNumbers(context: ExtendedContext, ids: string[]) {
    const numbers = new Set<string>()

    for (const id of ids) {
        numbers.add(userOf(id))

        if (!id.endsWith("@lid")) continue

        const phone = await context.client.socket.signalRepository.lidMapping.getPNForLID(id).catch(() => null)

        if (phone) numbers.add(userOf(phone))
    }

    return Array.from(numbers)
}

export function botIds(context: ExtendedContext) {
    const { id, lid } = context.client.socket.user ?? {}

    return [id, lid].filter((value): value is string => !!value).map(userOf)
}

export function identitiesIn(metadata: baileys.GroupMetadata | undefined, id: string) {
    const participant = metadata?.participants.find((candidate) =>
        [candidate.id, candidate.lid, candidate.phoneNumber].some((known) => known && userOf(known) === userOf(id))
    )

    return participant ? [participant.id, participant.lid, participant.phoneNumber].filter((known) => !!known) : []
}

export async function identitiesOf(context: ExtendedContext, metadata: baileys.GroupMetadata | undefined, id: string) {
    return resolveNumbers(context, [id, ...identitiesIn(metadata, id)] as string[])
}

export async function isOwner(context: ExtendedContext, metadata?: baileys.GroupMetadata) {
    for (const sender of context.senderIds) {
        if (isBotOwnerId(await identitiesOf(context, metadata, sender))) return true
    }

    logger.debug(`The sender ${JSON.stringify(context.senderIds)} is not the bot owner.`)

    return false
}

export async function protectionOf(
    context: ExtendedContext,
    metadata: baileys.GroupMetadata | undefined,
    target: string
): Promise<Protection | undefined> {
    const identities = await identitiesOf(context, metadata, target)

    if (identities.some((identity) => botIds(context).some((bot) => sameNumber(identity, bot)))) return "bot"

    return isBotOwnerId(identities) ? "owner" : undefined
}
