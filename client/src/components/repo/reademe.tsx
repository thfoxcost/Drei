import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkGemoji from "remark-gemoji";
import rehypeHighlight from "rehype-highlight";

import "highlight.js/styles/github-dark.css";

interface ReadmeProps {
  content: string;
}

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
      className="rounded-lg border my-4"
      loading="lazy"
    />
  ),
};

export default function Readme({ content }: ReadmeProps) {
  const markdown = atob(content);

  return (
    <div className="mt-3 mb-40 rounded-lg border p-6">
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
          rehypePlugins={[rehypeHighlight]}
          components={components}
        >
          {markdown}
        </ReactMarkdown>
      </article>
    </div>
  );
}