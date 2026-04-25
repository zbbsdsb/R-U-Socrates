"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSettingsStore, type AppSettings } from "@/stores/settingsStore";
import { cn } from "@/lib/utils";

// ─── Brand SVG Icons ──────────────────────────────────────────────────────────

function OpenAIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.386 2.02-1.164a.08.08 0 0 1 .071 0l4.83 2.786a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.402-.663zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
    </svg>
  );
}

function DeepSeekIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.748 14.556a.54.54 0 0 0-.002-.025l-.015-.083a4.673 4.673 0 0 0-.024-.11l-.002-.006a4.43 4.43 0 0 0-1.576-2.37 6.53 6.53 0 0 0-1.154-.703c-.22-.107-.447-.2-.677-.28a6.455 6.455 0 0 0-1.496-.321l-.063-.005a4.476 4.476 0 0 0-.53-.022 4.45 4.45 0 0 0-.525.031 4.41 4.41 0 0 0-.975.224 4.46 4.46 0 0 0-1.546.946 4.43 4.43 0 0 0-.97 1.36 4.394 4.394 0 0 0-.36 1.436 4.42 4.42 0 0 0 .072 1.093 4.43 4.43 0 0 0 1.207 2.39c.14.136.29.262.448.376a4.44 4.44 0 0 0 2.545.806 4.467 4.467 0 0 0 1.73-.35 4.45 4.45 0 0 0 2.05-1.856 4.42 4.42 0 0 0 .516-2.07c0-.21-.015-.419-.044-.625l-.005-.032a.14.14 0 0 0-.001-.007zm-3.558 2.987a2.672 2.672 0 0 1-.913.62 2.704 2.704 0 0 1-1.05.207 2.718 2.718 0 0 1-2.718-2.718 2.718 2.718 0 0 1 2.718-2.718c.208 0 .41.024.604.07a2.718 2.718 0 0 1 2.114 2.648 2.705 2.705 0 0 1-.755 1.891z"/>
      <path d="M11.594 5.362a6.476 6.476 0 0 1 3.684 1.14.414.414 0 0 0 .526-.05l1.147-1.148a.414.414 0 0 0-.015-.6A8.907 8.907 0 0 0 11.594 3a8.907 8.907 0 0 0-5.342 1.704.414.414 0 0 0-.015.6l1.147 1.148a.414.414 0 0 0 .526.05 6.476 6.476 0 0 1 3.684-1.14z"/>
      <path d="M5.362 12.406a6.476 6.476 0 0 1 1.14-3.684.414.414 0 0 0-.05-.526L5.305 7.049a.414.414 0 0 0-.6.015A8.907 8.907 0 0 0 3 12.406a8.907 8.907 0 0 0 1.704 5.342.414.414 0 0 0 .6.015l1.148-1.147a.414.414 0 0 0 .05-.526 6.476 6.476 0 0 1-1.14-3.684z"/>
    </svg>
  );
}

function AnthropicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.603L16.743 20h-3.603L6.57 3.52z"/>
    </svg>
  );
}

function QwenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 3a7 7 0 1 1 0 14A7 7 0 0 1 12 5zm0 2a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
    </svg>
  );
}

function CustomProviderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1 1 .03 2.798-1.442 2.798H4.24c-1.47 0-2.441-1.798-1.442-2.798L4.2 15.3"/>
    </svg>
  );
}

function ServerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm0 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>
      <path d="M7 8h.01M7 16h.01"/>
    </svg>
  );
}

function SlidersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"/>
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25z"/>
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
    </svg>
  );
}

function EyeSlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/>
    </svg>
  );
}

// ─── Connection test ───────────────────────────────────────────────────────────

type TestStatus = "idle" | "testing" | "ok" | "fail";

function useConnectionTest() {
  const [status, setStatus] = useState<TestStatus>("idle");
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const test = useCallback(async (apiUrl: string) => {
    setStatus("testing");
    setError(null);
    const start = Date.now();
    try {
      const res = await fetch(`${apiUrl.replace(/\/$/, "")}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLatency(Date.now() - start);
      setStatus("ok");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("fail");
    }
  }, []);

  return { status, latency, error, test };
}

// ─── Provider config ──────────────────────────────────────────────────────────

interface ProviderDef {
  id: keyof AppSettings["apiKeys"];
  name: string;
  placeholder: string;
  description: string;
  docsUrl: string;
  iconBg: string;
  iconColor: string;
  Icon: React.FC<{ className?: string }>;
}

const PROVIDERS: ProviderDef[] = [
  {
    id: "openai",
    name: "OpenAI",
    placeholder: "sk-...",
    description: "GPT-4o, GPT-4o-mini, o1, o3",
    docsUrl: "https://platform.openai.com/api-keys",
    iconBg: "bg-[#000000]",
    iconColor: "text-white",
    Icon: OpenAIIcon,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    placeholder: "sk-...",
    description: "DeepSeek-V3, DeepSeek-R1",
    docsUrl: "https://platform.deepseek.com/api_keys",
    iconBg: "bg-[#4D6BFE]",
    iconColor: "text-white",
    Icon: DeepSeekIcon,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    placeholder: "sk-ant-...",
    description: "Claude 3.5 Sonnet, Claude 3 Opus",
    docsUrl: "https://console.anthropic.com/settings/keys",
    iconBg: "bg-[#CC785C]",
    iconColor: "text-white",
    Icon: AnthropicIcon,
  },
  {
    id: "custom",
    name: "Custom Provider",
    placeholder: "sk-...",
    description: "Any OpenAI-compatible API endpoint",
    docsUrl: "#",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
    iconColor: "text-white",
    Icon: CustomProviderIcon,
  },
];

const MODEL_OPTIONS = [
  { value: "gpt-4o-mini",                 label: "GPT-4o mini",           provider: "OpenAI" },
  { value: "gpt-4o",                      label: "GPT-4o",                provider: "OpenAI" },
  { value: "o3-mini",                     label: "o3-mini",               provider: "OpenAI" },
  { value: "deepseek-chat",               label: "DeepSeek-V3",           provider: "DeepSeek" },
  { value: "deepseek-reasoner",           label: "DeepSeek-R1",           provider: "DeepSeek" },
  { value: "claude-3-5-sonnet-20241022",  label: "Claude 3.5 Sonnet",     provider: "Anthropic" },
  { value: "claude-3-opus-20240229",      label: "Claude 3 Opus",         provider: "Anthropic" },
  { value: "qwen-plus",                   label: "Qwen Plus",             provider: "Alibaba" },
  { value: "qwen-max",                    label: "Qwen Max",              provider: "Alibaba" },
];

// ─── Tab system ───────────────────────────────────────────────────────────────

type TabId = "connection" | "providers" | "defaults";

const TABS: { id: TabId; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: "connection", label: "Connection",    Icon: ServerIcon  },
  { id: "providers",  label: "API Keys",      Icon: KeyIcon     },
  { id: "defaults",   label: "Defaults",      Icon: SlidersIcon },
];

// ─── Provider key row ────────────────────────────────────────────────────────

function ProviderRow({
  provider,
  value,
  onChange,
}: {
  provider: ProviderDef;
  value: string;
  onChange: (val: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const hasKey = value.length > 0;
  const { Icon, iconBg, iconColor, name, placeholder, description, docsUrl } = provider;

  return (
    <div className={cn(
      "group relative rounded-xl border transition-all duration-200",
      hasKey
        ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
        : "border-border bg-background hover:border-muted-foreground/30 hover:bg-muted/30"
    )}>
      <div className="flex items-center gap-4 p-4">
        {/* Brand icon */}
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
          iconBg
        )}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{name}</span>
            {hasKey && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
        </div>

        {/* Get key link */}
        {docsUrl !== "#" && (
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden group-hover:flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Get key
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72z"/>
              <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5z"/>
            </svg>
          </a>
        )}
      </div>

      {/* Key input */}
      <div className="border-t border-border/60 px-4 pb-4 pt-3">
        <div className="relative">
          <Input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            className="pr-10 font-mono text-xs h-9"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {visible ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { settings, saveSettings } = useSettingsStore();
  const [draft, setDraft] = useState<AppSettings>({ ...settings });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("connection");
  const conn = useConnectionTest();

  function updateDraft<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function updateKey(id: keyof AppSettings["apiKeys"], value: string) {
    setDraft((prev) => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [id]: value },
    }));
    setSaved(false);
  }

  function handleSave() {
    saveSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const connectedCount = Object.values(draft.apiKeys).filter(Boolean).length;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <a href="/tasks" className="hover:text-foreground transition-colors">Tasks</a>
        <span>/</span>
        <span className="text-foreground font-medium">Settings</span>
      </div>
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your backend and model providers.
          </p>
        </div>

        {/* Connected providers pill */}
        {connectedCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {connectedCount} provider{connectedCount > 1 ? "s" : ""} configured
          </div>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 border border-border/60">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
              activeTab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Connection ────────────────────────────────────────────────── */}
      {activeTab === "connection" && (
        <Card className="border-border/80">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <ServerIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base">API Connection</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Your R U Socrates FastAPI backend URL.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Backend URL</label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={draft.apiUrl}
                  onChange={(e) => updateDraft("apiUrl", e.target.value)}
                  placeholder="http://localhost:8000"
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={conn.status === "testing"}
                  onClick={() => conn.test(draft.apiUrl)}
                  className="shrink-0 gap-1.5"
                >
                  {conn.status === "testing" ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Testing
                    </>
                  ) : "Test Connection"}
                </Button>
              </div>

              {/* Connection status */}
              {conn.status !== "idle" && (
                <div className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
                  conn.status === "ok"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400"
                    : conn.status === "fail"
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400"
                    : "border-border bg-muted/50 text-muted-foreground"
                )}>
                  {conn.status === "ok" && (
                    <>
                      <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                      </svg>
                      Connected — {conn.latency}ms
                    </>
                  )}
                  {conn.status === "fail" && (
                    <>
                      <svg className="h-3.5 w-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                      </svg>
                      Failed — {conn.error}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Health endpoint hint */}
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/60">Endpoint tested:</span>{" "}
              <code className="font-mono">{draft.apiUrl.replace(/\/$/, "")}/health</code>
              <p className="mt-1">
                Your FastAPI server should return{" "}
                <code className="font-mono bg-muted px-1 rounded">{"{ status: \"ok\" }"}</code>
                {" "}at this path.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tab: API Keys ──────────────────────────────────────────────────── */}
      {activeTab === "providers" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400">
            <div className="flex items-start gap-2">
              <svg className="h-3.5 w-3.5 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              <span>
                Keys are stored in your browser&apos;s localStorage and sent <strong>only</strong> to your own backend — never to third-party servers.
              </span>
            </div>
          </div>

          {PROVIDERS.map((provider) => (
            <ProviderRow
              key={provider.id}
              provider={provider}
              value={draft.apiKeys[provider.id]}
              onChange={(val) => updateKey(provider.id, val)}
            />
          ))}

          {/* Custom provider URL — shown when custom key is set */}
          {draft.apiKeys.custom && (
            <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
              <label className="text-sm font-medium text-violet-900 dark:text-violet-300">
                Custom Provider Base URL
              </label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                OpenAI-compatible endpoint (e.g. Ollama, LM Studio, vLLM)
              </p>
              <Input
                type="url"
                value={draft.customProviderUrl}
                onChange={(e) => updateDraft("customProviderUrl", e.target.value)}
                placeholder="https://api.example.com/v1"
                className="font-mono text-xs"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Defaults ─────────────────────────────────────────────────── */}
      {activeTab === "defaults" && (
        <Card className="border-border/80">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <SlidersIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-base">Task Defaults</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Applied to every new research task.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default model */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Model</label>
              <p className="text-xs text-muted-foreground">
                The LLM forwarded to LiteLLM for each task.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {MODEL_OPTIONS.map((m) => (
                  <label
                    key={m.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-150",
                      draft.defaultModel === m.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                    )}
                  >
                    <input
                      type="radio"
                      name="defaultModel"
                      value={m.value}
                      checked={draft.defaultModel === m.value}
                      onChange={() => updateDraft("defaultModel", m.value)}
                      className="h-4 w-4 accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{m.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{m.provider}</span>
                    </div>
                    <code className="text-[10px] font-mono text-muted-foreground truncate">
                      {m.value}
                    </code>
                  </label>
                ))}
              </div>
            </div>

            {/* Max iterations */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Iterations per Task</label>
              <p className="text-xs text-muted-foreground">
                Higher values = deeper research, longer runtimes. Range: 1–100.
              </p>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={draft.maxIterations}
                  onChange={(e) =>
                    updateDraft("maxIterations", Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))
                  }
                  min={1}
                  max={100}
                  className="w-24 text-center font-mono"
                />
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Quick (1–5)</span>
                    <span>Deep (50–100)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300"
                      style={{ width: `${(draft.maxIterations / 100) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Save bar ───────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-xl border border-border/80 bg-background/95 backdrop-blur px-4 py-3 shadow-sm">
        <p className="flex-1 text-xs text-muted-foreground">
          Changes are saved to your browser and apply immediately.
        </p>
        {saved && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
            </svg>
            Saved!
          </div>
        )}
        <Button onClick={handleSave} className="gap-2">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
          </svg>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
