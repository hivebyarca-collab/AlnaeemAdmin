// Server-side only module (imported exclusively by route handlers / server actions).

/**
 * Image search provider abstraction (Fetch Best Pic).
 * Primary provider: Serper.dev Images API. Never exposes the API key to the client.
 * When SERPER_API_KEY is missing the caller must render a disconnected state.
 */
export type ImageCandidate = {
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  source?: string;
  domain?: string;
  sourcePage?: string;
};

export function isImageSearchConfigured(): boolean {
  return Boolean(process.env.SERPER_API_KEY);
}

/** Builds a strong query: brand + name + model (strongly prioritized) + category. */
export function buildImageQuery(product: { brand?: string | null; name: string; model?: string | null; category?: string | null }): string {
  const parts = [product.brand?.trim(), product.name?.trim(), product.model?.trim(), product.category?.trim()].filter(Boolean);
  return `${[...new Set(parts)].join(' ')} product`;
}

/* ------------------------------ Scoring logic ------------------------------ */

const MANUFACTURER_DOMAINS = ['asus.com', 'msi.com', 'gigabyte.com', 'sapphiretech.com', 'nvidia.com', 'amd.com', 'intel.com', 'sony.com', 'playstation.com', 'logitech.com', 'hyperx.com', 'razer.com', 'samsung.com', 'corsair.com', 'coolermaster.com', 'kingston.com', 'zotac.com', 'powercolor.com', 'lg.com', 'acer.com', 'viewsonic.com'];
const LOW_QUALITY_DOMAINS = ['pinterest.', 'facebook.', 'instagram.', 'twitter.', 'x.com', 'tiktok.', 'youtube.', 'reddit.', 'aliexpress.', 'wikipedia.', 'fandom.'];
const BAD_TITLE_WORDS = ['wallpaper', 'banner', 'news', 'unboxing', 'benchmark', 'driver', 'download', 'logo'];

type RawSerperImage = { title?: string; imageUrl?: string; thumbnailUrl?: string; width?: number; height?: number; source?: string; link?: string; domain?: string };

function domainOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return undefined; }
}

function scoreCandidate(image: RawSerperImage, query: { brand?: string; model?: string }): number {
  const title = (image.title ?? '').toLowerCase();
  const source = (image.source ?? '').toLowerCase();
  const imageDomain = (domainOf(image.imageUrl) ?? '').toLowerCase();
  const sourceDomain = (domainOf(image.link) ?? '').toLowerCase();
  let score = 0;
  const model = query.model?.toLowerCase();
  if (model) {
    if (title.includes(model) || imageDomain.includes(model) || source.includes(model)) score += 60;
    else if (model.split('-').some((token) => token.length > 3 && (title.includes(token) || imageDomain.includes(token)))) score += 25;
  }
  const brand = query.brand?.toLowerCase();
  if (brand && (title.includes(brand) || imageDomain.includes(brand) || sourceDomain.includes(brand))) score += 20;
  if (MANUFACTURER_DOMAINS.some((manufacturer) => sourceDomain.includes(manufacturer) || imageDomain.includes(manufacturer))) score += 15;
  if (LOW_QUALITY_DOMAINS.some((lowQuality) => sourceDomain.includes(lowQuality) || imageDomain.includes(lowQuality))) score -= 35;
  if (BAD_TITLE_WORDS.some((word) => title.includes(word))) score -= 15;
  const width = image.width ?? 0; const height = image.height ?? 0;
  if (width >= 1200 && height >= 900) score += 20;
  else if (width >= 800 && height >= 600) score += 12;
  else if (width > 0 && (width < 400 || height < 300)) score -= 30;
  const ratio = height > 0 ? width / height : 1;
  if (ratio < 0.5 || ratio > 2.2) score -= 25; // banners / strips / vertical screenshots
  if (source.includes('shop') || source.includes('store') || source.includes('buy')) score += 5; // retailer product photos
  return score;
}


export async function searchProductImages(product: { brand?: string | null; name: string; model?: string | null; category?: string | null }): Promise<ImageCandidate[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error('IMAGE_SEARCH_NOT_CONFIGURED');
  const query = buildImageQuery(product);
  let response: Response;
  try {
    response = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 15 }),
      signal: AbortSignal.timeout(12000),
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') throw new Error('IMAGE_SEARCH_TIMEOUT');
    throw new Error('IMAGE_SEARCH_NETWORK');
  }
  if (response.status === 401 || response.status === 403) throw new Error('IMAGE_SEARCH_UNAUTHORIZED');
  if (response.status === 429) throw new Error('IMAGE_SEARCH_RATE_LIMITED');
  if (!response.ok) throw new Error(`IMAGE_SEARCH_FAILED_${response.status}`);
  let data: { images?: RawSerperImage[] };
  try { data = (await response.json()) as { images?: RawSerperImage[] }; } catch { throw new Error('IMAGE_SEARCH_BAD_RESPONSE'); }
  if ((data.images ?? []).length === 0) throw new Error('IMAGE_SEARCH_NO_RESULTS');

  // Normalize, reject broken entries, deduplicate by image URL.
  const seen = new Set<string>();
  const candidates: ImageCandidate[] = [];
  for (const image of data.images ?? []) {
    if (!image.imageUrl || !/^https:\/\//i.test(image.imageUrl) || seen.has(image.imageUrl)) continue;
    seen.add(image.imageUrl);
    candidates.push({
      title: image.title ?? '', imageUrl: image.imageUrl, thumbnailUrl: image.thumbnailUrl ?? image.imageUrl,
      width: image.width, height: image.height, source: image.source,
      domain: image.domain ?? domainOf(image.link) ?? domainOf(image.imageUrl), sourcePage: image.link,
    });
  }

  const scored = candidates
    .map((candidate) => ({ candidate, score: scoreCandidate(candidate, { brand: product.brand ?? undefined, model: product.model ?? undefined }) }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((entry) => entry.candidate);
}

