import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { ENV_CONFIG } from "./config/env.config.js";

interface SseClientOptions {
  readonly serverUrl: string;
  readonly apiToken: string;
}

/**
 * Parsea los argumentos de línea de comandos y variables de entorno para configurar el cliente SSE.
 */
function resolveClientOptions(): SseClientOptions {
  const args = process.argv.slice(2);
  let customUrl: string | undefined = process.env.MCP_SERVER_URL;
  let customToken: string | undefined = process.env.MCP_API_TOKEN;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--url" && i + 1 < args.length) {
      customUrl = args[i + 1];
      i++;
    } else if (arg.startsWith("--url=")) {
      customUrl = arg.slice(6);
    } else if (arg === "--token" && i + 1 < args.length) {
      customToken = args[i + 1];
      i++;
    } else if (arg.startsWith("--token=")) {
      customToken = arg.slice(8);
    }
  }

  const rawUrl = customUrl || `http://localhost:${ENV_CONFIG.port}/sse`;
  const token = customToken || ENV_CONFIG.apiToken;

  let urlObj: URL;
  try {
    urlObj = new URL(rawUrl);
  } catch (error) {
    throw new Error(`URL de servidor inválida: ${rawUrl}`);
  }

  // Si la URL no apunta al endpoint /sse ni a un subpath específico, agregar /sse por defecto
  if (!urlObj.pathname || urlObj.pathname === "/") {
    urlObj.pathname = "/sse";
  }

  // Adjuntar token a los parámetros de búsqueda si se dispone de él
  if (token && !urlObj.searchParams.has("token")) {
    urlObj.searchParams.set("token", token);
  }

  return {
    serverUrl: urlObj.toString(),
    apiToken: token,
  };
}

/**
 * Ejecuta la prueba de integración contra el servidor MCP a través del transporte SSE.
 */
async function runSseIntegrationTest(): Promise<void> {
  const { serverUrl } = resolveClientOptions();

  console.log(`[Test] Conectando cliente de prueba SSE a: ${serverUrl}`);

  const sseTargetUrl = new URL(serverUrl);
  const transport = new SSEClientTransport(sseTargetUrl);
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
  console.log("[Test] Respuesta de get_account_balances:");
  console.dir(balancesResponse, { depth: null });

  console.log("\n[Test] Invocando tool 'list_transactions' vía SSE...");
  const transactionsResponse = await client.callTool({
    name: "list_transactions",
    arguments: { limit: 3 },
  });
  console.log("[Test] Respuesta de list_transactions:");
  console.dir(transactionsResponse, { depth: null });

  await client.close();
  console.log("\n[Test] Cliente SSE desconectado y prueba finalizada exitosamente.");
}

runSseIntegrationTest().catch((error: unknown) => {
  console.error("[Test] Error en prueba de cliente SSE:", error);
  process.exit(1);
});
