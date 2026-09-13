import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ApiClientService } from "./services/api-client.service.js";
import { registerGetAccountBalancesTool } from "./tools/get-account-balances.tool.js";

async function bootstrapServer(): Promise<void> {
  const apiClient = new ApiClientService();

  const server = new McpServer({
    name: "finance-manager-mcp",
    version: "1.0.0",
  });

  registerGetAccountBalancesTool(server, apiClient);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("🚀 Finance Manager MCP Server iniciado exitosamente.");
  console.error("📡 Transporte: stdio (Entrada/Salida estándar)");
  console.error("ℹ️  IP / Puerto: N/A (Comunicación directa entre procesos, no expone socket de red)");
}

bootstrapServer().catch((error: unknown) => {
  console.error("? Error al inicializar el servidor MCP:", error);
  process.exit(1);
});

