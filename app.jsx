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

function formatMoney(value, currency = "EGP") {
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
    currency: "EGP",
    days: [1, 3, 5],
    notes: "Transfert inclus",
  },
  {
    id: (crypto?.randomUUID?.() || String(Math.random())).toString(),
    name: "Plongée – Bateau (2 plongées)",
    price: 2500,
    currency: "EGP",
    days: [2, 4, 6],
    notes: "Équipement en option",
  },
  {
    id: (crypto?.randomUUID?.() || String(Math.random())).toString(),
    name: "Île Giftun – Snorkeling",
    price: 1800,
    currency: "EGP",
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
    currency: "EGP",
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
          <TabButton active={tab === "availability"} onClick={() => setTab("availability")}>
            Disponibilités
          </TabButton>
          <TabButton active={tab === "prices"} onClick={() => setTab("prices")}>
            Tarifs
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
        {tab === "availability" && <AvailabilityPage activities={activities} />}
        {tab === "prices" && <PricesPage activities={activities} currency={settings.currency} />}
      </main>

      <footer className="max-w-6xl mx-auto px-4 pb-10 pt-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {settings.agencyName} — Mini site interne.
      </footer>
    </div>
  );
}

function Header({ settings, setSettings }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(settings);
  useEffect(() => setDraft(settings), [settings]);

  return (
    <header className="bg-gradient-to-br from-brand-50 to-sky-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{settings.agencyName}</h1>
          <p className="text-sm text-slate-600">Outil interne : devis, activités, disponibilités, tarifs</p>
        </div>
        <button
          className="rounded-theme border px-3 py-2 text-sm bg-white hover:bg-slate-50 shadow-theme"
          onClick={() => setOpen(true)}
        >
          Paramètres
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-theme-2x w-full max-w-xl shadow-theme">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">Paramètres agence</h2>
              <button className="text-slate-500" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              <TextField label="Nom de l'agence" value={draft.agencyName} onChange={(v) => setDraft((d) => ({ ...d, agencyName: v }))} />
              <TextField label="Téléphone" value={draft.phone} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} />
              <TextField label="Adresse" value={draft.address} onChange={(v) => setDraft((d) => ({ ...d, address: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Devise par défaut</label>
                  <select className="w-full border rounded-theme px-3 py-2" value={draft.currency} onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))}>
                    {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Thème</label>
                  <select className="w-full border rounded-theme px-3 py-2" value={draft.theme} onChange={(e) => setDraft((d) => ({ ...d, theme: e.target.value }))}>
                    <option value="ocean">Ocean</option>
                    <option value="sunset">Sunset</option>
                    <option value="emerald">Emerald</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <TextField label="Supabase URL (optionnel)" value={draft.supabaseUrl || ""} onChange={(v) => setDraft((d) => ({ ...d, supabaseUrl: v }))} placeholder="https://xxx.supabase.co" />
                <TextField label="Supabase Anon Key (optionnel)" value={draft.supabaseAnonKey || ""} onChange={(v) => setDraft((d) => ({ ...d, supabaseAnonKey: v }))} placeholder="eyJhbGci…" />
              </div>
            </div>
            <div className="p-5 border-t bg-slate-50 flex justify-end gap-2 rounded-b-theme">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-theme border">Annuler</button>
              <button onClick={() => { setSettings(draft); setOpen(false); }} className="px-4 py-2 rounded-theme bg-sky-600 text-white">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function TabButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "px-4 py-2 rounded-theme text-sm whitespace-nowrap",
        active ? "bg-sky-600 text-white shadow-theme" : "bg-white border text-slate-700 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function TextField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>}
      <input
        type={type}
        className="w-full border rounded-theme px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function ActivitiesPage({ activities, setActivities, defaultCurrency, supa }) {
  const empty = { id: "", name: "", price: 0, currency: defaultCurrency, days: [], notes: "" };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setForm({ ...empty, currency: defaultCurrency });
    setEditingId(null);
  }

  async function save() {
    if (!form.name) return alert("Nom requis");
    if (!form.currency) return alert("Devise requise");
    setBusy(true);
    try {
      if (supa) {
        const row = editingId ? { ...form, id: editingId } : { ...form, id: (crypto?.randomUUID?.() || String(Math.random())).toString() };
        const { data, error } = await supa.from(SUPA_TABLE_ACTIVITIES).upsert({
          id: row.id,
          name: row.name,
          price: row.price,
          currency: row.currency,
          days: row.days,
          notes: row.notes,
        }).select("id, name, price, currency, days, notes").single();
        if (error) throw error;
        const saved = data || row;
        if (editingId) {
          setActivities((list) => list.map((a) => (a.id === editingId ? saved : a)));
        } else {
          setActivities((list) => [...list, saved]);
        }
      } else {
        if (editingId) {
          setActivities((list) => list.map((a) => (a.id === editingId ? { ...form, id: editingId } : a)));
        } else {
          setActivities((list) => [...list, { ...form, id: (crypto?.randomUUID?.() || String(Math.random())).toString() }]);
        }
      }
      reset();
    } catch (e) {
      alert("Erreur enregistrement: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(id) {
    if (!confirm("Supprimer cette activité ?")) return;
    setBusy(true);
    try {
      if (supa) {
        const { error } = await supa.from(SUPA_TABLE_ACTIVITIES).delete().eq("id", id);
        if (error) throw error;
      }
      setActivities((list) => list.filter((a) => a.id !== id));
      if (editingId === id) reset();
    } catch (e) {
      alert("Erreur suppression: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  function toggleDay(dayKey) {
    setForm((f) => {
      const has = f.days.includes(dayKey);
      const days = has ? f.days.filter((d) => d !== dayKey) : [...f.days, dayKey];
      return { ...f, days };
    });
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-white rounded-theme-2x border p-4 sm:p-6 shadow-theme">
        <h2 className="text-lg font-semibold mb-4">{editingId ? "Modifier l'activité" : "Nouvelle activité"}</h2>
        <div className="space-y-3">
          <TextField label="Nom" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Ex: Safari Quad (3h)" />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Prix" type="number" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: Number(v) }))} />
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Devise</label>
              <select className="w-full border rounded-theme px-3 py-2" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Jours disponibles</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS_FR.map((d) => (
                <button key={d.key} type="button" disabled={busy} onClick={() => toggleDay(d.key)} className={classNames("px-3 py-1.5 rounded-theme border text-sm", form.days.includes(d.key) ? "bg-sky-600 text-white" : "bg-white")}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optionnel)</label>
            <textarea className="w-full border rounded-theme px-3 py-2 min-h-[80px]" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Transfert inclus, boisson, etc." />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={save} disabled={busy} className="px-4 py-2 rounded-theme bg-sky-600 text-white">{editingId ? "Mettre à jour" : "Ajouter"}</button>
          <button onClick={reset} disabled={busy} className="px-4 py-2 rounded-theme border">Réinitialiser</button>
        </div>
        {supa ? <p className="text-xs text-slate-500 mt-2">Synchro: Supabase activé</p> : <p className="text-xs text-slate-500 mt-2">Synchro: local uniquement</p>}
      </div>

      <div className="lg:col-span-2 bg-white rounded-theme-2x border p-4 sm:p-6 shadow-theme">
        <h2 className="text-lg font-semibold mb-4">Liste des activités</h2>
        {activities.length === 0 ? (
          <p className="text-slate-600">Aucune activité pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="py-2 pr-3">Nom</th>
                  <th className="py-2 pr-3">Prix</th>
                  <th className="py-2 pr-3">Jours</th>
                  <th className="py-2 pr-3">Notes</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{a.name}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatMoney(a.price, a.currency)}</td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-1.5">
                        {WEEKDAYS_FR.filter((d) => a.days.includes(d.key)).map((d) => (
                          <span key={d.key} className="badge-day">{d.label}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-slate-600">{a.notes}</td>
                    <td className="py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingId(a.id); setForm({ ...a }); }} className="px-3 py-1.5 rounded-theme border">Modifier</button>
                        <button onClick={() => removeItem(a.id)} disabled={busy} className="px-3 py-1.5 rounded-theme border bg-rose-50 text-rose-700">Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AvailabilityPage({ activities }) {
  const byDay = useMemo(() => {
    const map = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const a of activities) for (const d of a.days) map[d].push(a);
    return map;
  }, [activities]);

  return (
    <div className="bg-white rounded-theme-2x border p-4 sm:p-6 shadow-theme">
      <h2 className="text-lg font-semibold mb-2">Activités disponibles par jour</h2>
      <p className="text-slate-600 text-sm mb-4">Vue rapide pour savoir quelles activités sont programmées chaque jour de la semaine.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {WEEKDAYS_FR.map((d) => (
          <div key={d.key} className="border rounded-theme p-4">
            <h3 className="font-semibold mb-2">{d.label}</h3>
            {byDay[d.key].length === 0 ? (
              <p className="text-slate-500 text-sm">Aucune activité.</p>
            ) : (
              <ul className="space-y-1">
                {byDay[d.key].map((a) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span>{a.name}</span>
                    <span className="text-slate-600 text-sm">{formatMoney(a.price, a.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PricesPage({ activities, currency }) {
  return (
    <div className="bg-white rounded-theme-2x border p-4 sm:p-6 shadow-theme">
      <h2 className="text-lg font-semibold mb-2">Tarifs des activités</h2>
      <p className="text-slate-600 text-sm mb-4">Liste simple des prix (lecture seule). Modifiez les prix dans l'onglet « Activités ».</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-600 border-b">
              <th className="py-2 pr-3">Activité</th>
              <th className="py-2 pr-3">Devise</th>
              <th className="py-2 pr-3">Prix</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="py-2 pr-3 font-medium">{a.name}</td>
                <td className="py-2 pr-3">{a.currency || currency}</td>
                <td className="py-2 pr-3">{formatMoney(a.price, a.currency || currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuotePage({ activities, currency, agencyName, phone, address }) {
  const initial = {
    date: new Date().toISOString().slice(0, 10),
    client: "",
    hotel: "",
    phone: "",
    notes: "",
    discount: 0,
    items: [],
  };
  const [q, setQ] = useState(initial);
  const total = q.items.reduce((sum, it) => sum + it.unitPrice * it.qty, 0);
  const totalAfter = Math.max(0, total * (1 - (Number(q.discount) || 0) / 100));

  function addItem(activity) {
    if (!activity) return;
    setQ((state) => ({
      ...state,
      items: [
        ...state.items,
        {
          id: (crypto?.randomUUID?.() || String(Math.random())).toString(),
          activityId: activity.id,
          name: activity.name,
          unitPrice: activity.price,
          qty: 1,
          currency: activity.currency || currency,
        },
      ],
    }));
  }

  function printQuote() {
    window.print();
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6 print:block">
      <div className="lg:col-span-2 bg-white rounded-theme-2x border p-4 sm:p-6 shadow-theme print:shadow-none print:border-0">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Devis</h2>
            <p className="text-slate-600 text-sm">{agencyName}</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <div>Date : {q.date}</div>
            <div>Tél : {phone}</div>
            <div className="max-w-[240px] ml-auto">{address}</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <TextField label="Nom du client" value={q.client} onChange={(v) => setQ((s) => ({ ...s, client: v }))} placeholder="Ex: Mme Martin" />
          <TextField label="Hôtel / Chambre" value={q.hotel} onChange={(v) => setQ((s) => ({ ...s, hotel: v }))} placeholder="Ex: Dana Beach – 1234" />
          <TextField label="Téléphone" value={q.phone} onChange={(v) => setQ((s) => ({ ...s, phone: v }))} />
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
            <input type="date" className="w-full border rounded-theme px-3 py-2" value={q.date} onChange={(e) => setQ((s) => ({ ...s, date: e.target.value }))} />
          </div>
        </div>

        <div className="rounded-theme border p-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Ajouter une activité</label>
              <ActivityPicker activities={activities} onPick={(a) => addItem(a)} />
            </div>
            <div className="sm:w-40">
              <label className="block text-xs font-medium text-slate-600 mb-1">Remise (%)</label>
              <input type="number" min={0} className="w-full border rounded-theme px-3 py-2" value={q.discount} onChange={(e) => setQ((s) => ({ ...s, discount: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="py-2 pr-3">Activité</th>
                  <th className="py-2 pr-3">PU</th>
                  <th className="py-2 pr-3">Qté</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {q.items.map((it) => (
                  <tr key={it.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{it.name}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatMoney(it.unitPrice, it.currency)}</td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={1}
                        className="w-20 border rounded-theme px-2 py-1"
                        value={it.qty}
                        onChange={(e) => {
                          const qty = Number(e.target.value) || 1;
                          setQ((s) => ({ ...s, items: s.items.map((x) => (x.id === it.id ? { ...x, qty } : x)) }));
                        }}
                      />
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatMoney(it.unitPrice * it.qty, it.currency)}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => setQ((s) => ({ ...s, items: s.items.filter((x) => x.id !== it.id) }))}
                        className="px-3 py-1.5 rounded-theme border bg-rose-50 text-rose-700"
                      >
                        Retirer
                      </button>
                    </td>
                  </tr>
                ))}
                {q.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-slate-500 text-center">Ajoutez des activités pour constituer le devis.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes (facultatif)</label>
              <textarea className="w-full border rounded-theme px-3 py-2 min-h-[80px]" value={q.notes} onChange={(e) => setQ((s) => ({ ...s, notes: e.target.value }))} placeholder="Ex: Paiement en espèces à la réception" />
            </div>
            <div className="border rounded-theme p-3 bg-slate-50">
              <div className="flex items-center justify-between text-sm">
                <span>Sous-total</span>
                <span>{formatMoney(total, q.items[0]?.currency || currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Remise</span>
                <span>{q.discount || 0}% ({formatMoney(total - totalAfter, q.items[0]?.currency || currency)})</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-base mt-1">
                <span>Total</span>
                <span>{formatMoney(totalAfter, q.items[0]?.currency || currency)}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={printQuote} className="px-4 py-2 rounded-theme bg-sky-600 text-white">Imprimer le devis</button>
                <button
                  onClick={() => navigator.clipboard.writeText(renderTextQuote(q, agencyName, phone, address))}
                  className="px-4 py-2 rounded-theme border"
                >
                  Copier en texte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="bg-white rounded-theme-2x border p-4 sm:p-6 shadow-theme h-fit print:hidden">
        <h3 className="font-semibold mb-3">Dispos le jour sélectionné</h3>
        <DayAvailability activities={activities} dateStr={q.date} />
      </aside>
    </div>
  );
}

function ActivityPicker({ activities, onPick }) {
  const [search, setSearch] = useState("");
  const filtered = activities.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex gap-2">
      <input className="flex-1 border rounded-theme px-3 py-2" placeholder="Rechercher une activité…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="relative">
        <select className="border rounded-theme px-3 py-2 min-w-56" onChange={(e) => { const id = e.target.value; const act = activities.find((x) => x.id === id); if (act) onPick(act); e.target.selectedIndex = 0; }}>
          <option value="">Choisir…</option>
          {filtered.map((a) => <option key={a.id} value={a.id}>{a.name} — {formatMoney(a.price, a.currency)}</option>)}
        </select>
      </div>
    </div>
  );
}

function DayAvailability({ activities, dateStr }) {
  const day = new Date(dateStr).getDay(); // 0=Dim … 6=Sam
  const list = activities.filter((a) => a.days.includes(day));
  return (
    <div>
      {list.length === 0 ? (
        <p className="text-slate-600 text-sm">Aucune activité pour ce jour.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((a) => (
            <li key={a.id} className="flex items-center justify-between">
              <span>{a.name}</span>
              <span className="text-slate-600 text-sm">{formatMoney(a.price, a.currency)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function renderTextQuote(q, agencyName, phone, address) {
  const lines = [];
  lines.push(`${agencyName}`);
  lines.push(`${address}`);
  lines.push(`Tél: ${phone}`);
  lines.push(`Date: ${q.date}`);
  lines.push("");
  lines.push(`Client: ${q.client}`);
  lines.push(`Hôtel: ${q.hotel}`);
  lines.push("");
  lines.push("Détail :");
  q.items.forEach((it) => {
    lines.push(`- ${it.name} x${it.qty} = ${formatMoney(it.unitPrice * it.qty, it.currency)}`);
  });
  const total = q.items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
  const totalAfter = Math.max(0, total * (1 - (Number(q.discount) || 0) / 100));
  lines.push("");
  lines.push(`Sous-total: ${formatMoney(total, q.items[0]?.currency || "EGP")}`);
  lines.push(`Remise: ${q.discount || 0}%`);
  lines.push(`Total: ${formatMoney(totalAfter, q.items[0]?.currency || "EGP")}`);
  if (q.notes) {
    lines.push("");
    lines.push(`Notes: ${q.notes}`);
  }
  return lines.join("\\n");
}

// Mount
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
