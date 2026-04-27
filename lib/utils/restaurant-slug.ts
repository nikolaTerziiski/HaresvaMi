const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sht",
  ъ: "a",
  ь: "",
  ю: "yu",
  я: "ya",
};

function transliterateBulgarian(value: string) {
  return Array.from(value)
    .map((character) => CYRILLIC_TO_LATIN[character] ?? character)
    .join("");
}

export function slugifyRestaurantName(name: string) {
  const transliterated = transliterateBulgarian(name.trim().toLowerCase());
  const slug = transliterated
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "restaurant";
}

function createSlugCandidate(baseSlug: string, collisionIndex: number) {
  if (collisionIndex === 0) {
    return baseSlug;
  }

  return `${baseSlug}-${collisionIndex + 1}`;
}

export async function reserveUniqueRestaurantSlug(
  restaurantName: string,
  reserveSlug: (slug: string) => Promise<boolean>,
  maxAttempts = 20,
) {
  const baseSlug = slugifyRestaurantName(restaurantName);

  for (
    let collisionIndex = 0;
    collisionIndex < maxAttempts;
    collisionIndex += 1
  ) {
    const candidate = createSlugCandidate(baseSlug, collisionIndex);
    const reserved = await reserveSlug(candidate);

    if (reserved) {
      return candidate;
    }
  }

  throw new Error("Unable to reserve a unique restaurant slug.");
}
