import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

import remarkGfm from "remark-gfm";
import remarkGemoji from "remark-gemoji";

import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Scale,
  History,
  Users,
  Shield,
  HeartHandshake,
  BookUser,
  type LucideIcon,
} from "lucide-react";

import "highlight.js/styles/github-dark.css";

interface DocFile {
  name: string;
  content: string;
}

interface ReadmeProps {
  docs: DocFile[];
}

const iconMap: Record<string, LucideIcon> = {
  README: FileText,
  License: Scale,
  Changelog: History,
  Contributing: Users,
  Security: Shield,
  Support: HeartHandshake,
  Authors: BookUser,
};

const components: Components = {
  a: ({ ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 hover:underline"
    />
  ),

  img: ({ ...props }) => (
    <img
      {...props}
      className="my-4 rounded-lg border"
      loading="lazy"
      alt={props.alt ?? ""}
    />
  ),
};

function Markdown({ content }: { content: string }) {
  return (
    <article
      className="
        prose
        prose-neutral
        dark:prose-invert
        max-w-none
        text-[15px]

        prose-headings:scroll-mt-20

        prose-pre:rounded-lg
        prose-pre:border
        prose-pre:bg-accent

        prose-img:rounded-lg
        prose-img:border

        prose-code:before:content-none
        prose-code:after:content-none
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkGemoji]}
        rehypePlugins={[
          rehypeRaw,
          rehypeSanitize,
          rehypeHighlight,
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}

export default function Readme({ docs }: ReadmeProps) {
  if (docs.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 mb-40 overflow-hidden rounded-lg border">
      <Tabs defaultValue={docs[0].name} className="mt-3 gap-0">
        <div className="w-full overflow-x-auto border-b bg-muted/10">
          <div className="min-w-max">
            <TabsList
              variant="line"
              className="h-12 w-max rounded-none bg-transparent p-0"
            >
              {docs.map((doc) => {
                const Icon = iconMap[doc.name] ?? FileText;

                return (
                  <TabsTrigger
                    key={doc.name}
                    value={doc.name}
                    className="
              mx-2 h-11 shrink-0 gap-2 rounded-t-md border-0
              whitespace-nowrap
              data-[state=active]:bg-muted
              group-data-horizontal/tabs:after:bottom-[-1px]
              not-data-active:hover:group-data-horizontal/tabs:after:bg-muted-foreground/30
              not-data-active:hover:group-data-horizontal/tabs:after:opacity-100
              mb-[12px]
            "
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="text-sm whitespace-nowrap">
                      {doc.name}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </div>

        {docs.map((doc) => (
          <TabsContent
            key={doc.name}
            value={doc.name}
            className="m-0 p-6"
          >
            <Markdown content={atob(doc.content)} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}