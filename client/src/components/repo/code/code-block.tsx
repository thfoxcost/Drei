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

function Codeblock() {
  const code = [
    {
      language: "typescript",
      filename: "api.ts",
      code: `export async function fetchUser(id: string) {
  const response = await fetch(\`/api/users/\${id}\`)
  if (!response.ok) throw new Error("Failed to fetch user")
  return response.json()
}`,
    },
  ]

  return (
    <div className="w-full overflow-hidden rounded-md border">
      <CodeBlock
        data={code}
        defaultValue="typescript"
        className="w-full rounded-none border-0"
      >
        <CodeBlockHeader className="flex h-10 items-center border-b px-2 bg-muted-foreground/10">
          <Tabs defaultValue="code" className="h-7">
            <TabsList className="h-7 rounded-md bg-transparent p-0">
              <TabsTrigger
                value="code"
                className="h-7 rounded-md px-3 text-xs"
              >
                Code
              </TabsTrigger>

              <TabsTrigger
                value="blame"
                disabled
                className="h-7 rounded-md px-3 text-xs"
              >
                Blame
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="ml-auto flex items-center gap-3 pr-1">
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              16 lines (13 loc) · 156 Bytes
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