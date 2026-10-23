export interface PrivateReplyArguments {
    privateReply: boolean
    rest: string[]
    invalid?: string
}

const flagPattern = /^(?:private-reply=)?(true|false)$/i

// Accepts `true`/`false` or `private-reply=true|false` anywhere in the arguments (default: true).
export function parsePrivateReply(args: string): PrivateReplyArguments {
    const result: PrivateReplyArguments = { privateReply: true, rest: [] }

    for (const token of args.split(/\s+/).filter(Boolean)) {
        const match = token.match(flagPattern)

        if (match) {
            result.privateReply = match[1].toLowerCase() === "true"
        } else if (/^private-reply=/i.test(token)) {
            result.invalid = token
        } else {
            result.rest.push(token)
        }
    }

    return result
}
