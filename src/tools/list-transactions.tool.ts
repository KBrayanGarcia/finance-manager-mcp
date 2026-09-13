import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClientService } from "../services/api-client.service.js";
import type { Transaction } from "../types/transaction.interface.js";

const listTransactionsInputSchema = {
  accountId: z
    .string()
    .uuid()
    .optional()
    .describe("ID de la cuenta financiera para filtrar sus movimientos."),
  type: z
    .enum(["EXPENSE", "INCOME", "TRANSFER"])
    .optional()
    .describe(
      "Tipo de transacción a consultar: 'EXPENSE' (Gasto), 'INCOME' (Ingreso) o 'TRANSFER' (Transferencia entre cuentas)."
    ),
  startDate: z
    .string()
    .optional()
    .describe("Fecha inicial en formato ISO o YYYY-MM-DD (ej. '2026-01-01')."),
  endDate: z
    .string()
    .optional()
    .describe("Fecha final en formato ISO o YYYY-MM-DD (ej. '2026-12-31')."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Número máximo de transacciones a devolver (por defecto 20, máx 100)."),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Desplazamiento para paginación de transacciones (por defecto 0)."),
};

function formatTransactionItem(tx: Transaction) {
  return {
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    currency: tx.account?.currency ?? "USD",
    date: tx.transactionDate,
    account: tx.account?.name ?? "Desconocida",
    category: tx.category?.name ?? "Sin categoría",
    ...(tx.destinationAccount && {
      destinationAccount: tx.destinationAccount.name,
    }),
    description: tx.description ?? "",
  };
}

/**
 * Registra la herramienta `list_transactions` en el servidor MCP.
 */
export function registerListTransactionsTool(
  server: McpServer,
  apiClient: ApiClientService
): void {
  server.registerTool(
    "list_transactions",
    {
      description:
        "Consulta el historial de movimientos o transacciones financieras del usuario, permitiendo filtrar por tipo (gasto, ingreso, transferencia), cuenta y rango de fechas.",
      inputSchema: listTransactionsInputSchema,
    },
    async (args) => {
      try {
        const response = await apiClient.fetchTransactions(args);
        const formattedList = response.data.map(formatTransactionItem);

        const result = {
          total: response.total,
          returnedCount: formattedList.length,
          transactions: formattedList,
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
              text: `Error al consultar transacciones: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );
}