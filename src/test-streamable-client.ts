import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ENV_CONFIG } from "./config/env.config.js";

interface StreamableClientOptions {
  readonly serverUrl: string;
  readonly apiToken: string;
}

/**
 * Parsea los argumentos de línea de comandos y variables de entorno para el cliente HTTP Streamable.
 */
function resolveClientOptions(): StreamableClientOptions {
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
    } else if (arg.startsWith("http://") || arg.startsWith("https://")) {
      customUrl = arg;
    }
  }

  const rawUrl = customUrl || `http://localhost:${ENV_CONFIG.port}/mcp`;
  const token = customToken || ENV_CONFIG.apiToken;

  const urlObj = new URL(rawUrl);

  if (!urlObj.pathname || urlObj.pathname === "/") {
    urlObj.pathname = "/mcp";
  }

  if (token && !urlObj.searchParams.has("token")) {
    urlObj.searchParams.set("token", token);
  }

  return {
    serverUrl: urlObj.toString(),
    apiToken: token,
  };
}

/**
 * Ejecuta la prueba de integración contra el servidor MCP a través del transporte Streamable HTTP.
 */
async function runIntegrationTest(): Promise<void> {
  const { serverUrl, apiToken } = resolveClientOptions();

  console.log(`[Test] Conectando cliente Streamable HTTP a: ${serverUrl}`);

  const targetUrl = new URL(serverUrl);
  const transport = new StreamableHTTPClientTransport(targetUrl, {
    requestInit: {
      headers: {
        "x-api-key": apiToken,
      },
    },
  });

  const client = new Client(
    { name: "test-streamable-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("[Test] Conexión Streamable HTTP establecida con éxito.");

  console.log("\n[Test] Consultando lista de herramientas disponibles...");
  const toolsResponse = await client.listTools();
  console.log(`[Test] Herramientas registradas (${toolsResponse.tools.length}):`);
  for (const tool of toolsResponse.tools) {
    console.log(`  - ${tool.name}: ${tool.description?.slice(0, 60)}...`);
  }

  console.log("\n[Test] Invocando tool 'get_account_balances'...");
  const balancesResponse = await client.callTool({
    name: "get_account_balances",
    arguments: {},
  });
  console.log("[Test] Respuesta de get_account_balances:");
  console.dir(balancesResponse, { depth: null });

  console.log("\n[Test] Invocando tool 'list_transactions'...");
  const transactionsResponse = await client.callTool({
    name: "list_transactions",
    arguments: { limit: 3 },
  });
  console.log("[Test] Respuesta de list_transactions:");
  console.dir(transactionsResponse, { depth: null });

  await client.close();
  console.log("\n[Test] Cliente desconectado y prueba finalizada exitosamente.");
}

runIntegrationTest().catch((error: unknown) => {
  console.error("[Test] Error en prueba de cliente Streamable HTTP:", error);
  process.exit(1);
});
