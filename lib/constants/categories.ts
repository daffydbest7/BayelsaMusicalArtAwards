export const CATEGORIES = [
  "Artist of the Year",
  "Song of the Year",
  "Album of the Year",
  "Best New Act",
  "Best Male Artist",
  "Best Female Artist",
  "Best Collaboration",
  "Music Video of the Year",
  "Best Video Director",
  "Music Producer of the Year",
  "Sound Engineer of the Year",
  "Best DJ",
  "Afrobeats Song of the Year",
  "Best Rap Artist",
  "Best Rap Album",
  "Best Gospel Act",
  "Best Gospel Song",
  "Best Gospel Album",
  "Best Gospel Video",
  "Best Gospel Choir",
  "Best Owigiri Artist",
  "Best Owigiri Song",
  "Best Owigiri Pop Artist",
  "Best Campus Act",
  "Hypeman of the Year",
  "Best Bayelsa Artist in the Diaspora",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Helper to convert category name to slug: "Artist of the Year" -> "artist-of-the-year"
export function getCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\-]/g, "") // remove non-alphanumeric/spaces/hyphens
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-"); // merge multiple hyphens
}

// Map slugs to category names
export const CATEGORY_MAP = CATEGORIES.reduce((acc, cat) => {
  acc[getCategorySlug(cat)] = cat;
  return acc;
}, {} as Record<string, Category>);

export function getCategoryNameFromSlug(slug: string): Category | undefined {
  return CATEGORY_MAP[slug];
}
