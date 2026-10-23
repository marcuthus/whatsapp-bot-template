import { z } from "zod"

import { ExtendedContext } from "../context/index.js"

type RunFunc<T extends z.ZodObject> = (context: ExtendedContext, options: z.infer<T>) => Promise<void>

export interface Command<T extends z.ZodObject = z.ZodObject> {
    name: string
    description: string
    schema?: T
    // Skips the Argus validation, so free text can be read from `context.args`.
    rawArguments?: boolean
    run: RunFunc<T>
}

// Commands with different schemas must share one registry type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyCommand = Command<any>
