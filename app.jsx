const { useEffect, useMemo, useState } = React;

// ---------------------------------------------
// Mini site interne – Hurghada Dream
// Pages : Devis | Activités | Disponibilités | Tarifs
// Données locales (localStorage). Beau & simple avec Tailwind.
// ---------------------------------------------

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

function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
}

function formatMoney(value, currency = "EUR") {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  } catch (e) {
    const sym = CURRENCIES.find((c) => c.code === currency)?.symbol || "";
    return `${sym}${(Number(value) || 0).toFixed(2)}`;
  }
}

const LS_KEY_ACTIVITIES = "hd_activities_v1";
const LS_KEY_SETTINGS = "hd_settings_v1";

const exampleActivities = [
  {
    id: (crypto?.randomUUID?.() || String(Math.random())).toString(),
    name: "Safari Quad (3h)",
    price: 900,
    currency: "EUR",
    days: [1, 3, 5],
    notes: "Transfert inclus",
  },
  {
    id: (crypto?.randomUUID?.() || String(Math.random())).toString(),
    name: "Plongée – Bateau (2 plongées)",
    price: 2500,
    currency: "EUR",
    days: [2, 4, 6],
    notes: "Équipement en option",
  },
  {
    id: (crypto?.randomUUID?.() || String(Math.random())).toString(),
    name: "Île Giftun – Snorkeling",
    price: 1800,
    currency: "EUR",
    days: [0, 2, 5],
    notes: "Déjeuner inclus",
  },
];

function useLocalState(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

const SUPA_TABLE_ACTIVITIES = "activities";

function createSupabaseClient(url, anonKey) {
  try {
    if (!url || !anonKey) return null;
    if (!window.supabase) return null;
    return window.supabase.createClient(url, anonKey);
  } catch {
    return null;
  }
}

function App() {
  const [tab, setTab] = useState("devis");
  const [activities, setActivities] = useLocalState(LS_KEY_ACTIVITIES, exampleActivities);
  const [settings, setSettings] = useLocalState(LS_KEY_SETTINGS, {
    agencyName: "Hurghada Dream",
    phone: "+20 …",
    address: "Hurghada, Red Sea, Égypte",
    currency: "EUR",
    theme: "ocean", // ocean | sunset | emerald
    supabaseUrl: "https://lttzfsxlgsvwpeapvypf.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0dHpmc3hsZ3N2d3BlYXB2eXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjMwNDMsImV4cCI6MjA3NzM5OTA0M30.PPFsKpsX3_N_syS9bhgNN94X39Y4mmB-YigbaDPo2Uk",
  });

  const supa = React.useMemo(() => createSupabaseClient(settings.supabaseUrl, settings.supabaseAnonKey), [settings.supabaseUrl, settings.supabaseAnonKey]);

  useEffect(() => {
    // apply theme from settings
    document.documentElement.setAttribute("data-theme", settings.theme || "ocean");
  }, [settings.theme]);

  useEffect(() => {
    // si Supabase est configuré, charger puis rafraîchir toutes les 3s
    let cancelled = false;
    let timer = null;
    async function load() {
      if (!supa) return;
      const { data, error } = await supa
        .from(SUPA_TABLE_ACTIVITIES)
        .select("id, name, price, currency, days, notes")
        .order("name", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.warn("Supabase load error", error);
        return;
      }
      if (Array.isArray(data)) {
        const list = data.map((a) => ({
          id: String(a.id),
          name: a.name || "",
          price: Number(a.price) || 0,
          currency: a.currency || settings.currency || "EGP",
          days: Array.isArray(a.days) ? a.days.map((n) => Number(n)) : [],
          notes: a.notes || "",
        }));
        setActivities((prev) => {
          const same = JSON.stringify(prev) === JSON.stringify(list);
          return same ? prev : list;
        });
      }
    }
    // premier chargement
    load();
    // polling 3s
    if (supa) {
      timer = setInterval(load, 3000);
    }
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [supa]);

  return (
    <div className="min-h-screen">
      <Header settings={settings} setSettings={setSettings} />

      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 flex gap-2 sm:gap-4 py-2 overflow-x-auto">
          <TabButton active={tab === "devis"} onClick={() => setTab("devis")}>
            Devis
          </TabButton>
          <TabButton active={tab === "activities"} onClick={() => setTab("activities")}>
            Activités
          </TabButton>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {tab === "devis" && (
          <QuotePage
            activities={activities}
            currency={settings.currency}
            agencyName={settings.agencyName}
            phone={settings.phone}
            address={settings.address}
            theme={settings.theme}
          />
        )}
        {tab === "activities" && (
          <ActivitiesPage
            activities={activities}
            setActivities={setActivities}
            defaultCurrency={settings.currency}
            supa={supa}
          />
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 pb-10 pt-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {settings.agencyName} — Mini site interne.
      </footer>
    </div>
  );
}

// Header: fourni par components/Header.jsx

function TabButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "btn btn-sm whitespace-nowrap",
        active ? "btn-primary" : "btn-ghost"
      )}
    >
      {children}
    </button>
  );
}

// TextField: fourni par components/Header.jsx

// ActivitiesPage: fourni par components/ActivitiesPage.jsx

// QuotePage: fourni par components/QuotePage.jsx

// ActivityPicker: fourni par components/QuotePage.jsx

// DayAvailability: retiré

// renderTextQuote: fourni par components/QuotePage.jsx

// Mount
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
