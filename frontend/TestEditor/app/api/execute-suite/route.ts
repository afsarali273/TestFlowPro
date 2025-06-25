import type { NextRequest } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { frameworkPath, suiteFilePath } = await request.json()

    if (!frameworkPath) {
      return new Response("Framework path is required", { status: 400 })
    }

    if (!suiteFilePath) {
      return new Response("Suite file path is required", { status: 400 })
    }

    // Build the command arguments - use the framework path directly with runner.ts
    const runnerPath = path.join(frameworkPath, "runner.ts")
    const args = ["ts-node", runnerPath, "--file", suiteFilePath]

    // Create a readable stream for real-time output
    const stream = new ReadableStream({
      start(controller) {
        const process = spawn("npx", args, {
          cwd: frameworkPath,
          stdio: ["pipe", "pipe", "pipe"],
          shell: true,
        })

        // Send initial command info
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({
              type: "command",
              command: `npx ${args.join(" ")}`,
              workingDirectory: frameworkPath,
              suiteFile: suiteFilePath,
            })}\n\n`,
          ),
        )

        process.stdout?.on("data", (data) => {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "stdout",
                data: data.toString(),
              })}\n\n`,
            ),
          )
        })

        process.stderr?.on("data", (data) => {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "stderr",
                data: data.toString(),
              })}\n\n`,
            ),
          )
        })

        process.on("close", (code) => {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "exit",
                exitCode: code,
                success: code === 0,
              })}\n\n`,
            ),
          )
          controller.close()
        })

        process.on("error", (error) => {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error.message,
              })}\n\n`,
            ),
          )
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error: any) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}
