import { Text, View } from "react-native";

/** Stub de la spec 02; el grid 2/4/8 con búsqueda y filtros es la spec 03. */
export default function BooksScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-xl font-semibold text-foreground">Books</Text>
      <Text className="mt-2 text-center text-sm text-muted">
        Biblioteca en grid 2/4/8 — spec 03
      </Text>
    </View>
  );
}
