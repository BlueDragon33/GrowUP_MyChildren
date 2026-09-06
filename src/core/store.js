const STORAGE_KEY = 'growup_mychildren_v1';

export function blankState() {
  return {
    version: 1,
    family: { name: 'Gia đình của tôi' },
    children: [],
    selectedChildId: null,
    settings: { compact: false }
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !Array.isArray(parsed.children)) return blankState();
    return { ...blankState(), ...parsed };
  } catch {
    return blankState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportState(state) {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}

export function validateImportedState(input) {
  const parsed = typeof input === 'string' ? JSON.parse(input) : input;
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.children)) {
    throw new Error('Tệp dữ liệu không đúng định dạng GrowUP v1.');
  }
  return { ...blankState(), ...parsed };
}
