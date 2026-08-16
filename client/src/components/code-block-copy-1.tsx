"use client";

import type { BundledLanguage } from "#/components/kibo-ui/code-block/index.tsx";
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockItem,
} from "#/components/kibo-ui/code-block/index.tsx";

export const title = "Copy button";

const code = [
  {
    language: "typescript",
    filename: "api.ts",
    code: `export async function fetchUser(id: string) {
  const response = await fetch(\`/api/users/\${id}\`);
  if (!response.ok) throw new Error("Failed to fetch user");
  return response.json();
}`,
  },
];

const Example = () => (
  <div className="w-full max-w-md">
    <CodeBlock data={code} defaultValue="typescript">
      <CodeBlockHeader className="justify-end">
        <CodeBlockCopyButton />
      </CodeBlockHeader>
      <CodeBlockBody>
        {(item) => (
          <CodeBlockItem key={item.language} value={item.language}>
            <CodeBlockContent language={item.language as BundledLanguage}>
              {item.code}
            </CodeBlockContent>
          </CodeBlockItem>
        )}
      </CodeBlockBody>
    </CodeBlock>
  </div>
);

export default Example;
