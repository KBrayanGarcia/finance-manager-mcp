export type AccountType =
  | "CHECKING"
  | "SAVINGS"
  | "CREDIT_CARD"
  | "CASH"
  | "INVESTMENT";

export interface Account {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly type: AccountType;
  readonly currency: string;
  readonly initialBalance: number;
  readonly currentBalance: number;
  readonly color?: string;
  readonly icon?: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

