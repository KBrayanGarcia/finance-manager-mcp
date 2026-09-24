import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./factory/mcp-server.factory.js";
import { ApiClientService } from "./services/api-client.service.js";

async function bootstrapStdioServer(): Promise<void> {
  const apiClient = new ApiClientService();
  const server = createMcpServer(apiClient);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("🚀 Finance Manager MCP Server iniciado exitosamente.");
  console.error("📡 Transporte: stdio (Entrada/Salida estándar)");
  console.error("🌐 IP / Puerto: N/A (Comunicación directa entre procesos, no expone socket de red)");
}

bootstrapStdioServer().catch((error: unknown) => {
  console.error("❌ Error al inicializar el servidor MCP en modo stdio:", error);
  process.exit(1);
});