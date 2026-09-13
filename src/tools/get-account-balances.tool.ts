import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClientService } from "../services/api-client.service.js";

/**
 * Registra la herramienta `get_account_balances` en el servidor MCP.
 */
export function registerGetAccountBalancesTool(
  server: McpServer,
  apiClient: ApiClientService
): void {
  server.registerTool(
    "get_account_balances",
    {
      description:
        "Consulta la lista de cuentas financieras activas, sus saldos actuales y el total consolidado.",
    },
    async () => {
      try {
        const accounts = await apiClient.fetchAccounts();
        const formattedAccounts = accounts.map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
          currency: account.currency,
          currentBalance: Number(account.currentBalance),
          isActive: account.isActive,
        }));

        const totalBalance = formattedAccounts.reduce(
          (sum, account) => sum + account.currentBalance,
          0
        );

        const result = {
          totalBalance,
          totalAccounts: formattedAccounts.length,
          accounts: formattedAccounts,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";

        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error al consultar saldos de cuentas: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );
}

