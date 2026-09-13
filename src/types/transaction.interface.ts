export type TransactionType = "EXPENSE" | "INCOME" | "TRANSFER";

export interface TransactionAccountSummary {
  readonly id: string;
  readonly name: string;
  readonly currency: string;
}

export interface TransactionCategorySummary {
  readonly id: string;
  readonly name: string;
  readonly icon?: string;
}

/**
 * Representa una transacción financiera en el sistema.
 */
export interface Transaction {
  readonly id: string;
  readonly accountId: string;
  readonly account?: TransactionAccountSummary;
  readonly categoryId?: string;
  readonly category?: TransactionCategorySummary;
  readonly destinationAccountId?: string;
  readonly destinationAccount?: TransactionAccountSummary;
  readonly type: TransactionType;
  readonly amount: number;
  readonly transactionDate: string;
  readonly description?: string;
}

/**
 * Parámetros opcionales para consultar y filtrar transacciones.
 */
export interface TransactionsQueryOptions {
  readonly accountId?: string;
  readonly categoryId?: string;
  readonly type?: TransactionType;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface TransactionsResponse {
  readonly data: Transaction[];
  readonly total: number;
}

/**
 * Payload requerido por la API para registrar una transacción.
 */
export interface CreateTransactionPayload {
  readonly accountId: string;
  readonly type: TransactionType;
  readonly amount: number;
  readonly categoryId?: string;
  readonly destinationAccountId?: string;
  readonly transactionDate?: string;
  readonly description?: string;
}