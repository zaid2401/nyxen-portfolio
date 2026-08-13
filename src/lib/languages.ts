/**
 * Language dot colours, matching GitHub's own palette for the languages that
 * actually show up here. Anything unmapped falls back to a neutral tone rather
 * than being assigned a random colour — an unfamiliar language should look
 * unfamiliar, not miscategorised.
 */
const LANGUAGE_COLORS: Record<string, string> = {
  Python: "#3572A5",
  Java: "#B07219",
  Kotlin: "#A97BFF",
  TypeScript: "#3178C6",
  JavaScript: "#F1E05A",
  HTML: "#E34C26",
  CSS: "#663399",
  Shell: "#89E051",
  "Jupyter Notebook": "#DA5B0B",
  C: "#555555",
  "C++": "#F34B7D",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Dart: "#00B4AB",
  R: "#198CE7",
  Vue: "#41B883",
  Svelte: "#FF3E00",
  Dockerfile: "#384D54",
  PowerShell: "#012456",
  SQL: "#E38C00",
  PLpgSQL: "#336790",
  TSQL: "#E38C00",
};

const FALLBACK = "#6E7681";

export function languageColor(language: string | null): string {
  if (!language) return FALLBACK;
  return LANGUAGE_COLORS[language] ?? FALLBACK;
}
