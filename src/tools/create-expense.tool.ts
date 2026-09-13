import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClientService } from "../services/api-client.service.js";
import type { Account } from "../types/account.interface.js";
import type { Category } from "../types/category.interface.js";
import type {
  CreateTransactionPayload,
  Transaction,
} from "../types/transaction.interface.js";
import {
  findAccountByNameOrId,
  findCategoryByNameOrId,
} from "../utils/entity-resolver.util.js";

const createExpenseInputSchema = {
  account: z
    .string()
    .min(1)
    .describe(
      "Nombre o UUID de la cuenta financiera de origen (ej. 'Efectivo', 'Tarjeta Débito', 'Nómina' o UUID)."
    ),
  amount: z
    .number()
    .positive("El monto debe ser un número positivo mayor a 0.")
    .describe("Monto del gasto a registrar (debe ser mayor a 0)."),
  category: z
    .string()
    .optional()
    .describe(
      "Nombre o UUID de la categoría del gasto (ej. 'Comida', 'Transporte', 'Servicios' o UUID). Opcional."
    ),
  description: z
    .string()
    .optional()
    .describe(
      "Concepto, motivo o detalle descriptivo del gasto (ej. 'Almuerzo con el equipo'). Opcional."
    ),
  date: z
    .string()
    .optional()
    .describe(
      "Fecha de la transacción en formato YYYY-MM-DD o ISO (ej. '2026-09-12'). Si se omite, se usa la fecha actual."
    ),
};

interface CreateExpenseInput {
  readonly account: string;
  readonly amount: number;
  readonly category?: string;
  readonly description?: string;
  readonly date?: string;
}

function resolveAccount(
  accounts: readonly Account[],
  identifier: string
): Account {
  const account = findAccountByNameOrId(accounts, identifier);
  if (!account) {
    const available = accounts.map((a) => `'${a.name}'`).join(", ");
    throw new Error(
      `No se encontró la cuenta '${identifier}'. Cuentas activas disponibles: ${available || "Ninguna"}`
    );
  }
  return account;
}

function resolveCategory(
  categories: readonly Category[],
  identifier?: string
): Category | undefined {
  if (!identifier) {
    return undefined;
  }
  const category = findCategoryByNameOrId(categories, identifier);
  if (!category) {
    const available = categories.map((c) => `'${c.name}'`).join(", ");
    throw new Error(
      `No se encontró la categoría '${identifier}'. Categorías de gasto disponibles: ${available || "Ninguna"}`
    );
  }
  return category;
}

function formatExpenseResult(params: {
  readonly transaction: Transaction;
  readonly account: Account;
  readonly category?: Category;
  readonly amount: number;
}) {
  const previousBalance = Number(params.account.currentBalance);
  const newBalance = previousBalance - params.amount;

  return {
    success: true,
    message: `Gasto de ${params.amount} ${params.account.currency} registrado exitosamente en la cuenta '${params.account.name}'.`,
    transaction: {
      id: params.transaction.id,
      type: "EXPENSE" as const,
      amount: Number(params.transaction.amount),
      currency: params.account.currency,
      account: params.account.name,
      category: params.category?.name ?? "Sin categoría",
      description: params.transaction.description ?? "",
      date: params.transaction.transactionDate,
      previousBalance,
      newBalance,
    },
  };
}

async function handleCreateExpense(
  apiClient: ApiClientService,
  args: CreateExpenseInput
) {
  const accounts = await apiClient.fetchAccounts();
  const account = resolveAccount(accounts, args.account);

  let category: Category | undefined;
  if (args.category) {
    const categories = await apiClient.fetchCategories("EXPENSE");
    category = resolveCategory(categories, args.category);
  }

  const payload: CreateTransactionPayload = {
    accountId: account.id,
    type: "EXPENSE",
    amount: args.amount,
    categoryId: category?.id,
    transactionDate: args.date,
    description: args.description,
  };

  const transaction = await apiClient.createTransaction(payload);
  return formatExpenseResult({
    transaction,
    account,
    category,
    amount: args.amount,
  });
}

/**
 * Registra la herramienta `create_expense` en el servidor MCP.
 */
export function registerCreateExpenseTool(
  server: McpServer,
  apiClient: ApiClientService
): void {
  server.registerTool(
    "create_expense",
    {
      description:
        "Registra un nuevo gasto financiero deduciendo el saldo de la cuenta especificada. Permite indicar cuenta (nombre o UUID), categoría (nombre o UUID), monto y concepto opcional.",
      inputSchema: createExpenseInputSchema,
    },
    async (args) => {
      try {
        const result = await handleCreateExpense(apiClient, args);
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
              text: `Error al registrar el gasto: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );
}
