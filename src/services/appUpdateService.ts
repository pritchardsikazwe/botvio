/**
 * Botvio PWA — version-aware automatic update service.
 *
 * Responsibilities:
 *  - fetch /version.json (never cached)
 *  - compare the deployed version with the running build
 *  - ask the service worker to update and activate
 *  - reload exactly once per detected version (no refresh loops)
 *  - never reload while a critical trading / payment operation is running
 *  - never touch localStorage, IndexedDB, auth tokens or user settings
 */

export const APP_VERSION: string =
  (typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev") || "dev";

const APPLIED_VERSION_KEY = "botvio_last_applied_version";
const RELOAD_GUARD_KEY = "botvio_update_reloaded_for";
const CHECK_THROTTLE_MS = 5 * 60 * 1000; // at most one network check every 5 minutes

export interface RemoteVersion {
  version: string;
  build?: string;
  updatedAt?: string;
}

export interface UpdateState {
  currentVersion: string;
  remoteVersion: string | null;
  updateReady: boolean;
  lastCheckedAt: number | null;
  lastError: string | null;
  serviceWorkerVersion: string | null;
}

let lastCheckAt = 0;
let checking = false;
let pendingReload = false;
let criticalOperations = 0;
let pendingActivator: (() => void) | null = null;

const state: UpdateState = {
  currentVersion: APP_VERSION,
  remoteVersion: null,
  updateReady: false,
  lastCheckedAt: null,
  lastError: null,
  serviceWorkerVersion: null,
};

type Listener = (s: UpdateState) => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => {
    try {
      l({ ...state });
    } catch {
      /* ignore listener errors */
    }
  });
}

export function subscribeToUpdateState(listener: Listener): () => void {
  listeners.add(listener);
  listener({ ...state });
  return () => listeners.delete(listener);
}

export function getUpdateState(): UpdateState {
  return { ...state };
}

export function getCurrentVersion(): string {
  return APP_VERSION;
}

export function isProductionRuntime(): boolean {
  if (!import.meta.env.PROD) return false;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return false;
  return true;
}

/* ── Trading / transaction safety ─────────────────────────────── */

/** Mark the start of an operation that must not be interrupted by a reload. */
export function beginCriticalOperation(): () => void {
  criticalOperations += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    endCriticalOperation();
  };
}

export function endCriticalOperation() {
  criticalOperations = Math.max(0, criticalOperations - 1);
  if (criticalOperations === 0) {
    if (pendingActivator) {
      const activate = pendingActivator;
      pendingActivator = null;
      activate();
    } else if (pendingReload) {
      reloadAfterUpdate();
    }
  }
}

/**
 * Defer service-worker activation until the current critical operation ends.
 * Called by the registration hook when a waiting worker appears mid-trade.
 */
export function markUpdatePending(activate: () => void) {
  pendingActivator = activate;
  state.updateReady = true;
  emit();
}

export function isBusy(): boolean {
  if (criticalOperations > 0) return true;
  // A form currently being submitted / focused text entry also blocks reloads.
  const active = document.activeElement as HTMLElement | null;
  if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
    const el = active as HTMLInputElement;
    if (el.value && el.value.length > 0) return true;
  }
  return false;
}

/* ── Reload handling ──────────────────────────────────────────── */

function markApplied(version: string) {
  try {
    localStorage.setItem(APPLIED_VERSION_KEY, version);
  } catch {
    /* storage may be unavailable — non fatal */
  }
}

function alreadyReloadedFor(version: string): boolean {
  try {
    return sessionStorage.getItem(RELOAD_GUARD_KEY) === version;
  } catch {
    return false;
  }
}

function guardReloadFor(version: string) {
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, version);
  } catch {
    /* ignore */
  }
}

/**
 * Reload the app to pick up the freshly activated assets.
 * Auth tokens, settings and IndexedDB are untouched — this is a plain reload.
 */
export function reloadAfterUpdate() {
  const target = state.remoteVersion || "unknown";
  if (isBusy()) {
    pendingReload = true;
    state.updateReady = true;
    emit();
    return;
  }
  if (alreadyReloadedFor(target)) return;
  guardReloadFor(target);
  markApplied(target);
  pendingReload = false;
  window.location.reload();
}

/* ── Service worker ───────────────────────────────────────────── */

let controllerListenerAttached = false;

function attachControllerChangeListener() {
  if (controllerListenerAttached || !("serviceWorker" in navigator)) return;
  controllerListenerAttached = true;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    const w = window as unknown as { __BOTVIO_RELOADED__?: boolean };
    if (w.__BOTVIO_RELOADED__) return;
    w.__BOTVIO_RELOADED__ = true;
    reloadAfterUpdate();
  });
}

/** Ask the browser to re-check the service worker script and activate any waiting worker. */
export async function forceServiceWorkerUpdate(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    await registration.update();

    const waiting = registration.waiting;
    if (waiting) {
      // vite-plugin-pwa's generated worker honours SKIP_WAITING
      waiting.postMessage({ type: "SKIP_WAITING" });
      return true;
    }
    if (registration.installing) return true;
    return false;
  } catch {
    return false;
  }
}

/* ── Version check ────────────────────────────────────────────── */

export async function fetchRemoteVersion(): Promise<RemoteVersion | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as RemoteVersion;
    if (!json || typeof json.version !== "string") return null;
    return json;
  } catch {
    // Offline or unreachable — never break the app because of this.
    return null;
  }
}

/**
 * Full update cycle. Safe to call frequently — it throttles itself.
 * @param force skip the throttle (manual "check now" button)
 */
export async function checkForUpdates(force = false): Promise<UpdateState> {
  attachControllerChangeListener();

  if (checking) return { ...state };
  if (!force && Date.now() - lastCheckAt < CHECK_THROTTLE_MS) return { ...state };

  checking = true;
  lastCheckAt = Date.now();
  try {
    const remote = await fetchRemoteVersion();
    state.lastCheckedAt = Date.now();

    if (!remote) {
      state.lastError = "Update server unreachable";
      emit();
      return { ...state };
    }

    state.lastError = null;
    state.remoteVersion = remote.version;
    state.serviceWorkerVersion = (await getServiceWorkerVersion()) ?? state.serviceWorkerVersion;

    const isNewer =
      remote.version !== "dev" &&
      APP_VERSION !== "dev" &&
      remote.version !== APP_VERSION;

    if (!isNewer) {
      state.updateReady = false;
      emit();
      return { ...state };
    }

    state.updateReady = true;
    emit();

    if (!isProductionRuntime()) return { ...state };
    if (alreadyReloadedFor(remote.version)) return { ...state };

    // Pull the new service worker + assets, then refresh.
    await forceServiceWorkerUpdate();
    // controllerchange usually fires first; this is the fallback path
    // (e.g. no service worker controlling the page yet).
    setTimeout(() => reloadAfterUpdate(), 1200);
    return { ...state };
  } finally {
    checking = false;
  }
}

async function getServiceWorkerVersion(): Promise<string | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return null;
    if (reg.active) return APP_VERSION;
    return null;
  } catch {
    return null;
  }
}

/** True when the previous page load applied an update (used for the "Botvio updated" toast). */
export function consumeJustUpdatedFlag(): string | null {
  try {
    const applied = localStorage.getItem(APPLIED_VERSION_KEY);
    if (applied && applied === APP_VERSION) {
      localStorage.setItem(APPLIED_VERSION_KEY, `${APP_VERSION}:seen`);
      return applied;
    }
  } catch {
    /* ignore */
  }
  return null;
}

let initialised = false;

/** Wire up startup, focus and visibility driven update checks. */
export function initAppUpdates() {
  if (initialised) return;
  initialised = true;

  attachControllerChangeListener();

  // Startup check (after the app has had a moment to restore the session).
  setTimeout(() => void checkForUpdates(true), 2500);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void checkForUpdates();
  });
  window.addEventListener("focus", () => void checkForUpdates());
  window.addEventListener("online", () => void checkForUpdates());

  // Long-lived sessions: periodic background check.
  setInterval(() => void checkForUpdates(), 15 * 60 * 1000);
}