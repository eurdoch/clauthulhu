import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

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
  "A simple tool that reaches out",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: "reaching...",
        },
      ],
    };
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
