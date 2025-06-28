import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { exec } from "child_process";
import { promisify } from "util";

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
  "Opens a new terminal window",
  {},
  async () => {
    try {
      // Open a new terminal window on macOS and bring it to front
      await execAsync('osascript -e \'tell application "Terminal" to do script ""\' -e \'tell application "Terminal" to activate\'');
      
      return {
        content: [
          {
            type: "text",
            text: "Terminal window opened successfully",
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
