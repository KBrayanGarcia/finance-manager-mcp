import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function runMcpSmokeTest(): Promise<void> {
  console.log("Iniciando prueba del Servidor MCP...");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("Cliente conectado con éxito al servidor MCP.");

  const toolsResponse = await client.listTools();
  console.log("\nHerramientas disponibles en el servidor:");
  console.dir(toolsResponse.tools, { depth: null });

  console.log("\nEjecutando tool `get_account_balances`...");
  const balancesResponse = await client.callTool({
    name: "get_account_balances",
    arguments: {},
  });
  console.log("\nResultado de `get_account_balances`:");
  console.dir(balancesResponse, { depth: null });

  console.log("\nEjecutando tool `list_transactions` (con limit = 5)...");
  const transactionsResponse = await client.callTool({
    name: "list_transactions",
    arguments: { limit: 5 },
  });
  console.log("\nResultado de `list_transactions`:");
  console.dir(transactionsResponse, { depth: null });

  console.log("\nEjecutando tool `create_expense`...");
  const createExpenseResponse = await client.callTool({
    name: "create_expense",
    arguments: {
      account: "Efectivo",
      amount: 15.5,
      category: "Comida",
      description: "Prueba automatizada de gasto",
    },
  });
  console.log("\nResultado de `create_expense`:");
  console.dir(createExpenseResponse, { depth: null });

  console.log("\nEjecutando tool `create_income`...");
  const createIncomeResponse = await client.callTool({
    name: "create_income",
    arguments: {
      account: "Efectivo",
      amount: 100.0,
      description: "Prueba automatizada de ingreso",
    },
  });
  console.log("\nResultado de `create_income`:");
  console.dir(createIncomeResponse, { depth: null });

  await client.close();
  console.log("\nPrueba completada correctamente.");
}

runMcpSmokeTest().catch((error: unknown) => {
  console.error("Fallo durante la prueba:", error);
  process.exit(1);
});