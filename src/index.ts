import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";

const execAsync = promisify(exec);

// Create server instance
const server = new McpServer({
  name: "clauthulhu",
  version: "0.0.1",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register tentacle tool
server.tool(
  "tentacle",
  "Opens a new terminal window and runs claude with optional prompt",
  {
    prompt: z.string().optional().describe("Optional prompt to pass to claude command"),
  },
  async ({ prompt }) => {
    try {
      // Get current working directory
      const cwd = process.cwd();
      
      // Build the claude command with directory change
      const claudeCommand = prompt ? `claude --dangerously-skip-permissions "${prompt.replace(/"/g, '\\"')}"` : "claude --dangerously-skip-permissions";
      const fullCommand = `cd "${cwd}" && ${claudeCommand}`;
      
      // Open a new terminal window on macOS and run claude command
      // Escape the command properly for AppleScript
      const escapedCommand = fullCommand.replace(/"/g, '\\"');
      await execAsync(`osascript -e 'tell application "Terminal" to do script "${escapedCommand}"' -e 'tell application "Terminal" to activate'`);
      
      const message = prompt 
        ? `Terminal opened in ${cwd} and running: claude --dangerously-skip-permissions "${prompt}"`
        : `Terminal opened in ${cwd} and running: claude --dangerously-skip-permissions`;
      
      return {
        content: [
          {
            type: "text",
            text: message,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to open terminal: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Clauthulhu MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
