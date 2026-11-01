import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ApiClient } from "./api";
import { createApiClient } from "./api-client";
import type { AppSettings } from "./settings";
import { DEFAULT_SETTINGS, loadSettings, onSettingsChange } from "./settings";

interface ApiContextValue {
  api: ApiClient;
  settings: AppSettings;
  isReady: boolean;
}

const ApiContext = createContext<ApiContextValue | null>(null);

/**
 * Carga los ajustes y expone el `ApiClient` que corresponde (mock o HTTP).
 * Cambiar URL/token en Ajustes recrea el cliente y todas las pantallas lo ven
 * sin reiniciar la app.
 */
export function ApiProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    let active = true;
    // Carga inicial (AsyncStorage) + suscripción a cambios de Ajustes.
    void loadSettings().then((loaded) => {
      if (active) setSettings(loaded);
    });
    const unsubscribe = onSettingsChange((next) => setSettings(next));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const apiUrl = settings?.apiUrl ?? "";
  const webToken = settings?.webToken ?? "";
  const api = useMemo(
    () => createApiClient({ ...DEFAULT_SETTINGS, apiUrl, webToken }),
    [apiUrl, webToken],
  );
  const value = useMemo<ApiContextValue>(
    () => ({
      api,
      settings: settings ?? DEFAULT_SETTINGS,
      isReady: settings !== null,
    }),
    [api, settings],
  );

  // Evita una primera carga mock antes de conocer la URL configurada.
  if (settings === null) return null;

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiContextValue {
  const context = useContext(ApiContext);
  if (context === null) {
    throw new Error("useApi debe usarse dentro de <ApiProvider>");
  }
  return context;
}
