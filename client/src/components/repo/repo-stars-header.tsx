import { Link } from "@tanstack/react-router";
import {
  Bot,
  ChevronDown,
  CircleDot,
  CloudBackup,
  Earth,
  ExternalLink,
  GitFork,
  Globe,
  Link2,
  Loader2,
  Lock,
  QrCode,
  RefreshCw,
  Rss,
} from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import { authClient } from "#/lib/auth-client";
import type { Commit, Lang, RepoFile } from "#/types/repo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "../ui/badge";
import { ButtonGroup } from "../ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ForksBtn } from "./forks-btn";

interface RepoStarsheaderProps {
  reponame: string;
  owner: string;
  visibility: boolean;
  link: string;
  website?: string;
  logo?: string;
  commits?: Commit[];
  defaultBranch?: string;
  isLoading?: boolean;
  description?: string;
  files?: RepoFile[];
  langs?: Lang[];
  branch?: string;
  isFork?: boolean;
  forkedFromOwner?: string;
  forkedFromName?: string;
}

function RepoStarsheader({
  reponame,
  owner,
  visibility,
  link,
  website,
  logo,
  commits = [],
  defaultBranch = "main",
  isLoading,
  description = "",
  files = [],
  langs = [],
  branch,
  isFork = false,
  forkedFromOwner = "",
  forkedFromName = "",
}: RepoStarsheaderProps) {
  const { data: session } = authClient.useSession();
  const status = visibility ? "Public" : "Private";
  const [qrOpen, setQrOpen] = useState(false);
  const [rssLoading, setRssLoading] = useState(false);
  const [llmsLoading, setLlmsLoading] = useState(false);
  const isOwner = session?.user.name === owner;

  const handleRssDownload = async () => {
    setRssLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const siteUrl = window.location.origin;
      const repoUrl = `${siteUrl}/${owner}/${reponame}`;
      const selfUrl = `${repoUrl}/branch/${defaultBranch}`;

      const escapeXml = (str: string) =>
        str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");

      const commitItems = commits
        .map((commit) => {
          const pubDate = new Date(commit.date).toUTCString();
          return `    <item>
      <title>${escapeXml(commit.message.split("\n")[0])}</title>
      <link>${repoUrl}/commit/${commit.hash}</link>
      <guid isPermaLink="true">${repoUrl}/commit/${commit.hash}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(commit.author)}</author>
    </item>`;
        })
        .join("\n");

      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(reponame)} - Commits</title>
    <link>${repoUrl}</link>
    <description>Recent commits to ${escapeXml(reponame)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${selfUrl}" rel="self" type="application/rss+xml" />
${commitItems}
  </channel>
</rss>`;

      const blob = new Blob([rss], { type: "application/rss+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reponame}-commits.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail — button returns to normal state
    } finally {
      setRssLoading(false);
    }
  };

  const handleLlmsDownload = async () => {
    setLlmsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const siteUrl = window.location.origin;
      const activeBranch = branch || defaultBranch;
      const repoUrl = `${siteUrl}/${owner}/${reponame}`;
      const fileUrl = (path: string) =>
        `${repoUrl}/blob/${activeBranch}/${path}`;
      const folderUrl = (path: string) =>
        `${repoUrl}/tree/${activeBranch}/${path}`;

      const docFilenames = [
        "readme",
        "readme.md",
        "license",
        "license.md",
        "copying",
        "copying.md",
        "changelog",
        "changelog.md",
        "changes",
        "changes.md",
        "contributing",
        "contributing.md",
        "security",
        "security.md",
        "code_of_conduct.md",
        "code-of-conduct.md",
        "support",
        "support.md",
        "authors",
        "authors.md",
        "contributors",
        "contributors.md",
        "faq",
        "faq.md",
        "roadmap",
        "roadmap.md",
        "install",
        "install.md",
        "development",
        "development.md",
        "developing",
        "developing.md",
        "governance",
        "governance.md",
        "todo",
        "todo.md",
        "notice",
        "notice.md",
      ];

      const isDocFile = (name: string) =>
        docFilenames.includes(name.toLowerCase());

      const isDocsFolder = (name: string) => {
        const lower = name.toLowerCase();
        return (
          lower === "docs" ||
          lower === "documentation" ||
          lower === "guide" ||
          lower === "guides"
        );
      };

      const isConfigFile = (name: string) => {
        const lower = name.toLowerCase();
        return [
          "go.mod",
          "go.sum",
          "package.json",
          "package-lock.json",
          "yarn.lock",
          "bun.lockb",
          "bun.lock",
          "pnpm-lock.yaml",
          "tsconfig.json",
          "tsconfig.app.json",
          "tsconfig.node.json",
          "vite.config.ts",
          "vite.config.js",
          "vite.config.mjs",
          "next.config.js",
          "next.config.mjs",
          "next.config.ts",
          "nuxt.config.ts",
          "nuxt.config.js",
          "astro.config.mjs",
          "svelte.config.js",
          "angular.json",
          "webpack.config.js",
          "webpack.config.ts",
          "rollup.config.js",
          "rollup.config.ts",
          "esbuild.config.js",
          "tailwind.config.ts",
          "tailwind.config.js",
          "postcss.config.js",
          "postcss.config.mjs",
          "biome.json",
          "biome.jsonc",
          ".eslintrc.js",
          ".eslintrc.json",
          "eslint.config.js",
          "eslint.config.mjs",
          ".prettierrc",
          ".prettierrc.json",
          ".prettierrc.js",
          "prettier.config.js",
          "Cargo.toml",
          "Cargo.lock",
          "pyproject.toml",
          "setup.py",
          "setup.cfg",
          "requirements.txt",
          "requirements-dev.txt",
          "Pipfile",
          "pom.xml",
          "build.gradle",
          "build.gradle.kts",
          "composer.json",
          "composer.lock",
          "Gemfile",
          "Gemfile.lock",
          "mix.exs",
          "mix.lock",
          "Dockerfile",
          "Dockerfile.dev",
          "Dockerfile.prod",
          "docker-compose.yml",
          "docker-compose.yaml",
          "docker-compose.dev.yml",
          "docker-compose.prod.yml",
          ".dockerignore",
          ".gitignore",
          ".gitattributes",
          "Makefile",
          "CMakeLists.txt",
          "justfile",
          "Taskfile.yml",
          "Procfile",
          "vercel.json",
          "netlify.toml",
          "fly.toml",
          "render.yaml",
          "railway.json",
          ".env",
          ".env.example",
          ".env.sample",
          ".env.local",
          ".env.development",
          ".env.production",
        ].includes(lower);
      };

      const isEntryFile = (name: string) => {
        const lower = name.toLowerCase();
        return [
          "main.go",
          "main.ts",
          "main.tsx",
          "main.js",
          "main.jsx",
          "index.ts",
          "index.tsx",
          "index.js",
          "index.jsx",
          "app.ts",
          "app.tsx",
          "app.js",
          "app.jsx",
          "server.ts",
          "server.js",
          "index.html",
        ].includes(lower);
      };

      const docFiles = files.filter(
        (f) => f.type && isDocFile(f.name) && !f.isNested,
      );
      const configFiles = files.filter(
        (f) => f.type && isConfigFile(f.name) && !f.isNested,
      );
      const entryFiles = files.filter(
        (f) => f.type && isEntryFile(f.name) && !f.isNested,
      );
      const topFolders = files.filter((f) => !f.type && !f.isNested);
      const docsFolders = topFolders.filter((f) => isDocsFolder(f.name));

      const linkLabel = (name: string) => {
        const base = name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
        return base.charAt(0).toUpperCase() + base.slice(1);
      };

      const sections: string[] = [];

      sections.push(`# ${reponame}`);
      sections.push("");

      if (description) {
        sections.push(`> ${description}`);
        sections.push("");
      }

      sections.push(
        `This repository is hosted on Drei, a self-hosted Git platform. Below you will find key resources for understanding and working with this project.`,
      );
      sections.push("");

      sections.push("## Repository");
      sections.push("");
      sections.push(
        `- [Repository](${repoUrl}): Main repository page and project overview.`,
      );
      sections.push(
        `- [File Browser](${repoUrl}/tree/${activeBranch}): Browse the repository files on the \`${activeBranch}\` branch.`,
      );
      if (commits.length > 0) {
        sections.push(
          `- [Commits](${repoUrl}): Repository commit history and activity.`,
        );
      }
      sections.push(
        `- [Issues](${repoUrl}/issues): Issues and project discussions.`,
      );
      sections.push("");

      if (docFiles.length > 0) {
        sections.push("## Documentation");
        sections.push("");
        for (const file of docFiles) {
          const label = linkLabel(file.name);
          sections.push(
            `- [${label}](${fileUrl(file.path)}): ${label} for this repository.`,
          );
        }
        sections.push("");
      }

      if (docsFolders.length > 0) {
        sections.push("## Guides & Documentation");
        sections.push("");
        for (const folder of docsFolders) {
          const label = linkLabel(folder.name);
          sections.push(
            `- [${label}](${folderUrl(folder.path)}): Project documentation directory.`,
          );
        }
        sections.push("");
      }

      const stdlibFolders = [
        "src",
        "lib",
        "pkg",
        "internal",
        "cmd",
        "app",
        "apps",
        "packages",
        "modules",
        "core",
        "utils",
        "helpers",
        "common",
        "shared",
        "components",
        "pages",
        "routes",
        "layouts",
        "views",
        "templates",
        "static",
        "public",
        "assets",
        "images",
        "img",
        "icons",
        "fonts",
        "styles",
        "css",
        "scss",
        "test",
        "tests",
        "testing",
        "__tests__",
        "spec",
        "specs",
        "e2e",
        "examples",
        "example",
        "demos",
        "demo",
        "benchmarks",
        "benchmark",
        "tools",
        "scripts",
        "bin",
        "build",
        "dist",
        "out",
        "output",
        "vendor",
        "node_modules",
        ".git",
        ".github",
        ".vscode",
        ".idea",
        ".vscode",
        "__pycache__",
        ".next",
        ".nuxt",
        ".output",
      ];

      const projectFolders = topFolders.filter((f) => {
        if (isDocsFolder(f.name)) return false;
        return !stdlibFolders.includes(f.name.toLowerCase());
      });

      const importantFiles = [
        ...entryFiles,
        ...configFiles.filter((f) => {
          const important = [
            "go.mod",
            "package.json",
            "Cargo.toml",
            "pyproject.toml",
            "pom.xml",
            "build.gradle",
            "composer.json",
            "Gemfile",
            "mix.exs",
            "Dockerfile",
            "docker-compose.yml",
            "docker-compose.yaml",
            "Makefile",
            "justfile",
            "Taskfile.yml",
            "vite.config.ts",
            "vite.config.js",
            "vite.config.mjs",
            "next.config.js",
            "next.config.mjs",
            "next.config.ts",
            "tsconfig.json",
            "biome.json",
            "biome.jsonc",
            "tailwind.config.ts",
            "tailwind.config.js",
            "vercel.json",
            "netlify.toml",
            "fly.toml",
            ".env.example",
            ".env.sample",
          ];
          return important.includes(f.name.toLowerCase());
        }),
      ];

      const seenImportant = new Set<string>();
      const uniqueImportant = importantFiles.filter((f) => {
        if (seenImportant.has(f.path)) return false;
        seenImportant.add(f.path);
        return true;
      });

      if (projectFolders.length > 0 || uniqueImportant.length > 0) {
        sections.push("## Project Structure");
        sections.push("");

        const treeLines: string[] = [];

        for (const folder of projectFolders) {
          const childCount = files.filter(
            (f) =>
              f.isNested &&
              f.path.startsWith(folder.path + "/") &&
              f.path !== folder.path,
          ).length;
          const label = linkLabel(folder.name);
          if (childCount > 0) {
            treeLines.push(
              `- [${folder.name}/](${folderUrl(folder.path)}): ${label} directory (${childCount} items).`,
            );
          } else {
            treeLines.push(
              `- [${folder.name}/](${folderUrl(folder.path)}): ${label} directory.`,
            );
          }
        }

        for (const file of uniqueImportant) {
          const label = linkLabel(file.name);
          treeLines.push(`- [${file.name}](${fileUrl(file.path)}): ${label}.`);
        }

        sections.push("```");
        sections.push(treeLines.join("\n"));
        sections.push("```");
        sections.push("");
      }

      if (langs.length > 0) {
        sections.push("## Technologies");
        sections.push("");

        const langList = langs
          .slice(0, 8)
          .map((l) => `${l.name} (${l.percent.toFixed(1)}%)`)
          .join(", ");
        sections.push(`Primary languages: ${langList}.`);
        sections.push("");

        const detectedFrameworks: string[] = [];

        const fileNames = new Set(files.map((f) => f.name.toLowerCase()));

        if (fileNames.has("go.mod")) {
          detectedFrameworks.push("Go");
        }
        if (
          fileNames.has("package.json") ||
          fileNames.has("bun.lockb") ||
          fileNames.has("bun.lock") ||
          fileNames.has("yarn.lock") ||
          fileNames.has("pnpm-lock.yaml")
        ) {
          detectedFrameworks.push("Node.js / JavaScript / TypeScript");
        }
        if (
          fileNames.has("vite.config.ts") ||
          fileNames.has("vite.config.js") ||
          fileNames.has("vite.config.mjs")
        ) {
          detectedFrameworks.push("Vite");
        }
        if (
          fileNames.has("next.config.js") ||
          fileNames.has("next.config.mjs") ||
          fileNames.has("next.config.ts")
        ) {
          detectedFrameworks.push("Next.js");
        }
        if (
          fileNames.has("nuxt.config.ts") ||
          fileNames.has("nuxt.config.js")
        ) {
          detectedFrameworks.push("Nuxt");
        }
        if (
          fileNames.has("astro.config.mjs") ||
          fileNames.has("astro.config.ts")
        ) {
          detectedFrameworks.push("Astro");
        }
        if (fileNames.has("svelte.config.js")) {
          detectedFrameworks.push("Svelte");
        }
        if (fileNames.has("angular.json") || fileNames.has("nx.json")) {
          detectedFrameworks.push("Angular / Nx");
        }
        if (fileNames.has("cargo.toml")) {
          detectedFrameworks.push("Rust");
        }
        if (
          fileNames.has("pyproject.toml") ||
          fileNames.has("setup.py") ||
          fileNames.has("requirements.txt")
        ) {
          detectedFrameworks.push("Python");
        }
        if (
          fileNames.has("pom.xml") ||
          fileNames.has("build.gradle") ||
          fileNames.has("build.gradle.kts")
        ) {
          detectedFrameworks.push("Java");
        }
        if (fileNames.has("composer.json")) {
          detectedFrameworks.push("PHP");
        }
        if (fileNames.has("gemfile")) {
          detectedFrameworks.push("Ruby");
        }
        if (fileNames.has("mix.exs")) {
          detectedFrameworks.push("Elixir");
        }
        if (
          fileNames.has("dockerfile") ||
          fileNames.has("docker-compose.yml") ||
          fileNames.has("docker-compose.yaml")
        ) {
          detectedFrameworks.push("Docker");
        }
        if (fileNames.has("biome.json") || fileNames.has("biome.jsonc")) {
          detectedFrameworks.push("Biome");
        }
        if (
          fileNames.has("tailwind.config.ts") ||
          fileNames.has("tailwind.config.js")
        ) {
          detectedFrameworks.push("Tailwind CSS");
        }
        if (
          fileNames.has("tsconfig.json") ||
          fileNames.has("tsconfig.app.json")
        ) {
          detectedFrameworks.push("TypeScript");
        }
        if (fileNames.has("vercel.json") || fileNames.has("netlify.toml")) {
          detectedFrameworks.push("Vercel / Netlify");
        }

        if (detectedFrameworks.length > 0) {
          sections.push(
            `Detected frameworks and tools: ${detectedFrameworks.join(", ")}.`,
          );
          sections.push("");
        }
      }

      if (website) {
        sections.push("## External Resources");
        sections.push("");
        sections.push(
          `- [Project Website](${website}): Official website for this project.`,
        );
        sections.push("");
      }

      if (visibility) {
        sections.push("## Access");
        sections.push("");
        sections.push(
          `- This is a **public** repository. All content is openly accessible.`,
        );
        sections.push(`- Clone: \`${repoUrl}.git\``);
        sections.push("");
      }

      const llmsTxt = sections.join("\n");

      const blob = new Blob([llmsTxt], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${owner}-${reponame}-llms.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail — button returns to normal state
    } finally {
      setLlmsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-between bg-muted/10 px-5 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-sm" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>

          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>

          <div className="flex items-center gap-1.5">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-muted/10 px-5 py-2">
      {/* Left */}
      <div className="flex items-center gap-2">
        <Avatar className="rounded-sm after:rounded-[inherit]">
          <AvatarImage src={logo} alt={reponame} className="rounded-sm" />
          <AvatarFallback>{reponame.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <p className="font-semibold text-foreground hover:underline">
          {reponame}
        </p>

        <Badge variant="secondary">
          {visibility ? (
            <Earth className="h-3 w-3" />
          ) : (
            <Lock className="h-3 w-3" />
          )}
          {status}
        </Badge>

        {isFork && forkedFromOwner && forkedFromName && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <GitFork className="h-3 w-3" />
            Forked from{" "}
            <Link
              to="/$username/$repo"
              params={{ username: forkedFromOwner, repo: forkedFromName }}
              className="hover:underline"
            >
              {forkedFromOwner}/{forkedFromName}
            </Link>
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <ButtonGroup>
          {/* Repository Host */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled>
              <Button variant="outline" className="gap-2">
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-3.5 fill-foreground"
                >
                  <title>GitHub</title>
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                <span>GitHub</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Mirror Repository</DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-3.5 fill-foreground"
                  >
                    <title>GitHub</title>
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  <span>GitHub</span>
                  <CircleDot className="ml-auto h-2 w-2 text-muted-foreground" />
                </DropdownMenuItem>

                <DropdownMenuItem disabled>
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-3.5 fill-foreground"
                  >
                    <title>GitLab</title>
                    <path d="m23.6004 9.5927-.0337-.0862L20.3.9814a.851.851 0 0 0-.3362-.405.8748.8748 0 0 0-.9997.0539.8748.8748 0 0 0-.29.4399l-2.2055 6.748H7.5375l-2.2057-6.748a.8573.8573 0 0 0-.29-.4412.8748.8748 0 0 0-.9997-.0537.8585.8585 0 0 0-.3362.4049L.4332 9.5015l-.0325.0862a6.0657 6.0657 0 0 0 2.0119 7.0105l.0113.0087.03.0213 4.976 3.7264 2.462 1.8633 1.4995 1.1321a1.0085 1.0085 0 0 0 1.2197 0l1.4995-1.1321 2.4619-1.8633 5.006-3.7489.0125-.01a6.0682 6.0682 0 0 0 2.0094-7.003z" />
                  </svg>
                  <span>GitLab</span>
                </DropdownMenuItem>

                <DropdownMenuItem disabled>
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-3.5 fill-foreground"
                  >
                    <title>Gitea</title>
                    <path d="M4.209 4.603c-.247 0-.525.02-.84.088-.333.07-1.28.283-2.054 1.027C-.403 7.25.035 9.685.089 10.052c.065.446.263 1.687 1.21 2.768 1.749 2.141 5.513 2.092 5.513 2.092s.462 1.103 1.168 2.119c.955 1.263 1.936 2.248 2.89 2.367 2.406 0 7.212-.004 7.212-.004s.458.004 1.08-.394c.535-.324 1.013-.893 1.013-.893s.492-.527 1.18-1.73c.21-.37.385-.729.538-1.068 0 0 2.107-4.471 2.107-8.823-.042-1.318-.367-1.55-.443-1.627-.156-.156-.366-.153-.366-.153s-4.475.252-6.792.306c-.508.011-1.012.023-1.512.027v4.474l-.634-.301c0-1.39-.004-4.17-.004-4.17-1.107.016-3.405-.084-3.405-.084s-5.399-.27-5.987-.324c-.187-.011-.401-.032-.648-.032zm.354 1.832h.111s.271 2.269.6 3.597C5.549 11.147 6.22 13 6.22 13s-.996-.119-1.641-.348c-.99-.324-1.409-.714-1.409-.714s-.73-.511-1.096-1.52C1.444 8.73 2.021 7.7 2.021 7.7s.32-.859 1.47-1.145c.395-.106.863-.12 1.072-.12zm8.33 2.554c.26.003.509.127.509.127l.868.422-.529 1.075a.686.686 0 0 0-.614.359.685.685 0 0 0 .072.756l-.939 1.924a.69.69 0 0 0-.66.527.687.687 0 0 0 .347.763.686.686 0 0 0 .867-.206.688.688 0 0 0-.069-.882l.916-1.874a.667.667 0 0 0 .237-.02.657.657 0 0 0 .271-.137 8.826 8.826 0 0 1 1.016.512.761.761 0 0 1 .286.282c.073.21-.073.569-.073.569-.087.29-.702 1.55-.702 1.55a.692.692 0 0 0-.676.477.681.681 0 1 0 1.157-.252c.073-.141.141-.282.214-.431.19-.397.515-1.16.515-1.16.035-.066.218-.394.103-.814-.095-.435-.48-.638-.48-.638-.467-.301-1.116-.58-1.116-.58s0-.156-.042-.27a.688.688 0 0 0-.148-.241l.516-1.062 2.89 1.401s.48.218.583.619c.073.282-.019.534-.069.657-.24.587-2.1 4.317-2.1 4.317s-.232.554-.748.588a1.065 1.065 0 0 1-.393-.045l-.202-.08-4.31-2.1s-.417-.218-.49-.596c-.083-.31.104-.691.104-.691l2.073-4.272s.183-.37.466-.497a.855.855 0 0 1 .35-.077z" />
                  </svg>
                  <span>Gitea</span>
                </DropdownMenuItem>

                <DropdownMenuItem disabled>
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-3.5 fill-foreground"
                  >
                    <title>Forgejo</title>
                    <path d="M16.7773 0c1.6018 0 2.9004 1.2986 2.9004 2.9005s-1.2986 2.9004-2.9004 2.9004c-1.0854 0-2.0315-.596-2.5288-1.4787H12.91c-2.3322 0-4.2272 1.8718-4.2649 4.195l-.0007 2.1175a7.0759 7.0759 0 0 1 4.148-1.4205l.1176-.001 1.3385.0002c.4973-.8827 1.4434-1.4788 2.5288-1.4788 1.6018 0 2.9004 1.2986 2.9004 2.9005s-1.2986 2.9004-2.9004 2.9004c-1.0854 0-2.0315-.596-2.5288-1.4787H12.91c-2.3322 0-4.2272 1.8718-4.2649 4.195l-.0007 2.319c.8827.4973 1.4788 1.4434 1.4788 2.5287 0 1.602-1.2986 2.9005-2.9005 2.9005-1.6018 0-2.9004-1.2986-2.9004-2.9005 0-1.0853.596-2.0314 1.4788-2.5287l-.0002-9.9831c0-3.887 3.1195-7.0453 6.9915-7.108l.1176-.001h1.3385C14.7458.5962 15.692 0 16.7773 0ZM7.2227 19.9052c-.6596 0-1.1943.5347-1.1943 1.1943s.5347 1.1943 1.1943 1.1943 1.1944-.5347 1.1944-1.1943-.5348-1.1943-1.1944-1.1943Zm9.5546-10.4644c-.6596 0-1.1944.5347-1.1944 1.1943s.5348 1.1943 1.1944 1.1943c.6596 0 1.1943-.5347 1.1943-1.1943s-.5347-1.1943-1.1943-1.1943Zm0-7.7346c-.6596 0-1.1944.5347-1.1944 1.1943s.5348 1.1943 1.1944 1.1943c.6596 0 1.1943-.5347 1.1943-1.1943s-.5347-1.1943-1.1943-1.1943Z" />
                  </svg>
                  <span>Forgejo</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-3.5 fill-foreground"
                  >
                    <title>Codeberg</title>
                    <path d="M11.999.747A11.974 11.974 0 0 0 0 12.75c0 2.254.635 4.465 1.833 6.376L11.837 6.19c.072-.092.251-.092.323 0l4.178 5.402h-2.992l.065.239h3.113l.882 1.138h-3.674l.103.374h3.86l.777 1.003h-4.358l.135.483h4.593l.695.894h-5.038l.165.589h5.326l.609.785h-5.717l.182.65h6.038l.562.727h-6.397l.183.65h6.717A12.003 12.003 0 0 0 24 12.75 11.977 11.977 0 0 0 11.999.747zm3.654 19.104.182.65h5.326c.173-.204.353-.433.513-.65zm.385 1.377.18.65h3.563c.233-.198.485-.428.712-.65zm.383 1.377.182.648h1.203c.356-.204.685-.412 1.042-.648zz" />
                  </svg>
                  <span>Codeberg</span>
                  <CircleDot className="ml-auto h-2 w-2 text-muted-foreground" />
                </DropdownMenuItem>

                <DropdownMenuItem disabled>
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-3.5 fill-foreground"
                  >
                    <title>Bitbucket</title>
                    <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
                  </svg>
                  <span>Bitbucket</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <span>Add Mirror...</span>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <span>Manage Mirrors...</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Latest */}
          <Button variant="outline" className="gap-2" disabled>
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Latest</span>
          </Button>

          {/* Refresh */}
          <Button variant="outline" size="icon" disabled>
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Open */}
          <Button
            disabled
            variant="outline"
            size="icon"
            onClick={() => window.open(link, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </ButtonGroup>

        <ForksBtn disabled={isOwner} />

        <ButtonGroup>
          <Button
            variant="outline"
            size="icon"
            disabled={rssLoading}
            onClick={handleRssDownload}
          >
            {rssLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rss className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            disabled={llmsLoading}
            onClick={handleLlmsDownload}
          >
            {llmsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Share Repository</DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem disabled>
                  <Link2 className="mr-2 h-4 w-4" />
                  <span>Copy Repository URL</span>
                </DropdownMenuItem>
                {website ? (
                  <a href={website} target="_blank" rel="noopener noreferrer">
                    <DropdownMenuItem className="hover:underline cursor-pointer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      <span>Open in Browser</span>
                    </DropdownMenuItem>
                  </a>
                ) : (
                  <DropdownMenuItem disabled>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    <span>Open in Browser</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  disabled={!website}
                  onClick={() => setQrOpen(true)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  <span>Generate QR Code</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={qrOpen} onOpenChange={setQrOpen}>
            <DialogContent className="sm:max-w-xs">
              <DialogHeader>
                <DialogTitle>Scan me</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-2">
                <QRCode
                  value={website ?? ""}
                  size={180}
                  className="rounded-lg ring-1 ring-foreground/10"
                />
                <p className="max-w-full break-all text-center text-xs text-muted-foreground">
                  {website}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </ButtonGroup>
      </div>
    </div>
  );
}

export default RepoStarsheader;
