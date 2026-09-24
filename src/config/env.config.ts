import dotenv from "dotenv";

dotenv.config();

export interface EnvironmentConfig {
  readonly apiBaseUrl: string;
  readonly apiToken: string;
  readonly port: number;
}

export const ENV_CONFIG: EnvironmentConfig = {
  get apiBaseUrl(): string {
    return (
      process.env.API_BASE_URL ||
      process.env.FINANCE_API_BASE_URL ||
      "http://localhost:3000/api/v1"
    );
  },
  get apiToken(): string {
    return (
      process.env.API_TOKEN ||
      process.env.FINANCE_API_KEY ||
      process.env.WALLET_API_KEY ||
      ""
    );
  },
  port: Number(process.env.PORT) || 3001,
};