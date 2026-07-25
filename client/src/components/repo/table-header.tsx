import { useState } from "react";
import { Check, ChevronDown, Code, Copy, GitBranch, SearchIcon, Tag, Terminal } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Field } from "../ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";

interface TableheaderProps {
  defaultBranch: string;
  nBranches: number;
  nTags: number;
  cloneUrl: string;
}

function CloneUrlField({ url }: { url?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Field>
      <InputGroup>
        <InputGroupInput readOnly value={url ?? "Coming soon"} className="font-mono text-xs" />
        {url && (
          <InputGroupAddon align="inline-end">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              aria-label="Copy clone URL"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </InputGroupAddon>
        )}
      </InputGroup>
    </Field>
  );
}

function Tableheader({ defaultBranch, nBranches, nTags, cloneUrl }: TableheaderProps) {
  return (
    <div className="flex flex-row items-center gap-2 justify-between">
      <div className="">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="align-center justify-center">
              <GitBranch className="h-4 w-4" />
              {defaultBranch}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="align-center justify-center">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold">{nBranches}</span>
              <span className="text-muted-foreground">Branches</span>
            </Button>
          </DropdownMenuTrigger>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="align-center justify-center">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold">{nTags}</span>
              <span className="text-muted-foreground">Tags</span>
            </Button>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </div>

      <div className="flex flex-row gap-2 items-center">
        <Field className="max-w-xs">
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search..." />
          </InputGroup>
        </Field>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="inline-flex items-center justify-center gap-1">
              <span>Add file</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <p className="text-xs text-muted-foreground p-2">Open coming soon</p>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700">
              <Code className="h-4 w-4" />
              <span>Clone</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80 p-3">
            <DropdownMenuLabel className="flex items-center gap-2 px-0 pb-2">
              <Terminal className="h-4 w-4" /> Clone
            </DropdownMenuLabel>
            <Tabs defaultValue="HTTP">
                      <TabsContent value="HTTP" className="mt-3">
                <CloneUrlField url={cloneUrl} />
              </TabsContent>
            </Tabs>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default Tableheader;