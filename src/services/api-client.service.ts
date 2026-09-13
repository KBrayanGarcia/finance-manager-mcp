import axios, { isAxiosError, type AxiosInstance } from "axios";
import { ENV_CONFIG } from "../config/env.config.js";
import type { Account } from "../types/account.interface.js";
import type { Category, CategoryType } from "../types/category.interface.js";
import type {
  CreateTransactionPayload,
  Transaction,
  TransactionsQueryOptions,
  TransactionsResponse,
} from "../types/transaction.interface.js";

function normalizeBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

/**
 * Cliente HTTP para comunicación directa con el backend de Finance Manager.
 * Inyecta dinámicamente el Personal Access Token (API Key) en cada solicitud.
 */
export class ApiClientService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: normalizeBaseUrl(ENV_CONFIG.apiBaseUrl),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Obtiene la lista de todas las cuentas activas del usuario autenticado.
   */
  async fetchAccounts(): Promise<Account[]> {
    const token = this.getValidToken();

    try {
      const response = await this.client.get<Account[]>("/accounts", {
        headers: {
          "X-API-KEY": token,
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        this.formatErrorMessage(error, "Fallo al consultar las cuentas")
      );
    }
  }

  /**
   * Obtiene la lista de transacciones del usuario aplicando filtros opcionales.
   */
  async fetchTransactions(
    options: TransactionsQueryOptions = {}
  ): Promise<TransactionsResponse> {
    const token = this.getValidToken();

    try {
      const response = await this.client.get<TransactionsResponse>(
        "/transactions",
        {
          params: options,
          headers: {
            "X-API-KEY": token,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        this.formatErrorMessage(error, "Fallo al consultar las transacciones")
      );
    }
  }

  /**
   * Obtiene la lista de categorías activas, opcionalmente filtradas por tipo.
   */
  async fetchCategories(type?: CategoryType): Promise<Category[]> {
    const token = this.getValidToken();

    try {
      const response = await this.client.get<Category[]>("/categories", {
        params: type ? { type } : undefined,
        headers: {
          "X-API-KEY": token,
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        this.formatErrorMessage(error, "Fallo al consultar las categorías")
      );
    }
  }

  /**
   * Registra una nueva transacción financiera (gasto, ingreso o transferencia).
   */
  async createTransaction(
    payload: CreateTransactionPayload
  ): Promise<Transaction> {
    const token = this.getValidToken();

    try {
      const response = await this.client.post<Transaction>(
        "/transactions",
        payload,
        {
          headers: {
            "X-API-KEY": token,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        this.formatErrorMessage(error, "Fallo al registrar la transacción")
      );
    }
  }

  private getValidToken(): string {
    const token = ENV_CONFIG.apiToken;
    if (!token) {
      console.error(
        "[Finance Manager MCP] Falta configurar API_TOKEN en las variables de entorno."
      );
      throw new Error(
        "No fue posible autenticar con el servicio de Finance Manager. Falta configurar el token de acceso."
      );
    }
    return token;
  }

  private formatErrorMessage(error: unknown, fallback: string): string {
    if (isAxiosError(error)) {
      if (error.response?.status === 401) {
        return "Autenticación fallida con la API de Finance Manager. El token de acceso es inválido o ha expirado.";
      }
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        return Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : String(backendMessage);
      }
      return `${fallback}: HTTP ${error.response?.status ?? "ERROR"} - ${error.message}`;
    }
    return error instanceof Error ? error.message : fallback;
  }
}