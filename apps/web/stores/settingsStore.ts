/**
 * settingsStore — Persistent app settings for R U Socrates.
 *
 * Stores user-configurable settings in localStorage under the key
 * "rus-settings". Settings are read on mount and persisted on every
 * write — no manual save required (though the UI batches saves for UX).
 *
 * API Keys are stored locally only. They are never sent to a third-party
 * server; they go directly to the user's own backend (services/api).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiKeyMap {
  openai: string;
  deepseek: string;
  anthropic: string;
  /** Custom OpenAI-compatible provider key */
  custom: string;
}

export interface AppSettings {
  /** FastAPI backend base URL — no trailing slash */
  apiUrl: string;
  /** Default LLM model string forwarded to LiteLLM */
  defaultModel: string;
  /** Default max_iterations for new tasks */
  maxIterations: number;
  /** LLM provider API keys (stored locally, sent to own backend only) */
  apiKeys: ApiKeyMap;
  /** Custom OpenAI-compatible provider base URL */
  customProviderUrl: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  defaultModel: "gpt-4o-mini",
  maxIterations: 10,
  apiKeys: {
    openai: "",
    deepseek: "",
    anthropic: "",
    custom: "",
  },
  customProviderUrl: "",
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface SettingsStore {
  settings: AppSettings;
  /** Overwrite the full settings object */
  saveSettings: (next: AppSettings) => void;
  /** Patch a single top-level field */
  patchSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  /** Reset to defaults */
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      saveSettings: (next) => set({ settings: next }),

      patchSetting: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "rus-settings",
      // Only persist settings, not actions
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

// ─── Selectors ────────────────────────────────────────────────────────────────

/** Get the current API base URL — safe in both SSR and client contexts. */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    return useSettingsStore.getState().settings.apiUrl;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}
