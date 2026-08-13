"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import {
  getBooted,
  getEffects,
  getServerBooted,
  getServerEffects,
  setBooted,
  setEffects,
  subscribe,
} from "@/components/system/system-store";

/**
 * Global interface state: boot status, the effects switch, and developer mode.
 *
 * `motionEnabled` is the single flag every animated component reads. It is
 * false when the OS asks for reduced motion OR when the visitor turns effects
 * off from the command palette — so there is exactly one thing to check, and no
 * component can accidentally ignore the accessibility setting.
 */

interface SystemState {
  booted: boolean;
  completeBoot: () => void;
  replayBoot: () => void;

  effects: boolean;
  toggleEffects: () => void;

  reducedMotion: boolean;
  /** effects && !reducedMotion — gate every animation on this. */
  motionEnabled: boolean;

  /** Konami-code easter egg: a small telemetry read-out. */
  devMode: boolean;
  toggleDevMode: () => void;

  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
}

const SystemContext = createContext<SystemState | null>(null);

export function SystemProvider({ children }: { children: ReactNode }) {
  const booted = useSyncExternalStore(subscribe, getBooted, getServerBooted);
  const effects = useSyncExternalStore(subscribe, getEffects, getServerEffects);
  const reducedMotion = usePrefersReducedMotion();

  const [devMode, setDevMode] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const completeBoot = useCallback(() => setBooted(true), []);
  const replayBoot = useCallback(() => setBooted(false), []);
  const toggleEffects = useCallback(() => setEffects(!getEffects()), []);
  const toggleDevMode = useCallback(() => setDevMode((d) => !d), []);

  const value = useMemo<SystemState>(
    () => ({
      booted,
      completeBoot,
      replayBoot,
      effects,
      toggleEffects,
      reducedMotion,
      motionEnabled: effects && !reducedMotion,
      devMode,
      toggleDevMode,
      paletteOpen,
      setPaletteOpen,
    }),
    [
      booted,
      completeBoot,
      replayBoot,
      effects,
      toggleEffects,
      reducedMotion,
      devMode,
      toggleDevMode,
      paletteOpen,
    ],
  );

  return (
    <SystemContext.Provider value={value}>{children}</SystemContext.Provider>
  );
}

export function useSystem(): SystemState {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error("useSystem must be used inside <SystemProvider>");
  }
  return context;
}

export { systemBootstrapScript } from "@/components/system/system-store";
