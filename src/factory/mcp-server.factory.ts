import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClientService } from "../services/api-client.service.js";
import { registerCreateExpenseTool } from "../tools/create-expense.tool.js";
import { registerCreateIncomeTool } from "../tools/create-income.tool.js";
import { registerGetAccountBalancesTool } from "../tools/get-account-balances.tool.js";
import { registerListTransactionsTool } from "../tools/list-transactions.tool.js";
import { registerTransferFundsTool } from "../tools/transfer-funds.tool.js";

export interface McpServerOptions {
  readonly name?: string;
  readonly version?: string;
}

/**
 * Factoría para instanciar y configurar un servidor McpServer desacoplado del medio de transporte.
 * Registra todas las herramientas financieras (tools) utilizando el ApiClientService suministrado.
 */
export function createMcpServer(
  apiClient: ApiClientService,
  options: McpServerOptions = {}
): McpServer {
  const server = new McpServer({
    name: options.name ?? "finance-manager-mcp",
    version: options.version ?? "1.0.0",
  });

  registerGetAccountBalancesTool(server, apiClient);
  registerListTransactionsTool(server, apiClient);
  registerCreateExpenseTool(server, apiClient);
  registerCreateIncomeTool(server, apiClient);
  registerTransferFundsTool(server, apiClient);

  return server;
}
