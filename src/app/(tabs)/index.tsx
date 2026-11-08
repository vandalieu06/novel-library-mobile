import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { Menu } from "heroui-native/menu";
import { useThemeColor } from "heroui-native/hooks";
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
import { TagGroup } from "heroui-native/tag-group";
import { ApiError } from "@/lib/api";
import { useApi } from "@/lib/api-provider";
import { resolveGridColumns } from "@/lib/grid";
import {
  PANEL_WIDTH,
  RAIL_DP,
  RAIL_WIDTH,
  SPLIT_DP,
} from "@/lib/layout";
import type { GridDensitySetting } from "@/lib/settings";
import { loadSettings, onSettingsChange } from "@/lib/settings";
import type { Novel } from "@/lib/types";
import { ActionButton } from "@/components/action-button";
import { AppBar, AppBarAction } from "@/components/app-bar";
import { DetailPanel } from "@/components/detail-panel";
import { EmptyState } from "@/components/empty-state";
import { NovelCard } from "@/components/novel-card";
import { Screen } from "@/components/screen";
import { SegmentedField } from "@/components/segmented-field";
import { TabRow } from "@/components/tab-row";

type CategoryTab = "all" | "web" | "pdf" | "translated";
type SortKey = "recent" | "title";

const CATEGORY_OPTIONS: { value: CategoryTab; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "web", label: "Web" },
  { value: "pdf", label: "PDF" },
  { value: "translated", label: "Traducidas" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recientes" },
  { value: "title", label: "Título" },
];

// Grid: el ancho de celda se calcula para que una fila incompleta NO estire
// la última card (spec 0.3.0-04). Debe coincidir con px-4 y el gap de columnas.
const PAGE_PADDING = 16;
const GRID_GAP = 12;

interface StateFilters {
  languages: string[];
}

export default function LibraryScreen() {
  const { width, fontScale } = useWindowDimensions();
  const router = useRouter();
  const { api } = useApi();
  const overflowColor = useThemeColor("foreground");

  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status: number } | null>(
    null,
  );

  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<CategoryTab>("all");
  const [filters, setFilters] = useState<StateFilters>({ languages: [] });
  const [sort, setSort] = useState<SortKey>("recent");
  const [gridSetting, setGridSetting] = useState<GridDensitySetting>("auto");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const isTablet = width >= RAIL_DP;
  const hasPanel = width >= SPLIT_DP;
  const contentWidth =
    width - (isTablet ? RAIL_WIDTH : 0) - (hasPanel ? PANEL_WIDTH : 0);

  // Densidad del grid: ajuste del usuario con override desde Ajustes.
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

  // Refresca al montar y al volver del detalle (sync/retraducir/tomos).
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

  // La búsqueda se aplica diferida para no bloquear el grid con cada tecla.
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const origin = tab === "web" || tab === "pdf" ? tab : "all";
    const translatedOnly = tab === "translated";
    const list = novels.filter((novel) => {
      if (origin === "web" && novel.source_pdf !== null) return false;
      if (origin === "pdf" && novel.source_pdf === null) return false;
      if (translatedOnly && !novel.translated) return false;
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
  }, [novels, deferredSearch, tab, filters, sort]);

  const columns = resolveGridColumns(
    contentWidth,
    gridSetting,
    hasPanel,
    fontScale,
  );
  const itemWidth = Math.floor(
    (contentWidth - PAGE_PADDING * 2 - GRID_GAP * (columns - 1)) / columns,
  );

  // La selección del panel cae a la primera novela visible si la elegida
  // desaparece por búsqueda/filtros o por un refresco (spec 0.4.0-06).
  const selectedNovel = useMemo(
    () =>
      filtered.find((novel) => novel.slug === selectedSlug) ??
      filtered[0] ??
      null,
    [filtered, selectedSlug],
  );

  const totalVolumes = useMemo(
    () =>
      novels.reduce(
        (sum, novel) =>
          sum + novel.epub_original.length + novel.epub_translated.length,
        0,
      ),
    [novels],
  );
  const hasQuery = search.trim() !== "";
  // El badge del icono de filtros cuenta solo idiomas activos (spec 0.4.0-02);
  // el orden solo activa el acceso rápido de "Restablecer".
  const languageCount = filters.languages.length;
  const hasFilters = languageCount > 0 || sort !== "recent";

  const resetFilters = useCallback(() => {
    setFilters({ languages: [] });
    setSort("recent");
  }, []);

  const clearSearchAndFilters = useCallback(() => {
    setSearch("");
    setTab("all");
    resetFilters();
  }, [resetFilters]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearch("");
  }, []);

  // El buscador se enfoca al abrirse (autofocus del propio input).
  const searchField = searchOpen ? (
    <View className="flex-row items-center gap-2 px-4 pt-1">
      <View className="flex-1">
        <SearchField value={search} onChange={setSearch}>
          <SearchField.Group className="h-11">
            <SearchField.SearchIcon />
            <SearchField.Input
              autoFocus
              placeholder="Buscar por título o autor"
              className="text-sm android:focus:border-foreground ios:focus:outline-foreground"
            />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </View>
    </View>
  ) : null;

  const header = (
    <View className="pb-2">
      <AppBar
        title="Biblioteca"
        actions={
          <>
            <AppBarAction
              icon={searchOpen ? "close" : "search"}
              label={searchOpen ? "Cerrar búsqueda" : "Buscar"}
              onPress={searchOpen ? closeSearch : () => setSearchOpen(true)}
            />
            <AppBarAction
              icon="tune"
              label="Filtros"
              badge={languageCount}
              onPress={() => setSheetOpen(true)}
            />
            <Menu>
              <Menu.Trigger
                accessibilityLabel="Más opciones"
                hitSlop={4}
                className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-secondary"
              >
                <MaterialIcons
                  name="more-vert"
                  size={24}
                  color={overflowColor}
                />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Overlay />
                <Menu.Content
                  presentation="popover"
                  placement="bottom"
                  align="end"
                  width={220}
                  className="p-1"
                >
                  <Menu.Item onPress={() => void load()}>
                    <Menu.ItemTitle>Actualizar</Menu.ItemTitle>
                  </Menu.Item>
                  <Menu.Item onPress={() => router.push("/settings")}>
                    <Menu.ItemTitle>Ir a Ajustes</Menu.ItemTitle>
                  </Menu.Item>
                </Menu.Content>
              </Menu.Portal>
            </Menu>
          </>
        }
      />

      {searchField}

      <TabRow
        className="mt-1"
        value={tab}
        onChange={(value: string) => setTab(value as CategoryTab)}
        options={CATEGORY_OPTIONS}
      />
    </View>
  );

  const counter = (
    <View className="flex-row items-center justify-between gap-3 px-4 pb-2 pt-3">
      <Text className="t-meta text-muted [font-variant-numeric:tabular-nums]">
        {hasQuery || filters.languages.length > 0
          ? `${filtered.length} de ${novels.length} novelas`
          : `${novels.length} ${novels.length === 1 ? "novela" : "novelas"} · ${totalVolumes} ${
              totalVolumes === 1 ? "tomo" : "tomos"
            }`}
      </Text>
      {hasFilters && (
        <Pressable onPress={resetFilters} hitSlop={8}>
          <Text className="t-label text-accent-ink">Restablecer</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <Screen>
      <View className="flex-1 flex-row">
        <View className="flex-1">
          {header}

          {isLoading ? (
        <View className="flex-1 gap-5 px-4">
          {Array.from({ length: 3 }).map((_, row) => (
            <View key={row} className="flex-row" style={{ gap: GRID_GAP }}>
              {Array.from({ length: columns }).map((__, column) => (
                <View key={column} style={{ width: itemWidth }}>
                  {/* Skeleton con la forma de la card de 02: cover 2:3 + título. */}
                  <Skeleton
                    className="w-full rounded-lg"
                    style={{ aspectRatio: 2 / 3 }}
                  />
                  <Skeleton className="mt-1.5 h-5 w-4/5 rounded-md" />
                  <Skeleton className="mt-1 h-4 w-2/5 rounded-md" />
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : error?.status === 401 ? (
        <EmptyState
          icon="key-outline"
          title="Token inválido"
          description="Revisa el token en Ajustes."
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
              <ActionButton
                size="sm"
                tone="ghost"
                onPress={() => router.push("/settings")}
              >
                Ir a Ajustes
              </ActionButton>
            </View>
          }
        />
      ) : error !== null ? (
        /* Error de red: mensaje inline + Reintentar, no empty state a pantalla. */
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text className="text-center t-body text-danger">{error.message}</Text>
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
        </View>
      ) : novels.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title="Tu biblioteca está vacía"
          description="Descarga una novela o sube un PDF."
          action={
            <ActionButton size="sm" onPress={() => router.push("/download")}>
              Descargar
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
            <View style={{ width: itemWidth }} className="pb-5">
              {/* pb-5 = gap vertical de 20 entre filas (spec 0.4.0-02). */}
              <NovelCard
                novel={item}
                selected={hasPanel && item.slug === selectedNovel?.slug}
                onPress={
                  hasPanel ? () => setSelectedSlug(item.slug) : undefined
                }
              />
            </View>
          )}
          columnWrapperClassName="gap-3"
          contentContainerClassName="px-4 pb-8"
          ListHeaderComponent={counter}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="Sin resultados"
              description="Prueba con otra búsqueda o quita los filtros."
              action={
                <ActionButton
                  size="sm"
                  tone="secondary"
                  onPress={clearSearchAndFilters}
                >
                  Limpiar búsqueda y filtros
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
        </View>

        {hasPanel && selectedNovel !== null && (
          <DetailPanel
            key={`${selectedNovel.slug}|${selectedNovel.updated_at ?? ""}`}
            slug={selectedNovel.slug}
            initialNovel={selectedNovel}
          />
        )}
      </View>

      {/* Filtros (sheet, spec 0.4.0-02): idiomas y orden. El origen y
          "traducidas" viven en las tabs de categoría, no aquí. */}
      <BottomSheet isOpen={sheetOpen} onOpenChange={setSheetOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content contentContainerClassName="gap-5 px-5 pb-10 pt-5">
            <View className="gap-1">
              <BottomSheet.Title className="t-section text-foreground">
                Filtros
              </BottomSheet.Title>
              <Text className="t-meta text-muted">
                El origen y “solo traducidas” viven en las tabs de categoría.
              </Text>
            </View>

            {availableLanguages.length > 0 ? (
              <View className="gap-2">
                <Text className="t-label text-muted">Idioma traducido</Text>
                <TagGroup
                  size="lg"
                  selectionMode="multiple"
                  selectedKeys={new Set(filters.languages)}
                  onSelectionChange={(keys) => {
                    setFilters({ languages: [...keys].map(String) });
                  }}
                >
                  <TagGroup.List className="flex-row flex-wrap gap-2">
                    {availableLanguages.map((code) => (
                      <TagGroup.Item
                        key={code}
                        id={code}
                        className="min-h-11 justify-center"
                      >
                        <TagGroup.ItemLabel>
                          {code.toUpperCase()}
                        </TagGroup.ItemLabel>
                      </TagGroup.Item>
                    ))}
                  </TagGroup.List>
                </TagGroup>
              </View>
            ) : (
              <Text className="t-meta text-muted">
                Sin novelas traducidas todavía.
              </Text>
            )}

            <Separator />

            <SegmentedField
              label="Orden"
              value={sort}
              options={SORT_OPTIONS}
              onChange={(value) => setSort(value === "title" ? "title" : "recent")}
            />

            <View className="flex-row gap-2">
              <ActionButton tone="ghost" className="flex-1" onPress={resetFilters}>
                Restablecer
              </ActionButton>
              <ActionButton
                className="flex-1"
                onPress={() => setSheetOpen(false)}
              >
                Listo
              </ActionButton>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </Screen>
  );
}
