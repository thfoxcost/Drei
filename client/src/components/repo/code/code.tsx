import { Spinner } from "#/components/ui/spinner"
import { useBlob } from "#/hooks/useBlob"
import { useRepoData } from "#/hooks/useRepoData"
import Codeblock from "./code-block"
import Filetree from "./filetree"
import Latestcommitsbox from "./latestcommitsbox"

interface CodeProps {
  owner?: string
  repo?: string
  branch?: string
  filePath?: string
  mode?: "blob" | "tree" | "code"
}

function detectLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    go: "go",
    py: "python",
    rb: "ruby",
    rs: "rust",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    c: "c",
    cpp: "cpp",
    cc: "cpp",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    php: "php",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    xml: "xml",
    svg: "xml",
    md: "markdown",
    mdx: "markdown",
    sql: "sql",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    fish: "bash",
    ps1: "powershell",
    dart: "dart",
    lua: "lua",
    r: "r",
    julia: "julia",
    ex: "elixir",
    exs: "elixir",
    erl: "erlang",
    hs: "haskell",
    clj: "clojure",
    scala: "scala",
    groovy: "groovy",
    vue: "html",
    svelte: "html",
    tf: "hcl",
    hcl: "hcl",
    dockerfile: "dockerfile",
    makefile: "makefile",
    csv: "plaintext",
    txt: "plaintext",
    log: "plaintext",
  }
  return map[ext] ?? "plaintext"
}

function decodeContent(content: string): string {
  const binary = atob(content)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder("utf-8").decode(bytes)
}

function Code({ owner, repo, branch, filePath, mode = "code" }: CodeProps) {
  const isBlob = mode === "blob" && owner && repo && branch && filePath
  const { data: blobData, isLoading: blobLoading, isError: blobError } = useBlob(
    owner ?? "",
    repo ?? "",
    branch ?? "",
    filePath ?? "",
  )
  const { data: repoData } = useRepoData(owner ?? "", repo ?? "", branch)

  const fileName = blobData?.name ?? ""
  const decoded = blobData?.content ? decodeContent(blobData.content) : ""
  const language = fileName ? detectLanguage(fileName) : "plaintext"
  const lineCount = decoded ? decoded.split("\n").length : 0
  const locCount = decoded
    ? decoded.split("\n").filter((l) => l.trim().length > 0).length
    : 0
  const byteSize = blobData?.size ?? 0

  if (isBlob && blobLoading) {
    return (
      <div className="flex items-start">
        <aside className="sticky top-0 h-screen shrink-0">
          <Filetree
            branches={repoData?.branches}
            defaultBranch={repoData?.defaultBranch}
            files={repoData?.files}
            currentBranch={branch}
            currentFilePath={filePath}
          />
        </aside>
        <main className="min-w-0 flex-2 mx-5 flex h-[60vh] items-center justify-center">
          <Spinner />
        </main>
      </div>
    )
  }

  if (isBlob && blobError) {
    return (
      <div className="flex items-start">
        <aside className="sticky top-0 h-screen shrink-0">
          <Filetree
            branches={repoData?.branches}
            defaultBranch={repoData?.defaultBranch}
            files={repoData?.files}
            currentBranch={branch}
            currentFilePath={filePath}
          />
        </aside>
        <main className="min-w-0 flex-2 mx-5 flex h-[60vh] items-center justify-center text-muted-foreground">
          Failed to load file
        </main>
      </div>
    )
  }

  const pathParts = filePath?.split("/") ?? []
  const breadcrumbs = pathParts.map((part, i) => ({
    label: part,
    isLast: i === pathParts.length - 1,
  }))

  return (
    <div className="flex items-start">
      <aside className="sticky top-0 h-screen shrink-0">
        <Filetree
          branches={repoData?.branches}
          defaultBranch={repoData?.defaultBranch}
          files={repoData?.files}
          currentBranch={branch}
          currentFilePath={filePath}
        />
      </aside>

      <main className="min-w-0 flex-2 mx-5 flex flex-col gap-3">
        <span className="font-semibold">
          <span className="text-blue-400 hover:underline cursor-pointer">
            {repo}
          </span>{" "}
          {breadcrumbs.map((bc, i) => (
            <span key={`${bc.label}-${i}`}>
              <span className="text-muted-foreground">/</span>{" "}
              {bc.isLast ? (
                <span className="font-medium">{bc.label}</span>
              ) : (
                <span className="text-blue-400 hover:underline cursor-pointer">
                  {bc.label}
                </span>
              )}
            </span>
          ))}
        </span>

        {blobData && (
          <Latestcommitsbox
            author={blobData.lastCommit.author}
            message={blobData.lastCommit.message}
            hash={blobData.lastCommit.hash}
            date={blobData.lastCommit.date}
          />
        )}

        <Codeblock
          code={decoded}
          language={language}
          filename={fileName}
          lineCount={lineCount}
          locCount={locCount}
          byteSize={byteSize}
        />
      </main>
    </div>
  )
}

export default Code
