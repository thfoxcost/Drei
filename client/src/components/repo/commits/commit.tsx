import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "#/components/reui/badge"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "#/components/ui/avatar"
import {
	Diff,
	Ellipsis,
	FileCode,
	Folder,
	GitBranch,
	PanelLeft,
	Search,
	SquareDot,
	SquareMinus,
	SquarePlus,
} from "lucide-react"
import { useNavigate, useLocation } from "@tanstack/react-router"
import { Separator } from "#/components/ui/separator"
import {
	type TreeDataItem,
	TreeView,
} from "#/components/tree-view"
import CodeCommitBlock from "./code-commit"

type ChangeStatus = "added" | "changed" | "removed"

type CommitFile = {
	path: string
	status: ChangeStatus
}

const extensionToIcon: Record<string, string> = {
	go: "go.svg",
	ts: "typescript.svg",
	tsx: "typescript.svg",
	js: "javascript.svg",
	jsx: "javascript.svg",
	py: "python.svg",
	rs: "rust.svg",
	java: "java.svg",
	rb: "ruby.svg",
	php: "php.svg",
	c: "c.svg",
	h: "c.svg",
	cpp: "cpp.svg",
	hpp: "cpp.svg",
	cs: "csharp.svg",
	swift: "swift.svg",
	kt: "kotlin.svg",
	kts: "kotlin.svg",
	scala: "scala.svg",
	html: "html.svg",
	htm: "html.svg",
	css: "css.svg",
	scss: "sass.svg",
	sass: "sass.svg",
	less: "less.svg",
	json: "json.svg",
	yaml: "yaml.svg",
	yml: "yaml.svg",
	xml: "svg.svg",
	md: "markdown.svg",
	mdx: "mdx.svg",
	sql: "database.svg",
	sh: "console.svg",
	bash: "console.svg",
	zsh: "console.svg",
	ps1: "powershell.svg",
	bat: "console.svg",
	cmd: "console.svg",
	dockerfile: "docker.svg",
	vue: "vue.svg",
	svelte: "svelte.svg",
	astro: "astro.svg",
	toml: "settings.svg",
	ini: "settings.svg",
	env: "settings.svg",
	lua: "lua.svg",
	dart: "dart.svg",
	ex: "elixir.svg",
	exs: "elixir.svg",
	hs: "haskell.svg",
	ml: "ocaml.svg",
	erl: "erlang.svg",
	gradle: "gradle.svg",
	cmake: "cmake.svg",
	nix: "nix.svg",
	zig: "zig.svg",
	nim: "nim.svg",
	ad: "ada.svg",
	cob: "clojure.svg",
	f: "fortran.svg",
	pas: "pascal.svg",
	pl: "perl.svg",
	pm: "perl.svg",
	r: "r.svg",
	tex: "tex.svg",
	latex: "tex.svg",
	diff: "diff.svg",
	log: "changelog.svg",
	lock: "lock.svg",
	pdf: "pdf.svg",
	audio: "audio.svg",
	video: "video.svg",
	image: "image.svg",
	font: "font.svg",
	doc: "document.svg",
	docx: "document.svg",
	xls: "document.svg",
	pptx: "document.svg",
}

const filenameToIcon: Record<string, string> = {
	Makefile: "makefile.svg",
	makefile: "makefile.svg",
	"GNUmakefile": "makefile.svg",
	Dockerfile: "docker.svg",
	".gitignore": "git.svg",
	".gitmodules": "git.svg",
	"go.mod": "go-mod.svg",
	"go.sum": "go-mod.svg",
	"package.json": "npm.svg",
	"package-lock.json": "npm.svg",
	"bun.lockb": "bun.svg",
	"tsconfig.json": "tsconfig.svg",
	".eslintrc": "eslint.svg",
	".eslintrc.js": "eslint.svg",
	".eslintrc.json": "eslint.svg",
	".prettierrc": "prettier.svg",
	".prettierrc.json": "prettier.svg",
	"biome.json": "biome.svg",
	"vite.config.ts": "vite.svg",
	"vite.config.js": "vite.svg",
	"vitest.config.ts": "vitest.svg",
	"tailwind.config.ts": "tailwindcss.svg",
	"tailwind.config.js": "tailwindcss.svg",
	"next.config.js": "next.svg",
	"next.config.mjs": "next.svg",
	"nuxt.config.ts": "nuxt.svg",
	"astro.config.mjs": "astro.svg",
	"svelte.config.js": "svelte.svg",
	"Cargo.toml": "rust.svg",
	"Cargo.lock": "rust.svg",
	"pubspec.yaml": "dart.svg",
	"mix.exs": "elixir.svg",
	"stack.yaml": "haskell.svg",
	"cabal.project": "haskell.svg",
	"Gemfile": "ruby.svg",
	"Rakefile": "ruby.svg",
	"Pipfile": "python.svg",
	"pyproject.toml": "python.svg",
	"setup.py": "python.svg",
	"requirements.txt": "python.svg",
	"composer.json": "php.svg",
	".env": "settings.svg",
	".env.local": "settings.svg",
	".editorconfig": "editorconfig.svg",
	"nginx.conf": "nginx.svg",
	"docker-compose.yml": "docker.svg",
	"docker-compose.yaml": "docker.svg",
	".travis.yml": "travis.svg",
	".github": "github.svg",
	"LICENSE": "key.svg",
	"LICENCE": "key.svg",
	"README.md": "readme.svg",
	"readme.md": "readme.svg",
	"CHANGELOG.md": "changelog.svg",
	"CONTRIBUTING.md": "contributors.svg",
	"AUTHORS": "authors.svg",
	"CODEOWNERS": "codeowners.svg",
}

function getFileIconName(path: string): string {
	const parts = path.split("/")
	const fileName = parts[parts.length - 1]

	if (filenameToIcon[fileName]) {
		return filenameToIcon[fileName]
	}

	const dotIndex = fileName.lastIndexOf(".")
	if (dotIndex === -1) {
		return "file.svg"
	}

	const ext = fileName.slice(dotIndex + 1).toLowerCase()
	return extensionToIcon[ext] ?? "file.svg"
}

function makeFileIconComponent(
	svgName: string,
): React.ComponentType<{ className?: string }> {
	const Component = ({
		className,
	}: {
		className?: string
	}) => (
		<img
			src={`/icons/${svgName}`}
			alt=""
			className={className}
			style={{ filter: "grayscale(1)" }}
		/>
	)
	Component.displayName = `FileIcon(${svgName})`
	return Component
}

function getStatusIcon(status: ChangeStatus) {
	if (status === "added") return SquarePlus
	if (status === "changed") return SquareDot
	return SquareMinus
}

function getStatusColor(status: ChangeStatus) {
	if (status === "added") {
		return "text-green-600 dark:text-green-500"
	}

	if (status === "changed") {
		return "text-orange-500"
	}

	return "text-red-600 dark:text-red-500"
}

function FileRowLabel({
	fileName,
	status,
}: {
	fileName: string
	status: ChangeStatus
}) {
	const StatusIcon = getStatusIcon(status)

	return (
		<div className="flex w-full items-center justify-between gap-2">
			<span className="truncate">{fileName}</span>

			<StatusIcon
				className={`h-4 w-4 shrink-0 ${getStatusColor(status)}`}
			/>
		</div>
	)
}

function buildCommitFileTree(
	files: CommitFile[],
): TreeDataItem[] {
	const root: TreeDataItem[] = []

	const sorted = [...files].sort((a, b) =>
		a.path.localeCompare(b.path),
	)

	for (const file of sorted) {
		const parts = file.path.split("/")
		let current = root

		for (let i = 0; i < parts.length - 1; i++) {
			const dirName = parts[i]

			let existing = current.find(
				(n) => n.name === dirName && !!n.children,
			)

			if (!existing) {
				existing = {
					id: parts.slice(0, i + 1).join("/"),
					name: dirName,
					icon: Folder,
					children: [],
				}

				current.push(existing)
			}

			current = existing.children!
		}

		const fileName = parts[parts.length - 1]

		current.push({
			id: file.path,
			name: (
				<FileRowLabel
					fileName={fileName}
					status={file.status}
				/>
			) as unknown as string,
			icon: makeFileIconComponent(getFileIconName(file.path)),
		})
	}

	return root
}

interface CommitDetail {
	fullHash: string
	shortHash: string
	message: string
	body: string
	branch: string
	parentCount: number
	parentHashes: string[]
	date: string
	authorName: string
	authorAvatar: string
	changedFiles: number
	additions: number
	deletions: number
	files: { path: string; action: string }[]
}

interface CommitProps {
	hash: string
	owner: string
	repo: string
}

function Commit({ hash, owner, repo }: CommitProps) {

	const navigate = useNavigate()
	const location = useLocation()

	const [search, setSearch] = useState("")
	const [codeSearch, setCodeSearch] = useState("")
	const [showFileTree, setShowFileTree] = useState(true)

	const [, routeOwner, routeRepo] = location.pathname.split("/")

	const { data: commit, isLoading } = useQuery<CommitDetail>({
		queryKey: ["commit", owner, repo, hash],
		queryFn: async () => {
			const res = await fetch(
				`http://localhost:3200/api/repos/${owner}/${repo}/commits/${hash}`,
			)
			if (!res.ok) throw new Error("Failed to fetch commit")
			return res.json()
		},
		staleTime: 60_000,
	})

	const filteredFiles: CommitFile[] = (commit?.files ?? []).map((f) => ({
		path: f.path,
		status: f.action as ChangeStatus,
	})).filter((file) =>
		file.path.toLowerCase().includes(search.toLowerCase()),
	)

	const parentHashShort = commit?.parentHashes?.[0]?.slice(0, 7) ?? ""
	const commitDate = commit?.date
		? new Date(commit.date).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: ""

	return (
		<div>
			<div className="mx-4 flex items-center justify-between">
				<span className="text-2xl font-medium">
					Commit{" "}
					<Badge size="xl" variant="secondary">
						{isLoading ? "..." : commit?.shortHash ?? hash.slice(0, 7)}
					</Badge>
				</span>

				<Button
					variant="outline"
					onClick={() =>
						navigate({
							to: `/${routeOwner}/${routeRepo}`,
						})
					}
				>
					<FileCode />
					Browse Files
				</Button>
			</div>

			<div className="mx-4 mt-2 rounded-md border p-3">
				<div className="font-mono text-sm">
					{isLoading ? "Loading..." : commit?.message ?? ""}
				</div>

				{commit?.body && (
					<div className="mt-2 font-mono text-xs text-muted-foreground">
						{commit.body}
					</div>
				)}

				<Separator className="my-3" />

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<GitBranch
							size={18}
							className="text-muted-foreground"
						/>

						<Badge
							size="lg"
							variant="secondary"
						>
							{isLoading ? "..." : commit?.branch ?? ""}
						</Badge>
					</div>

					<div className="flex items-center gap-1 text-sm">
						<span className="text-muted-foreground">
							{commit?.parentCount ?? 0} parent{(commit?.parentCount ?? 0) !== 1 ? "s" : ""}
						</span>

						{parentHashShort && (
							<span className="font-mono underline">
								{parentHashShort}
							</span>
						)}

						<span className="text-muted-foreground">
							commit
						</span>

						<span className="font-mono underline">
							{isLoading ? "..." : commit?.shortHash ?? ""}
						</span>
					</div>
				</div>

				<Separator className="my-3" />

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Diff
							size={18}
							className="text-muted-foreground"
						/>

						<span className="text-sm">
							<span className="font-semibold text-orange-500">
								{commit?.changedFiles ?? 0} changed files
							</span>{" "}
							with{" "}
							<span className="font-semibold text-green-600 dark:text-green-500">
								{commit?.additions ?? 0} additions
							</span>{" "}
							and{" "}
							<span className="font-semibold text-red-600 dark:text-red-500">
								{commit?.deletions ?? 0} deletions
							</span>
						</span>
					</div>

					<div className="flex items-center gap-2">
						<Avatar size="sm">
							<AvatarImage src={commit?.authorAvatar ?? ""} />
							<AvatarFallback>
								{commit?.authorName?.slice(0, 2).toUpperCase() ?? "??"}
							</AvatarFallback>
						</Avatar>

						<span className="text-sm">
							{isLoading ? "..." : commit?.authorName ?? ""}{" "}
							<span className="text-muted-foreground">
								committed {commitDate}
							</span>
						</span>
					</div>
				</div>
			</div>

			<Separator className="mt-4" />

			<div className="flex min-h-[400px]">
				{showFileTree && (
					<>
						<div className="ml-4 w-[250px] shrink-0 pr-2">
							<div className="relative mt-4">
								<Search
									className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
								/>

								<Input
									value={search}
									onChange={(e) =>
										setSearch(e.target.value)
									}
									placeholder="Search files..."
									className="pl-8"
								/>
							</div>

							<TreeView
								data={buildCommitFileTree(
									filteredFiles,
								)}
							/>
						</div>

						<Separator orientation="vertical" />
					</>
				)}

				<div className="m-3 min-w-0 flex-1">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Button
								variant="secondary"
								onClick={() =>
									setShowFileTree(
										(value) => !value,
									)
								}
							>
								<PanelLeft />
							</Button>

							<Input
								type="search"
								placeholder="Search within code"
								value={codeSearch}
								onChange={(e) =>
									setCodeSearch(e.target.value)
								}
								className="w-[300px]"
							/>
						</div>

						<Button variant="outline">
							<Ellipsis />
						</Button>
					</div>

					<CodeCommitBlock search={codeSearch} />
				</div>
			</div>
		</div>
	)
}

export default Commit
