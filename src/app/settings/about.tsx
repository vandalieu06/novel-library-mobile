import { ScrollView, Text, View } from "react-native";
import { Chip } from "heroui-native/chip";

/** Ayuda estática de la app (página extra de Ajustes). */
export default function AboutScreen() {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 gap-4 pb-12">
      <View className="gap-1">
        <Text className="text-sm text-muted">
          novel-library · cliente nativo del backend de novel-cli web, pensado
          para conectarse por Tailscale (DNS o IP privada) sin abrir el
          navegador.
        </Text>
      </View>

      <View className="gap-2">
        <Text className="text-lg font-semibold text-foreground">Stack</Text>
        <View className="flex-row flex-wrap gap-2">
          <Chip size="sm" variant="soft" color="default">
            <Chip.Label>Expo SDK 58</Chip.Label>
          </Chip>
          <Chip size="sm" variant="soft" color="default">
            <Chip.Label>HeroUI Native</Chip.Label>
          </Chip>
          <Chip size="sm" variant="soft" color="default">
            <Chip.Label>Uniwind (Tailwind 4)</Chip.Label>
          </Chip>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-lg font-semibold text-foreground">Ayuda</Text>
        <Text className="text-sm text-muted">
          · El formulario de Inicio lanza jobs de descarga (mock en fase 1).
        </Text>
        <Text className="text-sm text-muted">
          · En Ajustes se configura la URL del servidor; con la API real (fase
          2) la app leerá la biblioteca desde ahí.
        </Text>
        <Text className="text-sm text-muted">
          · El plan evolutivo vive en `specs/0.1.0/` y la referencia técnica en
          `docs/arquitectura.md` (flujo SDD).
        </Text>
      </View>
    </ScrollView>
  );
}
