const { useState } = React;

function ActivityPicker({ activities, onPick }) {
  return (
    <div className="flex gap-2">
      <div className="relative">
        <select className="border rounded-theme px-3 py-2 min-w-56" onChange={(e) => { const id = e.target.value; const act = activities.find((x) => x.id === id); if (act) onPick(act); e.target.selectedIndex = 0; }}>
          <option value="">Choisir…</option>
          {activities.map((a) => <option key={a.id} value={a.id}>{a.name} — {formatMoney(a.price, a.currency)}</option>)}
        </select>
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
        { id: (crypto?.randomUUID?.() || String(Math.random())).toString(), activityId: activity.id, name: activity.name, unitPrice: activity.price, qty: 1, currency: activity.currency || currency },
      ],
    }));
  }

  function printQuote() { window.print(); }

  return (
    <div className="print:block">
      <div className="bg-base-100 rounded-theme-2x border p-4 sm:p-6 shadow-theme print:shadow-none print:border-0">
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
            <input type="date" className="input input-bordered w-full" value={q.date} onChange={(e) => setQ((s) => ({ ...s, date: e.target.value }))} />
          </div>
        </div>

        <div className="rounded-theme border p-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Ajouter une activité</label>
              <ActivityPicker activities={activities} onPick={(a) => addItem(a)} />
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
                      <input type="number" min={1} className="w-20 border rounded-theme px-2 py-1" value={it.qty} onChange={(e) => { const qty = Number(e.target.value) || 1; setQ((s) => ({ ...s, items: s.items.map((x) => (x.id === it.id ? { ...x, qty } : x)) })); }} />
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatMoney(it.unitPrice * it.qty, it.currency)}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => setQ((s) => ({ ...s, items: s.items.filter((x) => x.id !== it.id) }))} className="px-3 py-1.5 rounded-theme border bg-rose-50 text-rose-700">Retirer</button>
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
              <div className="flex items-center justify-between font-semibold text-base mt-1">
                <span>Total</span>
                <span>{formatMoney(totalAfter, q.items[0]?.currency || currency)}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={printQuote} className="btn btn-primary">Imprimer le devis</button>
                <button onClick={() => navigator.clipboard.writeText(renderTextQuote(q, agencyName, phone, address))} className="btn btn-outline">Copier en texte</button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  q.items.forEach((it) => { lines.push(`- ${it.name} x${it.qty} = ${formatMoney(it.unitPrice * it.qty, it.currency)}`); });
  const total = q.items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
  const totalAfter = Math.max(0, total * (1 - (Number(q.discount) || 0) / 100));
  lines.push("");
  lines.push(`Sous-total: ${formatMoney(total, q.items[0]?.currency || "EUR")}`);
  lines.push(`Remise: ${q.discount || 0}%`);
  lines.push(`Total: ${formatMoney(totalAfter, q.items[0]?.currency || "EUR")}`);
  if (q.notes) { lines.push(""); lines.push(`Notes: ${q.notes}`); }
  return lines.join("\n");
}


