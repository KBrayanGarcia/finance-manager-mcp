import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClientService } from "../services/api-client.service.js";
import type { Account } from "../types/account.interface.js";
import type {
  CreateTransactionPayload,
  Transaction,
} from "../types/transaction.interface.js";
import { findAccountByNameOrId } from "../utils/entity-resolver.util.js";

const transferFundsInputSchema = {
  fromAccount: z
    .string()
    .min(1)
    .describe(
      "Nombre o UUID de la cuenta financiera de origen desde donde se transferirán los fondos (ej. 'Nómina', 'Efectivo' o UUID)."
    ),
  toAccount: z
    .string()
    .min(1)
    .describe(
      "Nombre o UUID de la cuenta financiera de destino que recibirá los fondos (ej. 'Ahorros', 'Tarjeta Débito' o UUID)."
    ),
  amount: z
    .number()
    .positive("El monto a transferir debe ser un número positivo mayor a 0.")
    .describe("Monto a transferir entre las cuentas (debe ser mayor a 0)."),
  description: z
    .string()
    .optional()
    .describe(
      "Concepto, motivo o detalle descriptivo de la transferencia (ej. 'Abono a cuenta de ahorros'). Opcional."
    ),
  date: z
    .string()
    .optional()
    .describe(
      "Fecha de la transacción en formato YYYY-MM-DD o ISO (ej. '2026-09-12'). Si se omite, se usa la fecha actual."
    ),
};

interface TransferFundsInput {
  readonly fromAccount: string;
  readonly toAccount: string;
  readonly amount: number;
  readonly description?: string;
  readonly date?: string;
}

function resolveAccount(params: {
  readonly accounts: readonly Account[];
  readonly identifier: string;
  readonly roleLabel: string;
}): Account {
  const account = findAccountByNameOrId(params.accounts, params.identifier);
  if (!account) {
    const available = params.accounts.map((a) => `'${a.name}'`).join(", ");
    throw new Error(
      `No se encontró la cuenta ${params.roleLabel} '${params.identifier}'. Cuentas activas disponibles: ${available || "Ninguna"}`
    );
  }
  return account;
}

function validateAccountsDistinct(fromAccount: Account, toAccount: Account): void {
  if (fromAccount.id === toAccount.id) {
    throw new Error(
      "La cuenta de origen y la cuenta de destino no pueden ser la misma."
    );
  }
}

function formatTransferResult(params: {
  readonly transaction: Transaction;
  readonly fromAccount: Account;
  readonly toAccount: Account;
  readonly amount: number;
}) {
  const fromPreviousBalance = Number(params.fromAccount.currentBalance);
  const fromNewBalance = fromPreviousBalance - params.amount;
  const toPreviousBalance = Number(params.toAccount.currentBalance);
  const toNewBalance = toPreviousBalance + params.amount;

  return {
    success: true,
    message: `Transferencia de ${params.amount} ${params.fromAccount.currency} realizada exitosamente desde '${params.fromAccount.name}' hacia '${params.toAccount.name}'.`,
    transaction: {
      id: params.transaction.id,
      type: "TRANSFER" as const,
      amount: Number(params.transaction.amount),
      currency: params.fromAccount.currency,
      fromAccount: {
        id: params.fromAccount.id,
        name: params.fromAccount.name,
        previousBalance: fromPreviousBalance,
        newBalance: fromNewBalance,
      },
      toAccount: {
        id: params.toAccount.id,
        name: params.toAccount.name,
        previousBalance: toPreviousBalance,
        newBalance: toNewBalance,
      },
      description: params.transaction.description ?? "",
      date: params.transaction.transactionDate,
    },
  };
}

async function handleTransferFunds(
  apiClient: ApiClientService,
  args: TransferFundsInput
) {
  const accounts = await apiClient.fetchAccounts();
  const fromAccount = resolveAccount({
    accounts,
    identifier: args.fromAccount,
    roleLabel: "de origen",
  });
  const toAccount = resolveAccount({
    accounts,
    identifier: args.toAccount,
    roleLabel: "de destino",
  });

  validateAccountsDistinct(fromAccount, toAccount);

  const payload: CreateTransactionPayload = {
    accountId: fromAccount.id,
    destinationAccountId: toAccount.id,
    type: "TRANSFER",
    amount: args.amount,
    transactionDate: args.date,
    description: args.description,
  };

  const transaction = await apiClient.createTransaction(payload);
  return formatTransferResult({
    transaction,
    fromAccount,
    toAccount,
    amount: args.amount,
  });
}

/**
 * Registra la herramienta `transfer_funds` en el servidor MCP.
 */
export function registerTransferFundsTool(
  server: McpServer,
  apiClient: ApiClientService
): void {
  server.registerTool(
    "transfer_funds",
    {
      description:
        "Ejecuta una transferencia financiera entre dos cuentas del usuario. Deduce los fondos de la cuenta de origen y los acredita en la cuenta de destino de forma atómica.",
      inputSchema: transferFundsInputSchema,
    },
    async (args) => {
      try {
        const result = await handleTransferFunds(apiClient, args);
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
              text: `Error al ejecutar la transferencia: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );
}
