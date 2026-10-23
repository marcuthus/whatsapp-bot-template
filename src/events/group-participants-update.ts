import { createScopedLogger } from "../helpers/logger.helper.js"
import { Event } from "../interfaces/event/index.js"

const logger = createScopedLogger("client")

export const event: Event<"group-participants.update"> = {
    name: "group-participants.update",
    type: "on",
    run: async (_client, data) => {
        logger.info("Group participants updated.", { groupId: data.id, action: data.action })
    }
}
