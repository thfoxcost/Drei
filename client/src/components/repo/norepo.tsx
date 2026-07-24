import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import CodeBlock from "./code"

function BoardIllustration() {
  return (
    <svg
      width="180"
      height="160"
      viewBox="0 0 180 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Shadow */}
      <ellipse
        cx="90"
        cy="148"
        rx="60"
        ry="8"
        className="fill-muted-foreground/8 dark:fill-muted-foreground/5"
      />

      {/* Back face */}
      <path
        d="M30 40 L90 10 L160 45 L100 75 Z"
        className="fill-muted/80 dark:fill-muted/40 stroke-border"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Front face */}
      <path
        d="M30 40 L100 75 L100 110 L30 75 Z"
        className="fill-muted dark:fill-muted/60 stroke-border"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Right face */}
      <path
        d="M100 75 L160 45 L160 80 L100 110 Z"
        className="fill-background stroke-border"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Board content */}
      <circle cx="62" cy="35" r="4" className="fill-primary/20" />
      <line
        x1="72"
        y1="33"
        x2="105"
        y2="17"
        className="stroke-muted-foreground/20"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="110"
        y1="15"
        x2="130"
        y2="5"
        className="stroke-muted-foreground/15"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <circle cx="55" cy="50" r="4" className="fill-primary/30" />
      <line
        x1="65"
        y1="48"
        x2="100"
        y2="31"
        className="stroke-muted-foreground/20"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="105"
        y1="29"
        x2="135"
        y2="14"
        className="stroke-muted-foreground/12"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <circle cx="48" cy="65" r="4" className="fill-destructive/25" />
      <line
        x1="58"
        y1="63"
        x2="88"
        y2="48"
        className="stroke-muted-foreground/18"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function NoRepo() {
  return (
    <div className="flex items-center justify-center p-4">
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyMedia>
            <BoardIllustration />
          </EmptyMedia>

          <EmptyTitle>No Repository yet</EmptyTitle>

          <EmptyDescription>
            You haven&apos;t created any repositories yet. Create your first
            repository to start hosting your projects.
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <CodeBlock />
        </EmptyContent>
      </Empty>
    </div>
  )
}