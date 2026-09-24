import dotenv from "dotenv";

dotenv.config();

export interface EnvironmentConfig {
  readonly apiBaseUrl: string;
  readonly apiToken: string;
  readonly port: number;
}

export const ENV_CONFIG: EnvironmentConfig = {
  apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:3000",
  get apiToken(): string {
    return process.env.API_TOKEN || process.env.WALLET_API_KEY || "";
  },
  port: Number(process.env.PORT) || 3001,
};