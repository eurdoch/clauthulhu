import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";
import { homedir } from "os";
import { join } from "path";

const execAsync = promisify(exec);

// Helper function to create safe branch name from prompt
function createBranchName(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50) || 'feature-branch'; // Limit length and provide fallback
}

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
  "Opens a new terminal window and runs claude with optional prompt and feature branch",
  {
    prompt: z.string().optional().describe("Optional prompt to pass to claude command"),
    featureBranch: z.string().optional().describe("Optional feature branch name (auto-generated from prompt if not provided)"),
  },
  async ({ prompt, featureBranch }) => {
    try {
      // Get current working directory
      const cwd = process.cwd();
      let workingDirectory = cwd;
      let branchName = '';
      
      // If prompt is provided, create worktree
      if (prompt) {
        // Determine branch name
        branchName = featureBranch || createBranchName(prompt);
        
        // Create worktree directory path
        const worktreesDir = join(homedir(), '.clauthulhu', 'worktrees');
        const worktreeDir = join(worktreesDir, branchName);
        
        // Create worktree
        await execAsync(`mkdir -p "${worktreesDir}"`);
        await execAsync(`cd "${cwd}" && git worktree add "${worktreeDir}" -b "${branchName}"`);
        
        workingDirectory = worktreeDir;
      }
      
      // Build the claude command
      const claudeCommand = prompt ? `claude --dangerously-skip-permissions "${prompt.replace(/"/g, '\\"')}"` : "claude --dangerously-skip-permissions";
      
      // Open a new WezTerm window and run claude command (run in background)
      execAsync(`wezterm start --cwd "${workingDirectory}" -- bash -c "${claudeCommand}; exec bash"`).catch(() => {
        // Ignore errors since this runs in background
      });
      
      let message;
      if (prompt && branchName) {
        message = `WezTerm opened in worktree ${workingDirectory} (branch: ${branchName}) and running: claude --dangerously-skip-permissions "${prompt}"`;
      } else if (prompt) {
        message = `WezTerm opened in ${workingDirectory} and running: claude --dangerously-skip-permissions "${prompt}"`;
      } else {
        message = `WezTerm opened in ${workingDirectory} and running: claude --dangerously-skip-permissions`;
      }
      
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
            text: `Failed to open WezTerm: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
