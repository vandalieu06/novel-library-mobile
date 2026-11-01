import { Image as ExpoImage } from "expo-image";
import { View } from "react-native";
import { withUniwind } from "uniwind";
import type { CoverSource } from "@/lib/covers";

/** `expo-image` con soporte de `className` de Uniwind. */
const Image = withUniwind(ExpoImage);

interface CoverImageProps {
  source: CoverSource;
  className?: string;
}

/**
 * Cover con headers opcionales (token) y placeholder cuando la novela no
 * tiene portada. Las medidas/radios llegan por `className` del padre.
 */
export function CoverImage({ source, className }: CoverImageProps) {
  if (source === null) {
    return (
      <View
        className={
          className === undefined ? "bg-surface-tertiary" : `bg-surface-tertiary ${className}`
        }
      />
    );
  }
  return (
    <Image
      source={source}
      contentFit="cover"
      transition={150}
      className={className}
    />
  );
}
