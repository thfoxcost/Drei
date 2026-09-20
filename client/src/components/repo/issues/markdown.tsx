import { defaultSchema } from "hast-util-sanitize";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

// Default schema follows GitHub-style sanitation but strips the alt/title
// attributes from images. Keep those so uploaded images stay accessible and
// can carry a caption.
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    img: [...(defaultSchema.attributes?.img ?? []), "alt", "title"],
  },
};

const components: Components = {
  img: ({ ...props }) => (
    <img
      {...props}
      className="max-w-full rounded-lg border"
      loading="lazy"
      alt={props.alt ?? ""}
    />
  ),
};

function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none text-[15px] prose-headings:scroll-mt-20 prose-pre:rounded-lg prose-pre:border prose-pre:bg-accent prose-code:before:content-none prose-code:after:content-none prose-img:max-w-full prose-img:my-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export { Markdown };
