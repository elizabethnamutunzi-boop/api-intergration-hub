export const THEME_STORAGE_KEY = "pulseboard.theme.v1";

export type Theme = "light" | "dark";

type Listener = () => void;

const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeTheme(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function readTheme(): Theme {
  if (!canUseStorage()) {
    return "dark";
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function getServerTheme(): Theme {
  return "dark";
}

export function applyTheme(theme: Theme): void {
  if (!canUseStorage()) {
    return;
  }

  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function persistTheme(theme: Theme): void {
  if (canUseStorage()) {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
  applyTheme(theme);
  emit();
}

export function toggleTheme(current: Theme): Theme {
  const next: Theme = current === "dark" ? "light" : "dark";
  persistTheme(next);
  return next;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === THEME_STORAGE_KEY) {
      applyTheme(readTheme());
      emit();
    }
  });
}
