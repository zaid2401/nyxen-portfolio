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
  getPowered,
  getServerBooted,
  getServerEffects,
  getServerPowered,
  setBooted,
  setEffects,
  setPowered,
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
  /** False until the visitor presses the power button. */
  powered: boolean;
  powerOn: () => void;

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

  /** Hidden archive, unlocked from the terminal. */
  archiveOpen: boolean;
  setArchiveOpen: (open: boolean) => void;
}

const SystemContext = createContext<SystemState | null>(null);

export function SystemProvider({ children }: { children: ReactNode }) {
  const powered = useSyncExternalStore(subscribe, getPowered, getServerPowered);
  const booted = useSyncExternalStore(subscribe, getBooted, getServerBooted);
  const effects = useSyncExternalStore(subscribe, getEffects, getServerEffects);
  const reducedMotion = usePrefersReducedMotion();

  const [devMode, setDevMode] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const powerOn = useCallback(() => setPowered(true), []);
  const completeBoot = useCallback(() => setBooted(true), []);
  /** Replays the whole start-up, power screen included. */
  const replayBoot = useCallback(() => {
    setBooted(false);
    setPowered(false);
  }, []);
  const toggleEffects = useCallback(() => setEffects(!getEffects()), []);
  const toggleDevMode = useCallback(() => setDevMode((d) => !d), []);

  const value = useMemo<SystemState>(
    () => ({
      powered,
      powerOn,
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
      archiveOpen,
      setArchiveOpen,
    }),
    [
      powered,
      powerOn,
      booted,
      completeBoot,
      replayBoot,
      effects,
      toggleEffects,
      reducedMotion,
      devMode,
      toggleDevMode,
      paletteOpen,
      archiveOpen,
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
