const KEY = 'gabaysenyas.completed';

/** Completed letters are stored in the browser for now. Swap for Firebase/Supabase later. */
export function loadCompleted(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveCompleted(letters: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(letters));
  } catch {
    /* storage blocked: progress just will not persist */
  }
}
