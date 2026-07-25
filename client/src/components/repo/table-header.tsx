import { useState } from "react";
import {
  Check,
  ChevronDown,
  Code,
  Copy,
  GitBranch,
  SearchIcon,
  Tag,
  Terminal,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Field } from "../ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group";
import { Tabs, TabsContent } from "../ui/tabs";

interface TableheaderProps {
  defaultBranch: string;
  branches: string[];
  nBranches: number;
  tags: string[] | null;
  nTags: number;
  cloneUrl: string;
  onBranchChange?: (branch: string) => void;
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

function Tableheader({
  defaultBranch,
  branches,
  nBranches,
  tags,
  nTags,
  cloneUrl,
  onBranchChange,
}: TableheaderProps) {
  const [branchFilter, setBranchFilter] = useState("");

  const filteredBranches = branches.filter((b) =>
    b.toLowerCase().includes(branchFilter.toLowerCase())
  );

  return (
    <div className="flex flex-row items-center gap-2 justify-between">
      <div className="flex flex-row gap-3">
        {/* Branch switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="align-center justify-center">
              <GitBranch className="h-4 w-4" />
              {defaultBranch}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Switch branch</DropdownMenuLabel>
            <div className="px-2 pb-2">
              <InputGroup>
                <InputGroupAddon>
                  <SearchIcon className="h-3.5 w-3.5" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Find a branch..."
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="text-xs"
                />
              </InputGroup>
            </div>
            <DropdownMenuSeparator />
            {filteredBranches.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">No branches found</p>
            ) : (
              filteredBranches.map((branch) => (
                <DropdownMenuItem
                  key={branch}
                  onClick={() => onBranchChange?.(branch)}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                    {branch}
                  </span>
                  {branch === defaultBranch && (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  )}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Branches list */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="align-center justify-center">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold">{nBranches}</span>
              <span className="text-muted-foreground">Branches</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Branches</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {branches.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">No branches</p>
            ) : (
              branches.map((branch) => (
                <DropdownMenuItem key={branch} className="flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                  {branch}
                  {branch === defaultBranch && (
                    <span className="ml-auto text-xs text-muted-foreground">default</span>
                  )}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tags list */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="align-center justify-center">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold">{nTags}</span>
              <span className="text-muted-foreground">Tags</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Tags</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!tags || tags.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">No tags</p>
            ) : (
              tags.map((tag) => (
                <DropdownMenuItem key={tag} className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  {tag}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
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