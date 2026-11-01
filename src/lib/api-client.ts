import { HttpApiClient } from "./http-api-client";
import { MockApiClient, type ApiClient } from "./api";
import type { AppSettings } from "./settings";

/**
 * Elige el cliente según los ajustes:
 * - sin `apiUrl` → `MockApiClient` (la app sigue usable sin servidor);
 * - con `apiUrl` → `HttpApiClient` con `X-Auth-Token` si hay token.
 */
export function createApiClient(settings: AppSettings): ApiClient {
  const baseUrl = settings.apiUrl.trim();
  if (baseUrl === "") return new MockApiClient();
  return new HttpApiClient({ baseUrl, token: settings.webToken });
}
