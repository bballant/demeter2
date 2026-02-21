import { Command } from "@effect/cli"
import { NodeContext, NodeRuntime } from "@effect/platform-node"
import { Console, Effect } from "effect"

import { configCmd } from "./commands/config.js"
import { dbCmd } from "./commands/db.js"
import { recordCmd } from "./commands/record.js"
import { reportCmd } from "./commands/report.js"

const root = Command.make("demeter2").pipe(
    Command.withSubcommands([configCmd, dbCmd, recordCmd, reportCmd]),
)

const cli = Command.run(root, {
    name: "demeter2",
    version: "0.0.0",
})

cli(process.argv).pipe(
    Effect.provide(NodeContext.layer),
    Effect.catchAll((error) =>
        Console.error(error instanceof Error ? error.message : String(error)).pipe(
            Effect.flatMap(() => Effect.fail(error)),
        ),
    ),
    Effect.catchAllDefect((defect) =>
        Console.error(`Unexpected error: ${defect instanceof Error ? defect.message : String(defect)}`),
    ),
    NodeRuntime.runMain,
)
