import type { Href } from 'expo-router';

/** Typed-route safe hrefs (regenerate via `npx expo start` when routes change). */

export function variantHistoryHref(variantId: string): Href {
  return `/variant/${variantId}/history` as Href;
}

export function setDetailHref(setId: string): Href {
  return `/set/${setId}` as Href;
}

export function setCompareHref(setId: string): Href {
  return `/set/${setId}/compare` as Href;
}
