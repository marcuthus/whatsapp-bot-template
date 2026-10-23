# AGENTS.md - WhatsApp Bot Template

## Build/Lint/Test Commands

### Development

- `npm run dev` - Run bot in development mode with tsx
- `npm run dev:reload` - Run with nodemon for auto-reload
- `npm run build` - Compile TypeScript to JavaScript (outputs to `./dist/`)
- `npm start` - Run compiled bot from `./dist/`

### Linting

- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Run ESLint with auto-fix

### Testing

- No test framework is currently configured in this project
- To add tests, consider jest, vitest, or similar frameworks
- Example test command (once configured): `npm test` or `npm test -- path/to/file.test.ts`

### Type Checking

- `npx tsc --noEmit` - Run TypeScript compiler for type checking without emitting files

## Code Style Guidelines

### Imports

**Import Order (enforced by eslint-plugin-perfectionist):**

1. Node.js builtin modules (`path`, `fs`) - use `node:` prefix (e.g., `node:path`, `node:fs`)
2. External packages (`@whiskeysockets/baileys`, `winston`)
3. Internal modules (absolute imports from `src/`)
4. Parent directory imports
5. Sibling file imports
6. Index/file imports

**Import Format:**

```typescript
import path from "node:path"
import fs from "node:fs"

import * as baileys from "@whiskeysockets/baileys"
import winston from "winston"

import { createScopedLogger } from "../../helpers/logger.helper.js"
import { Command } from "../interfaces/command/index.js"
import { Client } from "../client.js"
```

- Use blank lines between import groups
- Use `import * as` for baileys to namespace all exports
- Use named imports for internal modules
- Avoid default imports except for configured packages
- The project is ESM (Baileys v7 is ESM-only): relative imports **must** include the `.js` extension, and directory imports must point to `index.js`

### Formatting

- **Prettier** is enforced via eslint-plugin-prettier
- **ESLint** config: `eslint.config.mjs`
- Run `npm run lint:fix` to auto-format code
- Trailing commas: none
- Semicolons: none
- Quotes: double quotes (default)

### Types

- **TypeScript** with strict mode enabled (`"strict": true` in tsconfig.json)
- Target: ES2022
- Module system: ESM (`"module": "nodenext"`); use `import.meta.dirname` instead of `__dirname`
- Always use explicit type annotations for function parameters and return types
- Export interfaces and types for reusable structures
- Use `ExtendedContext` (`src/interfaces/context`) for command contexts

```typescript
// Example type definitions
type RunFunc<T extends z.ZodObject> = (context: ExtendedContext, options: z.infer<T>) => Promise<void>

export interface Command<T extends z.ZodObject = z.ZodObject> {
    name: string
    description: string
    schema?: T
    run: RunFunc<T>
}
```

### Naming Conventions

- **Files**: kebab-case (e.g., `ping.ts`, `group-participants-update.ts`, `command.interface.ts`)
- **Directories**: kebab-case (e.g., `commands/`, `events/`, `handlers/`)
- **Interfaces**: PascalCase with descriptive names (e.g., `Command`, `Event`, `ExtendedContext`)
- **Types**: PascalCase (e.g., `RunFunc`)
- **Enums**: PascalCase with singular form (e.g., `EventType`)
- **Variables/Functions**: camelCase (e.g., `commandName`, `handleCommands`)
- **Constants**: camelCase or UPPER_SNAKE_CASE for true constants
- **Classes**: PascalCase (e.g., `Client`)
- **Methods**: camelCase (e.g., `createClient`, `start`, `stop`)

### Error Handling

- Use try-catch blocks in async command/event handlers
- Log errors using the scoped logger: `createScopedLogger("scope")`
- Provide user-friendly error messages in WhatsApp replies
- Throw errors for invalid configurations with descriptive messages

```typescript
try {
    logger.info(`Running the command '${command.name}'.`)
    await command.run(context, options)
} catch (error) {
    logger.error(error)
    await context.reply(`Ocorreu um erro ao tentar executar o comando \`${command.name}\`!`)
}
```

### WhatsApp Bot Patterns

**Commands Structure:**

- Place commands in `src/commands/<category>/<command-name>.ts`
- Export a `command` object with `name` (lowercase letters, digits, `-` or `_`), `description`, optional `schema` and a `run` function
- Commands that take free text (e.g. a group name) set `rawArguments: true` to skip the Argus validation and read `context.args`
- Admin-only group commands call `requireGroupAdmin(context)` (`src/utils/command/require-group-admin.ts`), which replies and returns `undefined` when the sender is not a group admin or the bot owner
- Commands are triggered by the prefix in `configHelper.commands.prefix` (default `!`), e.g. `!sum 1 2`
- Arguments are positional (`!command arg1 arg2`) and validated with [`@marcuth/argus`](https://www.npmjs.com/package/@marcuth/argus) + `zod`: declare a `schema` (`z.object({...})`) whose keys map to the arguments in order, and type the command as `Command<typeof schema>` to get typed `options` in `run`. Argus/Zod errors are reported to the user automatically
- `run` receives an `ExtendedContext` with `reply`, `send`, `edit`, `react`, `text`, `sender`, `senderName`, `isGroup` and the `client` (e.g. `context.client.commands`, `context.client.socket`)
- Replies use WhatsApp formatting (`*bold*`, `_italic_`, `~strike~`, `` `mono` ``); there is no HTML and no escaping
- Use `isBotOwnerId(context.senderIds)` to restrict a command to the bot owner

**Events Structure:**

- Place events in `src/events/<event-name>.ts`
- Export an `event` object with `name` (a Baileys event such as `group-participants.update`), `type` (`"on"`, `"once"`), and `run(client, data)`
- Event types defined in `src/enums/event-type.enum.ts`
- Incoming messages (`messages.upsert`) are consumed by the commands handler

**Client Pattern:**

- Use factory function `createClient()` instead of direct instantiation
- `Client` (`src/client.ts`) holds the `commands` registry and the Baileys `socket`; listeners registered with `client.on` are re-bound on every reconnection
- Handlers in `src/handlers/` automatically load commands and events
- The session is stored in the git-ignored `auth/` folder. Delete it to link another number
- Login uses a QR code, or a pairing code when `WHATSAPP_PAIRING_NUMBER` is set

### Configuration

- Environment variables loaded via `@marcuth/env` package
- Config helper at `src/helpers/config.helper.ts`
- Required env vars: `WHATSAPP_ADMIN_NUMBER` (digits with country code, e.g. `5511999999999`)
- Optional env vars: `WHATSAPP_PAIRING_NUMBER`

### Logging

- Use `winston` for logging with scoped loggers
- Import: `import { createScopedLogger } from "../../helpers/logger.helper.js"`
- Create scoped logger: `const logger = createScopedLogger("scope-name")`
- Log levels: `logger.error()`, `logger.info()`, `logger.warn()`, `logger.debug()`
- Logs output to console and files in `logs/` directory

## Docker

- `Dockerfile` is multi-stage (build with `npm ci` + `npm run build`, runtime with production dependencies only) and runs as an unprivileged user.
- `docker-compose.yml` loads `.env` through `env_file` and keeps `logs/` and `auth/` (the WhatsApp session) in named volumes.
- `.dockerignore` keeps `.env`, `logs/`, `auth/`, `.git` and build output out of the image. Never copy secrets into the image.
- Build and run: `docker compose up --build`.
