/**
 * Datos mock fieles a los manifests reales (~../library-novels/.manifest.json),
 * congelados el 2026-11-01: 6 novelas, 66 EPUBs (34 originales + 32 ES), 1 PDF / 5 web.
 *
 * Al conectar la API real (HttpApiClient) este módulo se retira sin tocar pantallas:
 * las covers pasan a URL (`/api/novels/{slug}/cover`) y mockCovers deja de usarse
 * (en fase real, Novel.cover trae la URL directamente).
 */
import type { Novel, EpubVolume } from "../types";

export const mockNovels: Novel[] = [
  {
    slug: "divine-emperor-of-death",
    title: "Divine Emperor of Death",
    author: "Novel Phoenix",
    source_url: "https://novelphoenix.com/novel/divine-emperor-of-death",
    source_pdf: null,
    chapters_total: 200,
    chapters_downloaded: 200,
    chapters_translated: 200,
    chapters_empty: 0,
    chapters_empty_nums: [],
    translated: true,
    translated_language: "es",
    volume_size: 50,
    cover: null,
    epub_original: [
      "Divine Emperor of Death 1-50.epub",
      "Divine Emperor of Death 51-100.epub",
      "Divine Emperor of Death 101-150.epub",
      "Divine Emperor of Death 151-200.epub",
    ],
    epub_translated: [
      "Divine Emperor of Death 1-50 (ES).epub",
      "Divine Emperor of Death 51-100 (ES).epub",
      "Divine Emperor of Death 101-150 (ES).epub",
      "Divine Emperor of Death 151-200 (ES).epub",
    ],
    created_at: "2026-09-11T00:24:16.950178+00:00",
    updated_at: "2026-09-11T01:24:50.858575+00:00",
  },
  {
    slug: "haburare-rune-tsukai-no-isekai-boukentan",
    title: "Haburare Rune Tsukai no Isekai Boukentan",
    author: "Ougon no Kuroyagi",
    source_url: "",
    source_pdf: "source.pdf",
    chapters_total: 7,
    chapters_downloaded: 7,
    chapters_translated: 0,
    chapters_empty: 0,
    chapters_empty_nums: [],
    translated: false,
    translated_language: null,
    volume_size: 50,
    cover: null,
    epub_original: ["Haburare Rune Tsukai no Isekai Boukentan.epub"],
    epub_translated: [],
    created_at: "2026-10-03T04:20:04.632111+00:00",
    updated_at: "2026-10-03T04:20:04.633623+00:00",
  },
  {
    slug: "inner-voice-all-heroines-hear-my-inner-voice",
    title: "Inner Voice: All Heroines Hear My Inner Voice",
    author: "Novel Fire",
    source_url:
      "https://novelfire.net/book/inner-voice-all-heroines-hear-my-inner-voice",
    source_pdf: null,
    chapters_total: 1100,
    chapters_downloaded: 1100,
    chapters_translated: 1100,
    chapters_empty: 0,
    chapters_empty_nums: [],
    translated: true,
    translated_language: "es",
    volume_size: 100,
    cover: null,
    epub_original: [
      "Inner Voice All Heroines Hear My Inner Voice 1-100.epub",
      "Inner Voice All Heroines Hear My Inner Voice 101-200.epub",
      "Inner Voice All Heroines Hear My Inner Voice 201-300.epub",
      "Inner Voice All Heroines Hear My Inner Voice 301-400.epub",
      "Inner Voice All Heroines Hear My Inner Voice 401-500.epub",
      "Inner Voice All Heroines Hear My Inner Voice 501-600.epub",
      "Inner Voice All Heroines Hear My Inner Voice 601-700.epub",
      "Inner Voice All Heroines Hear My Inner Voice 701-800.epub",
      "Inner Voice All Heroines Hear My Inner Voice 801-900.epub",
      "Inner Voice All Heroines Hear My Inner Voice 901-1000.epub",
      "Inner Voice All Heroines Hear My Inner Voice 1001-1100.epub",
    ],
    epub_translated: [
      "Inner Voice All Heroines Hear My Inner Voice 1-100 (ES).epub",
      "Inner Voice All Heroines Hear My Inner Voice 101-200 (ES).epub",
      "Inner Voice All Heroines Hear My Inner Voice 201-300 (ES).epub",
      "Inner Voice All Heroines Hear My Inner Voice 301-400 (ES).epub",
      "Inner Voice All Heroines Hear My Inner Voice 401-500 (ES).epub",
      "Inner Voice All Heroines Hear My Inner Voice 501-600 (ES).epub",
      "Inner Voice All Heroines Hear My Inner Voice 601-700 (ES).epub",
      "Inner Voice All Heroines Hear My Inner Voice 701-800 (ES).epub",
      "Inner Voice All Heroines Hear My Inner Voice 801-900 (ES).epub",
      "Inner Voice All Heroines Hear My Inner Voice 901-1000 (ES).epub",
      "Inner Voice All Heroines Hear My Inner Voice 1001-1100 (ES).epub",
    ],
    created_at: "2026-09-01T20:13:43.353116+00:00",
    updated_at: "2026-10-16T23:19:12.844392+00:00",
  },
  {
    slug: "lustful-demon-king-summoned-by-the-demon-goddesses",
    title: "Lustful Demon King: Summoned by the Demon Goddesses!",
    author: "Novel Fire",
    source_url:
      "https://novelfire.net/book/lustful-demon-king-summoned-by-the-demon-goddesses",
    source_pdf: null,
    chapters_total: 332,
    chapters_downloaded: 332,
    chapters_translated: 332,
    chapters_empty: 0,
    chapters_empty_nums: [],
    translated: true,
    translated_language: "es",
    volume_size: 100,
    cover: null,
    epub_original: [
      "Lustful Demon King Summoned by the Demon Goddesses! 1-100.epub",
      "Lustful Demon King Summoned by the Demon Goddesses! 101-200.epub",
      "Lustful Demon King Summoned by the Demon Goddesses! 201-300.epub",
      "Lustful Demon King Summoned by the Demon Goddesses! 301-332.epub",
    ],
    epub_translated: [
      "Lustful Demon King Summoned by the Demon Goddesses! 1-100 (ES).epub",
      "Lustful Demon King Summoned by the Demon Goddesses! 101-200 (ES).epub",
      "Lustful Demon King Summoned by the Demon Goddesses! 201-300 (ES).epub",
      "Lustful Demon King Summoned by the Demon Goddesses! 301-332 (ES).epub",
    ],
    created_at: "2026-09-01T19:21:00.258273+00:00",
    updated_at: "2026-09-10T23:27:47.848468+00:00",
  },
  {
    slug: "my-step-daughters-are-the-villainesses",
    title: "My Step-Daughters Are The Villainesses",
    author: "Novel Phoenix",
    source_url:
      "https://novelphoenix.com/novel/my-step-daughters-are-the-villainesses",
    source_pdf: null,
    chapters_total: 257,
    chapters_downloaded: 257,
    chapters_translated: 257,
    chapters_empty: 0,
    chapters_empty_nums: [],
    translated: true,
    translated_language: "es",
    volume_size: 100,
    cover: null,
    epub_original: [
      "My Step-Daughters Are The Villainesses 1-100.epub",
      "My Step-Daughters Are The Villainesses 101-200.epub",
      "My Step-Daughters Are The Villainesses 201-257.epub",
    ],
    epub_translated: [
      "My Step-Daughters Are The Villainesses 1-100 (ES).epub",
      "My Step-Daughters Are The Villainesses 101-200 (ES).epub",
      "My Step-Daughters Are The Villainesses 201-257 (ES).epub",
    ],
    created_at: "2026-08-23T16:48:14.105850+00:00",
    updated_at: "2026-10-16T23:12:46.492782+00:00",
  },
  {
    slug: "the-witch-hunter-system",
    title: "The Witch Hunter System",
    author: "Novel Phoenix",
    source_url: "https://novelphoenix.com/novel/the-witch-hunter-system",
    source_pdf: null,
    chapters_total: 1100,
    chapters_downloaded: 1100,
    chapters_translated: 1000,
    chapters_empty: 0,
    chapters_empty_nums: [],
    translated: true,
    translated_language: "es",
    volume_size: 100,
    cover: null,
    epub_original: [
      "The Witch Hunter System 1-100.epub",
      "The Witch Hunter System 101-200.epub",
      "The Witch Hunter System 201-300.epub",
      "The Witch Hunter System 301-400.epub",
      "The Witch Hunter System 401-500.epub",
      "The Witch Hunter System 501-600.epub",
      "The Witch Hunter System 601-700.epub",
      "The Witch Hunter System 701-800.epub",
      "The Witch Hunter System 801-900.epub",
      "The Witch Hunter System 901-1000.epub",
      "The Witch Hunter System 1001-1100.epub",
    ],
    epub_translated: [
      "The Witch Hunter System 1-100 (ES).epub",
      "The Witch Hunter System 101-200 (ES).epub",
      "The Witch Hunter System 201-300 (ES).epub",
      "The Witch Hunter System 301-400 (ES).epub",
      "The Witch Hunter System 401-500 (ES).epub",
      "The Witch Hunter System 501-600 (ES).epub",
      "The Witch Hunter System 601-700 (ES).epub",
      "The Witch Hunter System 701-800 (ES).epub",
      "The Witch Hunter System 801-900 (ES).epub",
      "The Witch Hunter System 901-1000 (ES).epub",
    ],
    created_at: "2026-09-07T00:16:20.348819+00:00",
    updated_at: "2026-10-16T23:20:58.471387+00:00",
  },
];

/** Covers reales (copia única en assets/mock/covers) resueltas por slug. */
export const mockCovers: Record<string, number> = {
  "divine-emperor-of-death": require("../../../assets/mock/covers/divine-emperor-of-death.jpg"),
  "haburare-rune-tsukai-no-isekai-boukentan": require(
    "../../../assets/mock/covers/haburare-rune-tsukai-no-isekai-boukentan.jpg",
  ),
  "inner-voice-all-heroines-hear-my-inner-voice": require(
    "../../../assets/mock/covers/inner-voice-all-heroines-hear-my-inner-voice.jpg",
  ),
  "lustful-demon-king-summoned-by-the-demon-goddesses": require(
    "../../../assets/mock/covers/lustful-demon-king-summoned-by-the-demon-goddesses.jpg",
  ),
  "my-step-daughters-are-the-villainesses": require(
    "../../../assets/mock/covers/my-step-daughters-are-the-villainesses.jpg",
  ),
  "the-witch-hunter-system": require("../../../assets/mock/covers/the-witch-hunter-system.jpg"),
};

/** Cover de una novela para el mock (fase real: Image URI desde Novel.cover). */
export function coverSource(slug: string): number | null {
  return mockCovers[slug] ?? null;
}

/** Estadísticas derivadas de los datos mock (spec 0.1.0-04; lógica en `stats.ts`). */
export { libraryStats as mockLibraryStats } from "../stats";

/** Lista plana de tomos de una novela (para el detalle, spec 03). */
export function novelEpubs(novel: Novel): EpubVolume[] {
  return [
    ...novel.epub_original.map((filename) => ({ filename, translated: false })),
    ...novel.epub_translated.map((filename) => ({ filename, translated: true })),
  ];
}
