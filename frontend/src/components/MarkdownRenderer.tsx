import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback if clipboard API is restricted
    }
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-block-topbar">
        <span className="code-block-lang">
          {language ? language.toUpperCase() : "CODE"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="code-copy-btn"
          aria-label={copied ? "Copied code" : "Copy code"}
        >
          {copied ? (
            <>
              <Check size={12} className="copy-icon-success" />
              <span>COPIED</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>COPY</span>
            </>
          )}
        </button>
      </div>
      <div className="code-block-scroll">
        <pre className="code-block-pre">
          <code className="code-block-content">{code}</code>
        </pre>
      </div>
    </div>
  );
};

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Unwrap outer pre so CodeBlock can render proper semantic markup without invalid nesting
          pre({ children }) {
            return <>{children}</>;
          },
          code(props) {
            const { children, className } = props;
            const match = /language-(\w+)/.exec(className || "");
            const rawContent = String(children).replace(/\n$/, "");
            const hasMultipleLines = rawContent.includes("\n");

            if (!match && !hasMultipleLines) {
              return <code className="inline-code">{children}</code>;
            }

            return (
              <CodeBlock
                language={match ? match[1] : ""}
                code={rawContent}
              />
            );
          },
          a({ href, children }) {
            const isExternal = href?.startsWith("http");
            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="prose-link"
              >
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="table-responsive">
                <table className="prose-table">{children}</table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
