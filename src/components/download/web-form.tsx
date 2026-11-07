import { Text, View } from "react-native";
import { Select } from "heroui-native/select";
import { Switch } from "heroui-native/switch";
import { ListCard, ListRow } from "@/components/list-card";
import { ActionButton } from "@/components/action-button";
import { OutlinedField } from "@/components/download/outlined-field";
import { TRANSLATE_TARGETS } from "@/lib/languages";

const TARGET_LANG_OPTIONS = TRANSLATE_TARGETS.map((language) => ({
  value: language.code,
  label: language.label,
}));

interface WebFormProps {
  url: string;
  onUrlChange: (value: string) => void;
  urlError: boolean;
  submitting: boolean;
  onSubmit: () => void;
  translate: boolean;
  onTranslateChange: (value: boolean) => void;
  targetLang: string;
  onTargetLangChange: (value: string) => void;
  /** Nº de opciones avanzadas activas ("0" muestra "Todas por defecto"). */
  advancedCount: number;
  onOpenAdvanced: () => void;
}

/**
 * Formulario Web (spec 0.4.0-03): campo URL outlined de 56 con error inline,
 * CTA accent y card "Opciones" con filas de 56 (switch, idioma, avanzadas).
 */
export function WebForm({
  url,
  onUrlChange,
  urlError,
  submitting,
  onSubmit,
  translate,
  onTranslateChange,
  targetLang,
  onTargetLangChange,
  advancedCount,
  onOpenAdvanced,
}: WebFormProps) {
  const inlineSwitch = (
    <Switch isSelected={translate} onSelectedChange={onTranslateChange} />
  );
  const langOption =
    TARGET_LANG_OPTIONS.find((language) => language.value === targetLang) ??
    TARGET_LANG_OPTIONS[0];

  return (
    <View className="gap-4">
      <OutlinedField
        label="URL de la novela"
        value={url}
        onChange={onUrlChange}
        placeholder="https://novelfire.net/..."
        error={
          urlError ? "Debe empezar por http:// o https://" : undefined
        }
        autoCapitalize="none"
        inputMode="url"
      />

      <ActionButton onPress={onSubmit} loading={submitting}>
        Descargar
      </ActionButton>

      <ListCard>
        <ListRow
          title="Traducir al terminar"
          description="Traduce la novela al terminar la descarga"
          accessory={inlineSwitch}
        />

        {translate && (
          <Select
            value={langOption}
            onValueChange={(option) => {
              if (
                !Array.isArray(option) &&
                typeof option === "object" &&
                option.value
              ) {
                onTargetLangChange(String(option.value));
              }
            }}
          >
            <Select.Trigger
              variant="unstyled"
              accessibilityLabel="Idioma de traducción"
              className="min-h-14 flex-row items-center gap-3 px-4 py-2.5 bg-transparent active:bg-surface-secondary"
            >
              <View className="min-w-0 flex-1">
                <Text className="t-body text-foreground">Idioma</Text>
              </View>
              <Text numberOfLines={1} className="t-label text-muted">
                {langOption.label}
              </Text>
              <Select.TriggerIndicator />
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content presentation="popover" width="trigger">
                <Select.ListLabel>Idioma de traducción</Select.ListLabel>
                {TARGET_LANG_OPTIONS.map((language) => (
                  <Select.Item
                    key={language.value}
                    value={language.value}
                    label={language.label}
                  />
                ))}
              </Select.Content>
            </Select.Portal>
          </Select>
        )}

        <ListRow
          title="Opciones avanzadas"
          description={
            advancedCount > 0
              ? `${advancedCount} ${
                  advancedCount === 1 ? "activa" : "activas"
                }`
              : "Todas por defecto"
          }
          onPress={onOpenAdvanced}
          showChevron
        />
      </ListCard>
    </View>
  );
}
