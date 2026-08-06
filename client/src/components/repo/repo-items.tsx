import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Scale,
  ShieldCheck,
  FileText,
  Package,
  Tag,
} from "lucide-react";

export interface RepoItem {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
}

// `id` is the stable key used for persistence — keep it constant even if
// `name` or `href` change later, or saved preferences will silently reset.
export const repoItems: RepoItem[] = [
  { id: "readme", name: "Readme", href: "/readme", icon: BookOpen },
  { id: "license", name: "License", href: "/license", icon: Scale },
  {
    id: "codeOfConduct",
    name: "Code of Conduct",
    href: "/code-of-conduct",
    icon: ShieldCheck,
  },
  {
    id: "contributing",
    name: "Contributing",
    href: "/contributing",
    icon: FileText,
  },
  { id: "security", name: "Security", href: "/security", icon: ShieldCheck },
  { id: "releases", name: "Releases", href: "/releases", icon: Tag },
  { id: "size", name: "Size", href: "#", icon: Package },
];

export const REPO_ITEMS_STORAGE_KEY = "repo-panel:visible-items";

export function getDefaultVisibility(): Record<string, boolean> {
  return Object.fromEntries(repoItems.map((item) => [item.id, true]));
}