import Constants from "expo-constants";
import { Platform, ScrollView, Share, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useApi } from "@/lib/api-provider";
import { ActionButton } from "@/components/action-button";
import { PAGE_CONTENT } from "@/lib/layout";
import { ListCard, ListRow } from "@/components/list-card";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row gap-3">
      <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-surface-secondary">
        <Text className="t-meta font-semibold text-foreground">{number}</Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="t-body text-foreground">{title}</Text>
        <Text className="t-meta text-muted">{description}</Text>
      </View>
    </View>
  );
}

/**
 * Ayuda para usuario (spec 0.3.0-03). Antes esta pantalla era documentación
 * interna (specs, docs, SDD, "mock/fase 1"): no le servía a nadie.
 */
export default function AboutScreen() {
  const router = useRouter();
  const { settings } = useApi();
  const hasServer = settings.apiUrl.trim() !== "";

  const shareDiagnostic = async () => {
    try {
      await Share.share({
        message: [
          "novel-library-mobile",
          `Versión: ${APP_VERSION}`,
          `Servidor: ${hasServer ? "configurado (Tailscale)" : "modo demo"}`,
          `Plataforma: ${Platform.OS} ${String(Platform.Version)}`,
        ].join("\n"),
      });
    } catch {
      // El usuario puede cerrar el share sheet; no hay nada que hacer.
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName={`${PAGE_CONTENT} gap-6 px-4 pb-12 pt-4`}
    >
      <Text className="t-body text-muted">
        Cliente nativo de tu biblioteca de novelas. Se conecta al servidor de
        novel-cli por Tailscale (DNS o IP privada) sin abrir el navegador, y
        también funciona sin servidor en modo demo.
      </Text>

      <View className="gap-2">
        <Text className="t-section text-foreground">Conectar el servidor</Text>
        <View className="gap-4 rounded-2xl border border-border bg-surface p-4">
          <Step
            number={1}
            title="Abre Ajustes → Servidor"
            description="La URL del backend es la de Tailscale o la IP privada del equipo."
          />
          <Step
            number={2}
            title="Añade el token si el servidor lo pide"
            description="Es el valor NOVEL_WEB_TOKEN; se envía como X-Auth-Token."
          />
          <Step
            number={3}
            title="Pulsa Probar conexión"
            description="Si todo está bien verás el estado en verde y la biblioteca real."
          />
          <ActionButton
            tone="secondary"
            onPress={() => router.push("/settings")}
          >
            Ir a Servidor
          </ActionButton>
        </View>
      </View>

      <View className="gap-2">
        <Text className="t-section text-foreground">Glosario</Text>
        <ListCard>
          <ListRow
            title="Tomo"
            description="Bloque de capítulos que se empaqueta en un EPUB."
          />
          <ListRow
            title="EPUB"
            description="Formato de lectura que abren e-readers y apps como Moon+ o Apple Books."
          />
          <ListRow
            title="Traducción"
            description="Versión del texto en otro idioma; convive con el original."
          />
        </ListCard>
      </View>

      <View className="gap-2">
        <Text className="t-section text-foreground">Diagnóstico</Text>
        <ListCard>
          <ListRow title="Versión" value={APP_VERSION} />
          <ListRow
            title="Servidor"
            value={hasServer ? "Configurado" : "Modo demo"}
          />
          <ListRow
            title="Origen de datos"
            value={hasServer ? "Biblioteca real" : "Mock local"}
          />
        </ListCard>
        <ActionButton tone="secondary" onPress={() => void shareDiagnostic()}>
          Compartir diagnóstico
        </ActionButton>
      </View>

      <View className="gap-2">
        <Text className="t-section text-foreground">Créditos</Text>
        <View className="gap-2 rounded-2xl border border-border bg-surface p-4">
          <Text className="t-meta text-muted">
            Hecho con Expo SDK 58, HeroUI Native y Uniwind (Tailwind 4).
          </Text>
          <Text className="t-meta text-muted">
            Código abierto bajo la licencia incluida en el proyecto (LICENSE).
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
