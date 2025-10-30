// Utils, constantes et stockage local + client Supabase (global)
const CURRENCIES = [
  { code: "EGP", symbol: "£" },
  { code: "EUR", symbol: "€" },
  { code: "USD", symbol: "$" },
];

const WEEKDAYS_FR = [
  { key: 1, label: "Lun" },
  { key: 2, label: "Mar" },
  { key: 3, label: "Mer" },
  { key: 4, label: "Jeu" },
  { key: 5, label: "Ven" },
  { key: 6, label: "Sam" },
  { key: 0, label: "Dim" },
];

function classNames(...arr) { return arr.filter(Boolean).join(" "); }

function formatMoney(value, currency = "EUR") {
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value) || 0);
  } catch (e) {
    const sym = CURRENCIES.find((c) => c.code === currency)?.symbol || "";
    return `${sym}${(Number(value) || 0).toFixed(2)}`;
  }
}

const LS_KEY_ACTIVITIES = "hd_activities_v1";
const LS_KEY_SETTINGS = "hd_settings_v1";
const SUPA_TABLE_ACTIVITIES = "activities";

function useLocalState(key, initial) {
  const { useEffect, useState } = React;
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

function createSupabaseClient(url, anonKey) {
  try {
    if (!url || !anonKey) return null;
    if (!window.supabase) return null;
    return window.supabase.createClient(url, anonKey);
  } catch {
    return null;
  }
}

const exampleActivities = [
  { id: (crypto?.randomUUID?.() || String(Math.random())).toString(), name: "Safari Quad (3h)", price: 900, currency: "EGP", days: [1,3,5], notes: "Transfert inclus" },
  { id: (crypto?.randomUUID?.() || String(Math.random())).toString(), name: "Plongée – Bateau (2 plongées)", price: 2500, currency: "EGP", days: [2,4,6], notes: "Équipement en option" },
  { id: (crypto?.randomUUID?.() || String(Math.random())).toString(), name: "Île Giftun – Snorkeling", price: 1800, currency: "EGP", days: [0,2,5], notes: "Déjeuner inclus" },
];


