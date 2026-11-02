import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { BottomSheet } from "heroui-native/bottom-sheet";
import { SearchField } from "heroui-native/search-field";
import { Separator } from "heroui-native/separator";
import { Skeleton } from "heroui-native/skeleton";
import { Switch } from "heroui-native/switch";
import { TagGroup } from "heroui-native/tag-group";
import { ApiError } from "@/lib/api";
import { useApi } from "@/lib/api-provider";
import { resolveGridColumns } from "@/lib/grid";
import type { GridDensitySetting } from "@/lib/settings";
import { loadSettings, onSettingsChange } from "@/lib/settings";
import type { Novel } from "@/lib/types";
import { ActionButton } from "@/components/action-button";
import { EmptyState } from "@/components/empty-state";
import { NovelCard } from "@/components/novel-card";
import { Screen } from "@/components/screen";
import { SegmentedField } from "@/components/segmented-field";

type OriginFilter = "all" | "web" | "pdf";
type SortKey = "recent" | "title";

interface Filters {
  origin: OriginFilter;
  translatedOnly: boolean;
  languages: string[];
}

const DEFAULT_FILTERS: Filters = {
  origin: "all",
  translatedOnly: false,
  languages: [],
};

const ORIGIN_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "web", label: "Web" },
  { value: "pdf", label: "PDF" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recientes" },
  { value: "title", label: "Título" },
];

// Grid: el ancho de celda se calcula para que una fila incompleta NO estire
// la última card (spec 0.3.0-04). Debe coincidir con px-4 y gap-3.
const PAGE_PADDING = 16;
const GRID_GAP = 12;

/** Chip removible de un filtro activo. */
function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <View className="h-8 flex-row items-center gap-1 rounded-full bg-surface px-2.5">
      <Text className="t-meta text-foreground">{label}</Text>
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        accessibilityLabel={`Quitar filtro ${label}`}
      >
        <Ionicons name="close" size={14} color="#8b8b93" />
      </Pressable>
    </View>
  );
}

export default function BooksScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { api } = useApi();

  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status: number } | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("recent");
  const [gridSetting, setGridSetting] = useState<GridDensitySetting>("auto");
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const load = useCallback(
    async (asRefresh = false) => {
      if (asRefresh) setRefreshing(true);
      try {
        setNovels(await api.getNovels());
        setError(null);
      } catch (caught) {
        setError(
          caught instanceof ApiError
            ? { message: caught.message, status: caught.status }
            : { message: "Error inesperado", status: 0 },
        );
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [api],
  );

  // Refresca al montar y al volver del detalle (sync/retraducir/tomos, spec 04).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const availableLanguages = useMemo(
    () =>
      [
        ...new Set(
          novels
            .map((novel) => novel.translated_language)
            .filter((code): code is string => code !== null),
        ),
      ].sort(),
    [novels],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = novels.filter((novel) => {
      if (filters.origin === "web" && novel.source_pdf !== null) return false;
      if (filters.origin === "pdf" && novel.source_pdf === null) return false;
      if (filters.translatedOnly && !novel.translated) return false;
      if (
        filters.languages.length > 0 &&
        (novel.translated_language === null ||
          !filters.languages.includes(novel.translated_language))
      ) {
        return false;
      }
      return (
        query === "" ||
        novel.title.toLowerCase().includes(query) ||
        (novel.author ?? "").toLowerCase().includes(query)
      );
    });
    return [...list].sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title)
        : (b.updated_at ?? "").localeCompare(a.updated_at ?? ""),
    );
  }, [novels, search, filters, sort]);

  const columns = resolveGridColumns(width, gridSetting);
  const itemWidth = Math.floor(
    (width - PAGE_PADDING * 2 - GRID_GAP * (columns - 1)) / columns,
  );
  const activeFilters =
    (filters.origin !== "all" ? 1 : 0) +
    (filters.translatedOnly ? 1 : 0) +
    filters.languages.length;
  const hasFilters = activeFilters > 0;

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSort("recent");
  }, []);

  const toggleLanguage = useCallback((code: string) => {
    setFilters((current) => ({
      ...current,
      languages: current.languages.includes(code)
        ? current.languages.filter((item) => item !== code)
        : [...current.languages, code],
    }));
  }, []);

  const header = (
    <View className="gap-3 px-4 pb-3 pt-3">
      <View className="gap-1">
        <Text className="t-page text-foreground">Biblioteca</Text>
        <Text className="t-body text-muted">Tus novelas descargadas.</Text>
      </View>

      {/* Una fila: búsqueda + filtros (44) */}
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <SearchField value={search} onChange={setSearch}>
            <SearchField.Group className="h-11">
              <SearchField.SearchIcon />
              <SearchField.Input
                placeholder="Buscar por título o autor"
                className="text-sm"
              />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </View>

        <BottomSheet isOpen={sheetOpen} onOpenChange={setSheetOpen}>
          <BottomSheet.Trigger asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir filtros"
              className="h-11 flex-row items-center gap-1.5 rounded-lg bg-surface px-3"
            >
              <Ionicons name="funnel-outline" size={16} color="#8b8b93" />
              <Text className="t-body text-foreground">Filtros</Text>
              {activeFilters > 0 && (
                <View className="h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1">
                  <Text className="t-meta font-semibold text-background">
                    {activeFilters}
                  </Text>
                </View>
              )}
            </Pressable>
          </BottomSheet.Trigger>
          <BottomSheet.Portal>
            <BottomSheet.Overlay />
            <BottomSheet.Content contentContainerClassName="gap-5 px-5 pb-10 pt-5">
              <View className="gap-1">
                <BottomSheet.Title className="t-section text-foreground">
                  Filtros
                </BottomSheet.Title>
                <Text className="t-meta text-muted">
                  Se aplican al instante sobre la biblioteca.
                </Text>
              </View>

              <SegmentedField
                label="Origen"
                value={filters.origin}
                options={ORIGIN_OPTIONS}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    origin:
                      value === "web" || value === "pdf" ? value : "all",
                  }))
                }
              />

              <Separator />

              <View className="gap-3">
                <View className="min-h-11 flex-row items-center gap-4">
                  <View className="flex-1 gap-0.5">
                    <Text className="t-body text-foreground">
                      Solo traducidas
                    </Text>
                    <Text className="t-meta text-muted">
                      Novelas con versión traducida
                    </Text>
                  </View>
                  <Switch
                    isSelected={filters.translatedOnly}
                    onSelectedChange={(value) =>
                      setFilters((current) => ({
                        ...current,
                        translatedOnly: value,
                      }))
                    }
                  />
                </View>

                {availableLanguages.length > 0 && (
                  <View className="gap-2">
                    <Text className="t-label text-muted">
                      Idioma traducido
                    </Text>
                    <TagGroup
                      selectionMode="multiple"
                      selectedKeys={new Set(filters.languages)}
                      onSelectionChange={(keys) => {
                        setFilters((current) => ({
                          ...current,
                          languages: [...keys].map(String),
                        }));
                      }}
                    >
                      <TagGroup.List className="flex-row flex-wrap gap-2">
                        {availableLanguages.map((code) => (
                          <TagGroup.Item key={code} id={code}>
                            <TagGroup.ItemLabel>
                              {code.toUpperCase()}
                            </TagGroup.ItemLabel>
                          </TagGroup.Item>
                        ))}
                      </TagGroup.List>
                    </TagGroup>
                  </View>
                )}
              </View>

              <Separator />

              <SegmentedField
                label="Orden"
                value={sort}
                options={SORT_OPTIONS}
                onChange={(value) =>
                  setSort(value === "title" ? "title" : "recent")
                }
              />

              <View className="flex-row gap-2">
                <ActionButton
                  tone="ghost"
                  className="flex-1"
                  onPress={resetFilters}
                >
                  Restablecer
                </ActionButton>
                <ActionButton className="flex-1" onPress={() => setSheetOpen(false)}>
                  Listo
                </ActionButton>
              </View>
            </BottomSheet.Content>
          </BottomSheet.Portal>
        </BottomSheet>
      </View>

      <View className="flex-row items-center justify-between gap-3">
        <Text className="t-meta text-muted [font-variant-numeric:tabular-nums]">
          {hasFilters
            ? `${filtered.length} de ${novels.length} novelas`
            : `${novels.length} ${novels.length === 1 ? "novela" : "novelas"}`}
        </Text>
        {hasFilters && (
          <Pressable onPress={resetFilters} hitSlop={8}>
            <Text className="t-meta text-foreground">Limpiar</Text>
          </Pressable>
        )}
      </View>

      {hasFilters && (
        <View className="flex-row flex-wrap gap-2">
          {filters.origin !== "all" && (
            <FilterChip
              label={filters.origin === "pdf" ? "PDF" : "Web"}
              onRemove={() =>
                setFilters((current) => ({ ...current, origin: "all" }))
              }
            />
          )}
          {filters.translatedOnly && (
            <FilterChip
              label="Traducidas"
              onRemove={() =>
                setFilters((current) => ({
                  ...current,
                  translatedOnly: false,
                }))
              }
            />
          )}
          {filters.languages.map((code) => (
            <FilterChip
              key={code}
              label={code.toUpperCase()}
              onRemove={() => toggleLanguage(code)}
            />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <Screen>
      {header}

      {isLoading ? (
        <View className="gap-3 px-4">
          {Array.from({ length: 3 }).map((_, row) => (
            <View key={row} className="flex-row gap-3">
              {Array.from({ length: columns }).map((__, column) => (
                <View key={column} style={{ width: itemWidth }}>
                  <Skeleton className="h-80 rounded-lg" />
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : error !== null ? (
        <EmptyState
          icon={error.status === 401 ? "key-outline" : "cloud-offline-outline"}
          title={
            error.status === 401
              ? "Token inválido"
              : "No se pudo cargar la biblioteca"
          }
          description={
            error.status === 401 ? "Revisa el token en Ajustes." : error.message
          }
          action={
            <View className="flex-row gap-2">
              <ActionButton
                size="sm"
                tone="secondary"
                onPress={() => {
                  setIsLoading(true);
                  void load();
                }}
              >
                Reintentar
              </ActionButton>
              {error.status === 401 && (
                <ActionButton
                  size="sm"
                  tone="ghost"
                  onPress={() => router.push("/settings")}
                >
                  Ir a Ajustes
                </ActionButton>
              )}
            </View>
          }
        />
      ) : novels.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title="Tu biblioteca está vacía"
          description="Lanza una descarga o sube un PDF desde Inicio."
          action={
            <ActionButton size="sm" onPress={() => router.push("/")}>
              Ir a Inicio
            </ActionButton>
          }
        />
      ) : (
        <FlatList
          key={columns}
          numColumns={columns}
          data={filtered}
          keyExtractor={(item) => item.slug}
          renderItem={({ item }) => (
            <View style={{ width: itemWidth }} className="pb-4">
              <NovelCard novel={item} />
            </View>
          )}
          columnWrapperClassName="gap-3"
          contentContainerClassName="px-4 pb-8"
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="Sin resultados"
              description="Prueba con otra búsqueda o quita filtros."
              action={
                <ActionButton size="sm" tone="secondary" onPress={resetFilters}>
                  Limpiar filtros
                </ActionButton>
              }
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
            />
          }
        />
      )}
    </Screen>
  );
}
