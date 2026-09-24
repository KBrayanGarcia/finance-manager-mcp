import cors from "cors";
import type { Express, Response } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ENV_CONFIG } from "./config/env.config.js";
import { createMcpServer } from "./factory/mcp-server.factory.js";
import {
  authenticateMcpRequest,
  type AuthenticatedRequest,
} from "./middleware/auth.middleware.js";
import { ApiClientService } from "./services/api-client.service.js";

/**
 * Normaliza la cabecera 'Accept' para asegurar compatibilidad con la especificación Streamable HTTP MCP.
 */
function normalizeAcceptHeader(req: AuthenticatedRequest): void {
  const accept = req.headers.accept;
  if (!accept || accept === "*/*") {
    req.headers.accept = "application/json, text/event-stream";
    return;
  }

  if (accept.includes("application/json") && !accept.includes("text/event-stream")) {
    req.headers.accept = `${accept}, text/event-stream`;
  }
}

/**
 * Procesa peticiones HTTP (GET, POST, DELETE) mediante el transporte oficial Streamable HTTP sin estado.
 */
async function handleStreamableHttpRequest(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  normalizeAcceptHeader(req);

  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Cache-Control", "no-cache, no-transform");

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  const apiClient = new ApiClientService(req.apiToken);
  const server = createMcpServer(apiClient);

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}

/**
 * Configura y retorna la aplicación Express para el servidor MCP con soporte Streamable HTTP.
 */
export function buildMcpExpressApp(): Express {
  const isServerless =
    Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";

  const app = createMcpExpressApp({
    host: isServerless ? "0.0.0.0" : "127.0.0.1",
  });

  app.use(cors());

  app.get(["/", "/api"], (req, res) => {
    const isSseStreamRequest = Boolean(
      req.headers.accept && req.headers.accept.includes("text/event-stream")
    );

    if (isSseStreamRequest) {
      authenticateMcpRequest(req as AuthenticatedRequest, res, () => {
        handleStreamableHttpRequest(req as AuthenticatedRequest, res).catch(
          (error: unknown) => {
            console.error("[MCP Server] Error en stream SSE raíz:", error);
            if (!res.headersSent) {
              res.status(500).json({ error: "Fallo en conexión SSE raíz" });
            }
          }
        );
      });
      return;
    }

    res.json({
      name: "finance-manager-mcp",
      status: "online",
      description: "Finance Manager MCP Server (Streamable HTTP Transport)",
      transport: "streamable-http",
      endpoints: {
        mcp: "/mcp",
        health: "/health",
      },
    });
  });

  app.get(["/health", "/api/health"], (_req, res) => {
    res.json({
      status: "ok",
      name: "finance-manager-mcp",
      version: "1.0.0",
      transport: "streamable-http",
    });
  });

  // Soporta endpoints estándar /mcp, retrocompatibilidad con /sse y /messages
  app.all(
    ["/mcp", "/api/mcp", "/sse", "/api/sse", "/messages", "/api/messages"],
    authenticateMcpRequest,
    (req, res) => {
      handleStreamableHttpRequest(req as AuthenticatedRequest, res).catch(
        (error: unknown) => {
          console.error(
            "[MCP Server] Error procesando petición Streamable HTTP:",
            error
          );
          if (!res.headersSent) {
            res.status(500).json({ error: "Fallo al procesar petición MCP" });
          }
        }
      );
    }
  );

  app.post(["/", "/api"], authenticateMcpRequest, (req, res) => {
    handleStreamableHttpRequest(req as AuthenticatedRequest, res).catch(
      (error: unknown) => {
        console.error(
          "[MCP Server] Error procesando petición MCP en endpoint raíz:",
          error
        );
        if (!res.headersSent) {
          res.status(500).json({ error: "Fallo al procesar petición MCP" });
        }
      }
    );
  });

  return app;
}

/**
 * Inicializa y levanta el servidor HTTP Express en el puerto configurado.
 */
export function startServer(port: number = ENV_CONFIG.port): void {
  const app = buildMcpExpressApp();

  app.listen(port, () => {
    console.log(`🚀 Finance Manager MCP (Streamable HTTP) en http://localhost:${port}`);
    console.log(`📡 Endpoint MCP: http://localhost:${port}/mcp`);
    console.log(`🏥 Healthcheck: http://localhost:${port}/health`);
  });
}

/**
 * Alias de compatibilidad para código existente que invoque startSseServer.
 */
export const startSseServer = startServer;

/**
 * Valida si se debe iniciar el servidor de manera autónoma.
 */
function shouldAutoStart(): boolean {
  if (Boolean(process.env.VERCEL)) {
    return false;
  }
  if (process.env.NODE_ENV === "test") {
    return false;
  }
  return true;
}

if (shouldAutoStart()) {
  startServer();
}
