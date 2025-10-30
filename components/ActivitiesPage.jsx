const { useState } = React;

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
      <div className="lg:col-span-1 bg-base-100 rounded-theme-2x border p-4 sm:p-6 shadow-theme">
        <h2 className="text-lg font-semibold mb-4">{editingId ? "Modifier l'activité" : "Nouvelle activité"}</h2>
        <div className="space-y-3">
          <TextField label="Nom" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Ex: Safari Quad (3h)" />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Prix" type="number" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: Number(v) }))} />
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Devise</label>
              <select className="select select-bordered w-full" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
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
            <textarea className="textarea textarea-bordered w-full min-h-[80px]" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Transfert inclus, boisson, etc." />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={save} disabled={busy} className="btn btn-primary">{editingId ? "Mettre à jour" : "Ajouter"}</button>
          <button onClick={reset} disabled={busy} className="btn btn-outline">Réinitialiser</button>
        </div>
        {supa ? <p className="text-xs text-slate-500 mt-2">Synchro: Supabase activé</p> : <p className="text-xs text-slate-500 mt-2">Synchro: local uniquement</p>}
      </div>

      <div className="lg:col-span-2 bg-base-100 rounded-theme-2x border p-4 sm:p-6 shadow-theme">
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
                        <button onClick={() => { setEditingId(a.id); setForm({ ...a }); }} className="btn btn-sm">Modifier</button>
                        <button onClick={() => removeItem(a.id)} disabled={busy} className="btn btn-sm btn-error btn-outline">Supprimer</button>
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


