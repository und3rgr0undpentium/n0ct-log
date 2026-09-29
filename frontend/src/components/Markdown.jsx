import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const CodeBlock = ({ inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || "");
  if (inline) return <code className={className} {...props}>{children}</code>;
  return (
    <SyntaxHighlighter
      style={atomDark}
      language={match ? match[1] : "bash"}
      PreTag="div"
      customStyle={{
        background: "#050505",
        border: "1px solid #262626",
        padding: "1rem",
        fontSize: "0.85rem",
        margin: "1.2rem 0",
      }}
      {...props}
    >
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  );
};

const MD_COMPONENTS = { code: CodeBlock };

export default function Markdown({ children }) {
  return (
    <div className="prose-hack">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
