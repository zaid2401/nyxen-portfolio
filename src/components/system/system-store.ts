"use client";

/**
 * Boot + effects state, stored on `<html>` rather than in React.
 *
 * The DOM is the source of truth here on purpose:
 *
 *  • CSS already reads these (`[data-booted="1"] #boot-overlay { display:none }`),
 *    so keeping a second copy in React state would mean two things to keep in
 *    sync and one of them would eventually be wrong.
 *  • The inline bootstrap script sets them before first paint, which is what
 *    stops the boot overlay flashing for a returning visitor.
 *
 * React subscribes with `useSyncExternalStore`, which is the supported way to
 * read a value that legitimately differs between the server render and the
 * client — no hydration warning, no setState-in-an-effect.
 */

export const STORAGE_KEYS = {
  effects: "nyxen:effects",
  booted: "nyxen:booted",
} as const;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getBooted(): boolean {
  return document.documentElement.dataset.booted === "1";
}

/**
 * Power state is deliberately NOT persisted.
 *
 * Every page load starts at the power screen, including a reload. That is the
 * point of the metaphor — a machine you reboot comes back off — and it is the
 * one piece of start-up state that should not be remembered. `booted` still
 * persists for the session, so pressing power a second time goes straight
 * through rather than replaying the whole boot animation.
 */
export function getPowered(): boolean {
  return document.documentElement.dataset.powered === "1";
}

export function getEffects(): boolean {
  return document.documentElement.dataset.effects !== "off";
}

/** Server snapshots. The overlays render, effects are on — then the client corrects. */
export const getServerBooted = () => false;
export const getServerPowered = () => false;
export const getServerEffects = () => true;

export function setBooted(value: boolean): void {
  document.documentElement.dataset.booted = value ? "1" : "0";
  try {
    if (value) sessionStorage.setItem(STORAGE_KEYS.booted, "1");
    else sessionStorage.removeItem(STORAGE_KEYS.booted);
  } catch {
    // Private mode or storage disabled — the sequence simply replays.
  }
  emit();
}

export function setPowered(value: boolean): void {
  // Written to the DOM only. Nothing touches storage, so a reload resets it.
  document.documentElement.dataset.powered = value ? "1" : "0";
  emit();
}

export function setEffects(value: boolean): void {
  document.documentElement.dataset.effects = value ? "on" : "off";
  try {
    localStorage.setItem(STORAGE_KEYS.effects, value ? "on" : "off");
  } catch {
    /* ignore */
  }
  emit();
}

/**
 * Runs before hydration so the boot overlay and the effects preference are
 * already correct on the very first paint. Deliberately tiny and
 * dependency-free — it is inlined into the document head.
 */
export const systemBootstrapScript = `(function(){try{
var r=document.documentElement;
r.dataset.powered="0";
r.dataset.booted=sessionStorage.getItem("${STORAGE_KEYS.booted}")==="1"?"1":"0";
r.dataset.effects=localStorage.getItem("${STORAGE_KEYS.effects}")==="off"?"off":"on";
}catch(e){var d=document.documentElement;d.dataset.powered="0";d.dataset.booted="0";d.dataset.effects="on";}})();`;
