import { Image as ExpoImage } from "expo-image";
import { View } from "react-native";
import { withUniwind } from "uniwind";
import type { CoverSource } from "@/lib/covers";

/** `expo-image` con soporte de `className` de Uniwind. */
const Image = withUniwind(ExpoImage);

interface CoverImageProps {
  source: CoverSource;
  className?: string;
  /**
   * Proporción ancho/alto (p. ej. 2/3). Se aplica como style porque la
   * utilidad `aspect-[2/3]` de Uniwind no calcula bien en esta versión.
   */
  aspect?: number;
}

/**
 * Cover con headers opcionales (token) y placeholder cuando la novela no
 * tiene portada. Las medidas/radios llegan por `className` del padre.
 */
export function CoverImage({ source, className, aspect }: CoverImageProps) {
  const aspectStyle = aspect === undefined ? undefined : { aspectRatio: aspect };

  if (source === null) {
    return (
      <View
        style={aspectStyle}
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
      style={aspectStyle}
      className={className}
    />
  );
}
