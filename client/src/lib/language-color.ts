import * as linguistLanguages from "linguist-languages";

// Shared language color lookup, extracted from the duplicated local copies
// in components/home/repos.tsx and components/repo/right-panel.tsx.
function fallbackColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

// Stable color for languages that don't have one defined by Linguist.
export function getLanguageColor(name: string): string {
  const entry = (linguistLanguages as Record<string, { color?: string }>)[
    name
  ];
  return entry?.color ?? fallbackColor(name);
}
