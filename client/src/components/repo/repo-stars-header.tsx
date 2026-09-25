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
import { useBackupStatus, useRunBackup } from "#/hooks/useBackup";
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
  const { data: backup } = useBackupStatus(owner, reponame);
  const runBackup = useRunBackup(owner, reponame);
  const backupEnabled = backup?.enabled ?? false;

  const handleBackupRun = async () => {
    if (!backupEnabled || runBackup.isPending) return;

    try {
      await runBackup.mutateAsync();
    } catch {
      // Silently fail — button returns to normal state
    }
  };

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

      <div className="flex items-center gap-2">
        <ButtonGroup>
          <Button variant="outline" className="gap-2" >
            <div className={`h-2 w-2 rounded-full ${!backupEnabled ? "bg-muted-foreground" : backup?.isLatest ? "bg-green-500" : "bg-amber-500"}`} />
            <span>{!backupEnabled ? "Backup off" : backup?.isLatest ? "Latest" : "Outdated"}</span>
          </Button>

          <Button variant="outline" size="icon" disabled={!backupEnabled || runBackup.isPending} onClick={handleBackupRun} title={backupEnabled ? "Create backup" : "Backups are disabled"}>
            {runBackup.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
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
