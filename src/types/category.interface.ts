export type CategoryType = "EXPENSE" | "INCOME";

/**
 * Representa una categoría de ingresos o gastos en el sistema.
 */
export interface Category {
  readonly id: string;
  readonly userId?: string;
  readonly name: string;
  readonly type: CategoryType;
  readonly icon?: string;
  readonly color?: string;
  readonly isActive: boolean;
}
