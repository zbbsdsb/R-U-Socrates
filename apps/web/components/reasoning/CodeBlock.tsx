/**
 * CodeBlock — Syntax-highlighted code panel with Shiki.
 *
 * ADR-007 L1 requirement: code blocks in Agent cards must be
 * syntax highlighted for readability.  This component:
 * - Uses Shiki (github-dark theme) for highlighting
 * - Auto-detects language from content patterns
 * - Renders on client-side only (SSR-safe via dynamic import)
 * - Gracefully falls back to plain text if Shiki fails
 *
 * Language detection heuristics:
 *   - Triple-backtick python/python3  → python
 *   - Def / class / import statements → python
 *   - function / const / let / =>    → javascript/typescript
 *   - Most AI-generated code is Python, so that's the default.
 */

"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  code: string;
  language?: string;       // override; if omitted, auto-detected
  filename?: string;
  maxLines?: number;      // truncate at N lines (0 = no limit)
}

const FALLBACK_LANG = "python";

// ── Language detection ───────────────────────────────────────────────────────

function detectLanguage(code: string): string {
  // Explicit markers
  if (/^```python3?\s/m.test(code)) return "python";
  if (/^```javascript\s/m.test(code)) return "javascript";
  if (/^```typescript\s/m.test(code)) return "typescript";
  if (/^```bash\s/m.test(code)) return "bash";
  if (/^```sh\s/m.test(code)) return "bash";
  if (/^```json\s/m.test(code)) return "json";
  if (/^```rust\s/m.test(code)) return "rust";
  if (/^```go\s/m.test(code)) return "go";
  if (/^```java\s/m.test(code)) return "java";
  if (/^```c\+\+\s/m.test(code)) return "cpp";
  if (/^```c\s/m.test(code)) return "c";

  // Structural heuristics
  if (/^(def |class |\s*import |from \w+ import |if __name__|async def |print\()/m.test(code))
    return "python";
  if (/^(function |const |let |var |=>|console\.|module\.exports)/m.test(code))
    return "javascript";
  if (/^(pub fn |use std::|fn main\(\)|println!|impl )/m.test(code))
    return "rust";
  if (/^(func |package |fmt\.|println!)/m.test(code))
    return "go";
  if (/^(public class |public static void|\.println\()/m.test(code))
    return "java";

  return FALLBACK_LANG;
}

// ── Shiki loader (singleton, browser-only) ────────────────────────────────────

let _highlighterPromise: Promise<import("shiki").Highlighter | null> | null = null;

function getHighlighter(): Promise<import("shiki").Highlighter | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  if (!_highlighterPromise) {
    _highlighterPromise = (async () => {
      try {
        const { createHighlighter } = await import("shiki");
        return await createHighlighter({
          themes: ["github-dark"],
          langs: [
            "python", "javascript", "typescript", "bash", "sh",
            "json", "rust", "go", "java", "cpp", "c",
          ],
        });
      } catch (err) {
        console.warn("[CodeBlock] Shiki failed to load:", err);
        return null;
      }
    })();
  }
  return _highlighterPromise;
}

// ── Highlight helper ───────────────────────────────────────────────────────────

async function highlightCode(
  code: string,
  lang: string,
): Promise<{ html: string; ok: boolean }> {
  const hl = await getHighlighter();
  if (!hl) return { html: escapeHtml(code), ok: false };

  try {
    const validLangs = hl.getLoadedLanguages();
    const safeLang = validLangs.includes(lang as never) ? lang : FALLBACK_LANG;
    const html = hl.codeToHtml(code, {
      lang: safeLang,
      theme: "github-dark",
    });
    return { html, ok: true };
  } catch {
    return { html: escapeHtml(code), ok: false };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Dot indicator (language badge) ───────────────────────────────────────────

const DOT_COLOR: Record<string, string> = {
  python: "#3572A5",
  javascript: "#f7df1e",
  typescript: "#3178c6",
  bash: "#4eaa25",
  rust: "#dea584",
  go: "#00ADD8",
  java: "#b07219",
  cpp: "#f34b7d",
  c: "#555555",
  json: "#40B5AD",
};

function LanguageDot({ lang }: { lang: string }) {
  const color = DOT_COLOR[lang] ?? "#888888";
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffffff18" }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffffff18" }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffffff18" }} />
      </div>
      <span
        className="text-[11px] font-mono ml-1"
        style={{ color }}
      >
        {lang}
      </span>
    </div>
  );
}

// ── Shiki output component ────────────────────────────────────────────────────

function ShikiOutput({ html }: { html: string }) {
  return (
    <div
      className="[&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CodeBlock({ code, language, filename, maxLines = 0 }: Props) {
  const lang = language ?? detectLanguage(code);
  const displayCode = maxLines > 0
    ? code.split("\n").slice(0, maxLines).join("\n")
    : code;
  const truncated = maxLines > 0 && code.split("\n").length > maxLines;

  const [html, setHtml] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const once = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (once.current) return;
    once.current = true;

    setLoading(true);
    highlightCode(displayCode, lang).then(({ html: h }) => {
      setHtml(h);
      setLoading(false);
    });
  }, [displayCode, lang]);

  const panel = (
    <div className="rounded-xl bg-black/70 border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.02]">
        {filename
          ? <span className="text-xs text-white/20 font-mono">{filename}</span>
          : <LanguageDot lang={lang} />
        <span className="text-[10px] text-white/15 font-mono">
          {displayCode.split("\n").length} lines
        </span>
      </div>

      {/* Body */}
      <div className="relative overflow-hidden">
        {loading ? (
          /* Skeleton while Shiki loads */
          <div className="px-4 py-3 space-y-2">
            {[...Array(Math.min(5, displayCode.split("\n").length))].map((_, i) => (
              <div
                key={i}
                className="h-3.5 rounded-full bg-white/[0.06] animate-pulse"
                style={{ width: `${55 + ((i * 37) % 35)}%` }}
              />
            ))}
          </div>
        ) : html ? (
          <div className="overflow-x-auto">
            <ShikiOutput html={html} />
          </div>
        ) : (
          /* Fallback: plain monospace */
          <pre className="px-4 py-3 text-xs font-mono text-cyan-300/80 whitespace-pre overflow-x-auto">
            {displayCode}
          </pre>
        )}
        {truncated && (
          <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Truncation notice */}
      {truncated && (
        <div className="px-3 py-1.5 border-t border-white/5 text-[10px] text-white/20 font-mono text-center">
          {code.split("\n").length - maxLines} more lines — expand in full results
        </div>
      )}
    </div>
  );

  // SSR: render plain text to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="rounded-xl bg-black/70 border border-white/5 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/[0.02]">
          <LanguageDot lang={lang} />
        </div>
        <pre className="px-4 py-3 text-xs font-mono text-white/40 whitespace-pre overflow-x-auto">
          {displayCode}
        </pre>
      </div>
    );
  }

  return panel;
}
