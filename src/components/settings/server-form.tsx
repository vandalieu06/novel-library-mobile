import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { ApiError } from "@/lib/api";
import { HttpApiClient } from "@/lib/http-api-client";
import { serverStatus } from "@/lib/server-status";
import type { AppSettings } from "@/lib/settings";
import { updateSettings } from "@/lib/settings";
import { ActionButton } from "@/components/action-button";
import { StatusDot, type StatusTone } from "@/components/list-card";
import { OutlinedField } from "@/components/download/outlined-field";

interface ServerFormProps {
  settings: AppSettings;
  /** Cierra el sheet/panel tras guardar. */
  onSaved: () => void;
}

function toneClass(tone: StatusTone): string {
  return tone === "success"
    ? "text-success"
    : tone === "danger"
      ? "text-danger"
      : "text-muted";
}

/**
 * Formulario del servidor (spec 0.4.0-05), reutilizable en el sheet de móvil y
 * en el panel lateral de tablet (06). “Probar” usa los drafts y no guarda
 * URL/token; “Guardar” sí los persiste y recrea el cliente.
 */
export function ServerForm({ settings, onSaved }: ServerFormProps) {
  const [urlDraft, setUrlDraft] = useState(settings.apiUrl);
  const [tokenDraft, setTokenDraft] = useState(settings.webToken);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const status = serverStatus(settings);

  const handleTest = useCallback(async () => {
    const url = urlDraft.trim();
    const token = tokenDraft.trim();
    setTesting(true);
    try {
      if (url === "") {
        setTestResult({
          ok: false,
          message: "Configura la URL del servidor",
        });
        return;
      }
      const client = new HttpApiClient({ baseUrl: url, token });
      await client.testConnection(url);
      setTestResult({ ok: true, message: "Conexión correcta" });
      await updateSettings({
        lastConnection: { ok: true, at: new Date().toISOString(), url },
      });
    } catch (caught) {
      const message =
        caught instanceof ApiError ? caught.message : "Error inesperado";
      setTestResult({ ok: false, message });
      await updateSettings({
        lastConnection: { ok: false, at: new Date().toISOString(), url },
      });
    } finally {
      setTesting(false);
    }
  }, [urlDraft, tokenDraft]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateSettings({
        apiUrl: urlDraft.trim(),
        webToken: tokenDraft.trim(),
      });
      setTestResult(null);
      onSaved();
    } finally {
      setSaving(false);
    }
  }, [urlDraft, tokenDraft, onSaved]);

  return (
    <View className="gap-5">
      <View className="gap-1">
        <Text className="text-[20px] font-medium leading-[26px] text-foreground">
          Servidor
        </Text>
        <View className="flex-row items-center gap-1.5">
          <StatusDot tone={status.tone} />
          <Text className={`t-label ${toneClass(status.tone)}`}>
            {status.label}
          </Text>
        </View>
      </View>

      <OutlinedField
        label="URL del backend"
        value={urlDraft}
        onChange={(value) => {
          setUrlDraft(value);
          setTestResult(null);
        }}
        placeholder="http://<tailscale-dns-o-ip>:8000"
        helper="Vacía = modo demo. Con la URL de Tailscale se carga la biblioteca real."
        autoCapitalize="none"
        inputMode="url"
      />

      <OutlinedField
        label="Token (opcional)"
        value={tokenDraft}
        onChange={(value) => {
          setTokenDraft(value);
          setTestResult(null);
        }}
        placeholder="NOVEL_WEB_TOKEN del servidor"
        helper="Solo si el servidor lo pide (X-Auth-Token)."
        autoCapitalize="none"
      />

      {testResult !== null && (
        <View className="flex-row items-center gap-1.5">
          <StatusDot tone={testResult.ok ? "success" : "danger"} />
          <Text
            numberOfLines={2}
            className={`t-meta flex-1 ${
              testResult.ok ? "text-success" : "text-danger"
            }`}
          >
            {testResult.message}
          </Text>
        </View>
      )}

      <View className="flex-row gap-2">
        <ActionButton
          tone="secondary"
          className="flex-1"
          onPress={() => void handleTest()}
          loading={testing}
        >
          Probar
        </ActionButton>
        <ActionButton
          className="flex-1"
          onPress={() => void handleSave()}
          loading={saving}
        >
          Guardar
        </ActionButton>
      </View>
    </View>
  );
}
