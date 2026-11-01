import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Chip } from "heroui-native/chip";
import { PressableFeedback } from "heroui-native/pressable-feedback";
import { SearchField } from "heroui-native/search-field";
import { Select } from "heroui-native/select";
import { Skeleton } from "heroui-native/skeleton";
import { api } from "@/lib/api";
import { resolveGridColumns } from "@/lib/grid";
import type { GridDensitySetting } from "@/lib/settings";
import { loadSettings, onSettingsChange } from "@/lib/settings";
import type { Novel } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { NovelCard } from "@/components/novel-card";

type FilterKey = "all" | "translated" | "pdf";
type SortKey = "recent" | "title";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "translated", label: "Traducidas" },
  { key: "pdf", label: "PDF" },
];

/** Opciones de orden (formato SelectOption de heroui: { value, label }). */
const SORT_OPTIONS = [
  { value: "recent", label: "Recientes" },
  { value: "title", label: "Título" },
];

export default function BooksScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [gridSetting, setGridSetting] = useState<GridDensitySetting>("auto");

  // Densidad del grid: ajuste del usuario (con override desde Ajustes, spec 04)
  useEffect(() => {
    let active = true;
    void loadSettings().then((s) => {
      if (active) setGridSetting(s.gridDensity);
    });
    return onSettingsChange((s) => {
      if (active) setGridSetting(s.gridDensity);
    });
  }, []);

  const load = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    try {
      setNovels(await api.getNovels());
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Carga inicial de datos (patrón fetch-on-mount estándar en RN; la regla
    // react-hooks/set-state-in-effect lo marca por conservadurismo).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = novels.filter(
      (novel) =>
        (filter === "all" ||
          (filter === "translated" ? novel.translated : Boolean(novel.source_pdf))) &&
        (query === "" ||
          novel.title.toLowerCase().includes(query) ||
          (novel.author ?? "").toLowerCase().includes(query)),
    );
    return [...list].sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : (b.updated_at ?? "").localeCompare(a.updated_at ?? ""),
    );
  }, [novels, search, filter, sort]);

  const columns = resolveGridColumns(width, gridSetting);
  const sortOption = SORT_OPTIONS.find((option) => option.value === sort) ?? SORT_OPTIONS[0];

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="gap-3 px-4 pb-3 pt-3">
        <View className="gap-0.5">
          <Text className="text-2xl font-bold text-foreground">Biblioteca</Text>
          <Text className="text-sm text-muted">Tus novelas descargadas.</Text>
        </View>

        <SearchField value={search} onChange={setSearch}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Buscar por título o autor" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <View className="flex-row items-center gap-2">
          {FILTERS.map((item) => {
            const selected = filter === item.key;
            return (
              <PressableFeedback
                key={item.key}
                onPress={() => setFilter(item.key)}
                animation={{ scale: false }}
              >
                <Chip
                  size="sm"
                  variant={selected ? "primary" : "tertiary"}
                  color={selected ? "accent" : "default"}
                >
                  <Chip.Label>{item.label}</Chip.Label>
                </Chip>
              </PressableFeedback>
            );
          })}
          <View className="flex-1" />
          <View className="w-36">
            <Select value={sortOption} onValueChange={(option) => {
              if (!option) return;
              if (option.value === "recent" || option.value === "title") setSort(option.value);
            }}>
              <Select.Trigger className="h-9">
                <Select.Value placeholder="Orden" />
                <Select.TriggerIndicator />
              </Select.Trigger>
              <Select.Portal>
                <Select.Overlay />
                <Select.Content presentation="popover" width="trigger">
                  <Select.Item value="recent" label="Recientes" />
                  <Select.Item value="title" label="Título" />
                </Select.Content>
              </Select.Portal>
            </Select>
          </View>
        </View>

        <Text className="text-xs text-muted [font-variant-numeric:tabular-nums]">
          {filtered.length} {filtered.length === 1 ? "novela" : "novelas"}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-row flex-wrap gap-3 px-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 flex-1 min-w-[30%] rounded-lg" />
          ))}
        </View>
      ) : (
        <FlatList
          key={columns}
          numColumns={columns}
          data={filtered}
          keyExtractor={(item) => item.slug}
          renderItem={({ item }) => (
            <View className="flex-1 pb-4">
              <NovelCard novel={item} />
            </View>
          )}
          columnWrapperClassName="gap-3"
          contentContainerClassName="px-4 pb-8"
          ListEmptyComponent={
            <EmptyState
              icon="book-outline"
              title="Sin resultados"
              description="Prueba con otra búsqueda o filtro"
            />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />
          }
        />
      )}
    </View>
  );
}
