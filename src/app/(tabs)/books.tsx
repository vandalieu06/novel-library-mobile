import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  FlatList,
  RefreshControl,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet } from "heroui-native/bottom-sheet";
import { Button } from "heroui-native/button";
import { SearchField } from "heroui-native/search-field";
import { Separator } from "heroui-native/separator";
import { Skeleton } from "heroui-native/skeleton";
import { Switch } from "heroui-native/switch";
import { Tabs } from "heroui-native/tabs";
import { ApiError } from "@/lib/api";
import { useApi } from "@/lib/api-provider";
import { resolveGridColumns } from "@/lib/grid";
import type { GridDensitySetting } from "@/lib/settings";
import { loadSettings, onSettingsChange } from "@/lib/settings";
import type { Novel } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { NovelCard } from "@/components/novel-card";

type FilterKey = "all" | "translated" | "pdf";
type SortKey = "recent" | "title";

export default function BooksScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { api } = useApi();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; status: number } | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
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

  const load = useCallback(async (asRefresh = false) => {
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
  }, [api]);

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
  const activeFilters =
    (filter !== "all" ? 1 : 0) + (sort === "title" ? 1 : 0);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="gap-3 px-4 pb-3 pt-3">
        <View className="gap-0.5">
          <Text className="text-2xl font-bold text-foreground">Biblioteca</Text>
          <Text className="text-sm text-muted">Tus novelas descargadas.</Text>
        </View>

        {/* Fila única: búsqueda compacta + botón de filtros (drawer) */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <SearchField value={search} onChange={setSearch}>
              <SearchField.Group className="h-9">
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
              <Button variant="secondary" size="sm" className="h-9 gap-1.5 px-3">
                <Ionicons name="funnel-outline" size={16} color="#71717a" />
                <Button.Label>Filtros</Button.Label>
                {activeFilters > 0 && (
                  <Text className="text-xs font-semibold text-accent">
                    {activeFilters}
                  </Text>
                )}
              </Button>
            </BottomSheet.Trigger>
            <BottomSheet.Portal>
              <BottomSheet.Overlay />
              <BottomSheet.Content contentContainerClassName="gap-5 px-5 pb-10 pt-5">
                <View className="gap-1">
                  <BottomSheet.Title className="text-lg font-semibold text-foreground">
                    Filtros
                  </BottomSheet.Title>
                  <Text className="text-xs text-muted">
                    Se aplican al instante sobre la biblioteca.
                  </Text>
                </View>

                <View className="gap-4">
                  <View className="flex-row items-center justify-between gap-4">
                    <View className="flex-1 gap-0.5">
                      <Text className="text-sm text-foreground">Solo traducidas</Text>
                      <Text className="text-xs text-muted">
                        Novelas con versión traducida
                      </Text>
                    </View>
                    <Switch
                      isSelected={filter === "translated"}
                      onSelectedChange={(value) =>
                        setFilter(value ? "translated" : "all")
                      }
                    />
                  </View>
                  <View className="flex-row items-center justify-between gap-4">
                    <View className="flex-1 gap-0.5">
                      <Text className="text-sm text-foreground">
                        Solo con origen PDF
                      </Text>
                      <Text className="text-xs text-muted">
                        Importadas desde un archivo
                      </Text>
                    </View>
                    <Switch
                      isSelected={filter === "pdf"}
                      onSelectedChange={(value) => setFilter(value ? "pdf" : "all")}
                    />
                  </View>
                </View>

                <Separator />

                <View className="gap-2">
                  <Text className="text-xs text-muted">Orden</Text>
                  <Tabs
                    value={sort}
                    onValueChange={(value) => {
                      if (value === "recent" || value === "title") setSort(value);
                    }}
                  >
                    <Tabs.List>
                      <Tabs.Trigger value="recent">
                        <Tabs.Label>Recientes</Tabs.Label>
                      </Tabs.Trigger>
                      <Tabs.Trigger value="title">
                        <Tabs.Label>Título</Tabs.Label>
                      </Tabs.Trigger>
                    </Tabs.List>
                  </Tabs>
                </View>
              </BottomSheet.Content>
            </BottomSheet.Portal>
          </BottomSheet>
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
      ) : error !== null ? (
        <EmptyState
          icon={error.status === 401 ? "key-outline" : "cloud-offline-outline"}
          title={
            error.status === 401
              ? "Token inválido"
              : "No se pudo cargar la biblioteca"
          }
          description={
            error.status === 401
              ? "Revisa el token en Ajustes."
              : error.message
          }
          action={
            <View className="flex-row gap-2">
              <Button
                size="sm"
                variant="secondary"
                onPress={() => {
                  setIsLoading(true);
                  void load();
                }}
              >
                <Button.Label>Reintentar</Button.Label>
              </Button>
              {error.status === 401 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => router.push("/(tabs)/settings")}
                >
                  <Button.Label>Ir a Ajustes</Button.Label>
                </Button>
              )}
            </View>
          }
        />
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
