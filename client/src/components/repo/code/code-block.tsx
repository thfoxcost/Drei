import { Button } from "#/components/ui/button"
import { ButtonGroup } from "#/components/ui/button-group"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "#/components/ui/tabs"
import type { BundledLanguage } from "@/components/kibo-ui/code-block"
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockItem,
} from "@/components/kibo-ui/code-block"
import {
  Copy,
  Download,
  FileCode,
  Pencil,
  Trash2,
} from "lucide-react"

interface CodeblockProps {
  code?: string
  language?: string
  filename?: string
  lineCount?: number
  locCount?: number
  byteSize?: number
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  if (bytes < 1024) return `${bytes} Bytes`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function Codeblock({
  code = "",
  language = "plaintext",
  filename = "",
  lineCount = 0,
  locCount = 0,
  byteSize = 0,
}: CodeblockProps) {
  const data = [
    {
      language,
      filename,
      code,
    },
  ]

  return (
    <div className="w-full overflow-hidden rounded-md border">
      <CodeBlock
        data={data}
        defaultValue={language}
        className="w-full rounded-none border-0"
      >
        <CodeBlockHeader className="flex h-10 items-center border-b bg-muted-foreground/10 px-2">
          <Tabs defaultValue="code" className="h-7">
            <TabsList className="h-7 rounded-md bg-transparent p-0">
              <TabsTrigger
                value="code"
                className="h-7 rounded-md px-3 text-sm"
              >
                Code
              </TabsTrigger>

              <TabsTrigger
                value="blame"
                disabled
                className="h-7 rounded-md px-3 text-sm"
              >
                Blame
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="ml-auto flex items-center gap-3 pr-1">
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              {lineCount} lines ({locCount} loc) {`\u00b7`} {formatBytes(byteSize)}
            </span>

            <ButtonGroup>
              <Button
                size="sm"
                variant="outline"
                disabled
                aria-label="Edit file"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                aria-label="Delete file"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </ButtonGroup>

            <ButtonGroup>
              <Button
                size="sm"
                variant="outline"
                aria-label="View raw file"
              >
                <FileCode className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                aria-label="Copy file"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                aria-label="Download file"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </ButtonGroup>
          </div>
        </CodeBlockHeader>

        <CodeBlockBody>
          {(item) => (
            <CodeBlockItem
              key={item.language}
              value={item.language}
            >
              <CodeBlockContent
                language={item.language as BundledLanguage}
                className="text-xs"
              >
                {item.code}
              </CodeBlockContent>
            </CodeBlockItem>
          )}
        </CodeBlockBody>
      </CodeBlock>
    </div>
  )
}

export default Codeblock
