import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGemoji from "remark-gemoji";
import remarkGfm from "remark-gfm";

import "highlight.js/styles/github-dark.css";

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
      className="rounded-lg border"
      loading="lazy"
      alt={props.alt ?? ""}
    />
  ),
};

export function Markdown({ content }: { content: string }) {
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
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
