import { MaterialIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Select } from "heroui-native/select";
import { Switch } from "heroui-native/switch";
import { useThemeColor } from "heroui-native/hooks";
import { ListCard, ListRow } from "@/components/list-card";
import { ActionButton } from "@/components/action-button";
import { OutlinedField } from "@/components/download/outlined-field";
import { TRANSLATE_TARGETS, VOLUME_SIZES } from "@/lib/languages";

const TARGET_LANG_OPTIONS = TRANSLATE_TARGETS.map((language) => ({
  value: language.code,
  label: language.label,
}));

export interface PdfFileInfo {
  uri: string;
  name: string;
  size: number | null;
}

interface PdfFormProps {
  file: PdfFileInfo | null;
  onPickFile: () => void;
  onRemoveFile: () => void;
  submitting: boolean;
  onSubmit: () => void;
  title: string;
  onTitleChange: (value: string) => void;
  author: string;
  onAuthorChange: (value: string) => void;
  kind: "auto" | "book" | "webnovel";
  onKindChange: (value: "auto" | "book" | "webnovel") => void;
  sourceLang: string;
  onSourceLangChange: (value: string) => void;
  volume: string;
  onVolumeChange: (value: string) => void;
  translate: boolean;
  onTranslateChange: (value: boolean) => void;
  targetLang: string;
  onTargetLangChange: (value: string) => void;
}

const PDF_KIND_OPTIONS: {
  value: "auto" | "book" | "webnovel";
  label: string;
}[] = [
  { value: "auto", label: "Automático" },
  { value: "book", label: "Libro" },
  { value: "webnovel", label: "Webnovel" },
];

const VOLUME_OPTIONS = VOLUME_SIZES.map((size) => ({
  value: String(size),
  label: String(size),
}));

/** Outlined select de 56 (trigger unstyled) para `OutlinedSelectField`. */
function SelectTriggerOutlined({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const selected =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <Select
      value={selected}
      onValueChange={(option) => {
        if (
          !Array.isArray(option) &&
          typeof option === "object" &&
          option.value
        ) {
          onChange(String(option.value));
        }
      }}
    >
      <Select.Trigger
        variant="unstyled"
        accessibilityLabel={label}
        className="h-14 flex-row items-center justify-between gap-3 rounded-xl border border-border bg-transparent px-4 active:bg-surface-secondary"
      >
        <Text
          numberOfLines={1}
          className="min-w-0 flex-1 text-[16px] leading-6 text-foreground"
        >
          {selected.label}
        </Text>
        <Select.TriggerIndicator />
      </Select.Trigger>
      <Select.Portal>
        <Select.Overlay />
        <Select.Content presentation="popover" width="trigger">
          {options.map((option) => (
            <Select.Item
              key={option.value}
              value={option.value}
              label={option.label}
            />
          ))}
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}

/** Campo de selector outlined + su label de 12/16 encima. */
function OutlinedSelectField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <View className="flex-1 gap-1.5">
      <Text className="t-meta text-muted">{props.label}</Text>
      <SelectTriggerOutlined {...props} />
    </View>
  );
}

/** Formulario PDF (spec 0.4.0-03): archivo, metadatos y CTA accent. */
export function PdfForm({
  file,
  onPickFile,
  onRemoveFile,
  submitting,
  onSubmit,
  title,
  onTitleChange,
  author,
  onAuthorChange,
  kind,
  onKindChange,
  sourceLang,
  onSourceLangChange,
  volume,
  onVolumeChange,
  translate,
  onTranslateChange,
  targetLang,
  onTargetLangChange,
}: PdfFormProps) {
  const accent = useThemeColor("accent");

  return (
    <View className="gap-4">
      <ListCard>
        {file !== null ? (
          <ListRow
            title={file.name}
            description={
              file.size !== null
                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                : undefined
            }
            leading={
              <MaterialIcons name="picture-as-pdf" size={24} color={accent} />
            }
            accessory={
              <MaterialIcons name="delete" size={22} color={accent} />
            }
            onPress={onRemoveFile}
            accessibilityLabel="Quitar archivo"
          />
        ) : (
          <ListRow
            title="Elegir archivo PDF"
            leading={
              <MaterialIcons name="description" size={24} color={accent} />
            }
            onPress={onPickFile}
            showChevron
          />
        )}
      </ListCard>

      <OutlinedField
        label="Título (opcional)"
        value={title}
        onChange={onTitleChange}
        placeholder="Kunon the Sorcerer Can See v01"
        helper="Si lo dejas vacío se usa el nombre del archivo o los metadatos del PDF."
      />

      <OutlinedField
        label="Autor (opcional)"
        value={author}
        onChange={onAuthorChange}
        placeholder="Autor del PDF"
      />

      <View className="flex-row gap-3">
        <OutlinedSelectField
          label="Tipo de PDF"
          value={kind}
          onChange={(value) => {
            if (value === "auto" || value === "book" || value === "webnovel") {
              onKindChange(value);
            }
          }}
          options={PDF_KIND_OPTIONS}
        />
      </View>

      <View className="flex-row gap-3">
        <OutlinedSelectField
          label="Idioma del PDF"
          value={sourceLang}
          onChange={onSourceLangChange}
          options={TARGET_LANG_OPTIONS}
        />
        <OutlinedSelectField
          label="Capítulos por tomo"
          value={volume}
          onChange={(value) => onVolumeChange(value)}
          options={VOLUME_OPTIONS}
        />
      </View>

      <View className="gap-2">
        <View className="min-h-14 flex-row items-center gap-4">
          <View className="flex-1 gap-0.5">
            <Text className="t-body text-foreground">Traducir</Text>
            <Text className="t-meta text-muted">
              Traduce el PDF al terminar la conversión
            </Text>
          </View>
          <Switch
            isSelected={translate}
            onSelectedChange={onTranslateChange}
            accessibilityLabel="Traducir PDF"
          />
        </View>

        {translate && (
          <SelectTriggerOutlined
            label="Idioma de traducción"
            value={targetLang}
            onChange={onTargetLangChange}
            options={TARGET_LANG_OPTIONS}
          />
        )}
      </View>

      <ActionButton onPress={onSubmit} loading={submitting}>
        Subir y convertir
      </ActionButton>
    </View>
  );
}
