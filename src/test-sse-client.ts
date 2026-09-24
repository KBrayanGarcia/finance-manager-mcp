import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { ENV_CONFIG } from "./config/env.config.js";

async function runSseIntegrationTest(): Promise<void> {
  const token = ENV_CONFIG.apiToken;
  const port = ENV_CONFIG.port;
  const sseUrl = new URL(`http://localhost:${port}/sse`);
  sseUrl.searchParams.set("token", token);

  console.log(`[Test] Conectando cliente de prueba SSE a: ${sseUrl.toString()}`);

  const transport = new SSEClientTransport(sseUrl);
  const client = new Client(
    { name: "test-sse-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("[Test] Conexión SSE establecida con éxito.");

  console.log("\n[Test] Consultando lista de herramientas disponibles...");
  const toolsResponse = await client.listTools();
  console.log(`[Test] Herramientas registradas (${toolsResponse.tools.length}):`);
  for (const tool of toolsResponse.tools) {
    console.log(`  - ${tool.name}: ${tool.description?.slice(0, 60)}...`);
  }

  console.log("\n[Test] Invocando tool 'get_account_balances' vía SSE...");
  const balancesResponse = await client.callTool({
    name: "get_account_balances",
    arguments: {},
  });
  console.log("[Test] Respuesta obtenida:");
  console.dir(balancesResponse, { depth: null });

  console.log("\n[Test] Invocando tool 'list_transactions' vía SSE...");
  const transactionsResponse = await client.callTool({
    name: "list_transactions",
    arguments: { limit: 3 },
  });
  console.log("[Test] Respuesta obtenida:");
  console.dir(transactionsResponse, { depth: null });

  await client.close();
  console.log("\n[Test] Cliente SSE desconectado y prueba finalizada exitosamente.");
}

runSseIntegrationTest().catch((error: unknown) => {
  console.error("[Test] Error en prueba de cliente SSE:", error);
  process.exit(1);
});
