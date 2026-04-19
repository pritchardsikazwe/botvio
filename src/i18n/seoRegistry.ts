/**
 * SEO translation registry.
 * - `en.json` is the source-of-truth (always complete).
 * - Other locales contain only translated keys; missing keys fall back to English.
 * - Used by `useSeo()` and `<SEOHead seoKey="...">`.
 */
import en from "./seo/en.json";
import fr from "./seo/fr.json";
import pt from "./seo/pt.json";
import es from "./seo/es.json";
import ar from "./seo/ar.json";
import sw from "./seo/sw.json";
import hi from "./seo/hi.json";
import ms from "./seo/ms.json";
import zh from "./seo/zh.json";
import ru from "./seo/ru.json";
import ja from "./seo/ja.json";
import de from "./seo/de.json";
import it from "./seo/it.json";
import tr from "./seo/tr.json";
import id from "./seo/id.json";
import vi from "./seo/vi.json";
import th from "./seo/th.json";
import ko from "./seo/ko.json";
import tl from "./seo/tl.json";
import bn from "./seo/bn.json";
import ur from "./seo/ur.json";

import type { LanguageCode } from "./index";

export interface SeoEntry {
  title: string;
  description: string;
  keywords?: string;
}

type SeoMap = Record<string, Partial<SeoEntry>>;

const seoByLang: Record<LanguageCode, SeoMap> = {
  en: en as SeoMap,
  fr: fr as SeoMap,
  pt: pt as SeoMap,
  es: es as SeoMap,
  ar: ar as SeoMap,
  sw: sw as SeoMap,
  hi: hi as SeoMap,
  ms: ms as SeoMap,
  zh: zh as SeoMap,
  ru: ru as SeoMap,
  ja: ja as SeoMap,
  de: de as SeoMap,
  it: it as SeoMap,
  tr: tr as SeoMap,
  id: id as SeoMap,
  vi: vi as SeoMap,
  th: th as SeoMap,
  ko: ko as SeoMap,
  tl: tl as SeoMap,
  bn: bn as SeoMap,
  ur: ur as SeoMap,
};

/**
 * Returns the translated SEO entry for the given key + language.
 * Falls back per-field to English when a translation is missing.
 */
export function getSeoEntry(
  key: string,
  lang: LanguageCode
): SeoEntry | null {
  const enEntry = (seoByLang.en[key] ?? null) as SeoEntry | null;
  if (!enEntry) return null;

  const localized = seoByLang[lang]?.[key] ?? {};
  return {
    title: localized.title ?? enEntry.title,
    description: localized.description ?? enEntry.description,
    keywords: localized.keywords ?? enEntry.keywords,
  };
}

export const SEO_KEYS = Object.keys(seoByLang.en);
