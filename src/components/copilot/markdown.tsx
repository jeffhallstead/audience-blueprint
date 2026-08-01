import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Shared markdown renderer for all Copilot output.
 *
 * Styled explicitly rather than via a typography plugin so AI output inherits
 * the executive design system instead of default prose colors.
 */
export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("space-y-4 text-sm leading-relaxed text-foreground/90", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-6 font-display text-base font-semibold tracking-tight text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 text-sm font-semibold tracking-tight text-foreground">{children}</h3>
          ),
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="ml-4 list-disc space-y-1.5 marker:text-brass">{children}</ul>,
          ol: ({ children }) => <ol className="ml-4 list-decimal space-y-1.5 marker:text-brass">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-brass underline underline-offset-4">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-brass/50 pl-4 text-muted-foreground">{children}</blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{children}</code>
          ),
          hr: () => <hr className="border-border/60" />,
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border bg-muted/50 px-3 py-2 font-semibold text-foreground">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-border/60 px-3 py-2 align-top">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
