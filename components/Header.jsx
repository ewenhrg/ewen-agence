const { useEffect, useState } = React;

function TextField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>}
      <input
        type={type}
        className="input input-bordered w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Header({ settings, setSettings }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(settings);
  useEffect(() => setDraft(settings), [settings]);

  return (
    <header className="bg-base-200 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{settings.agencyName}</h1>
          <p className="text-sm text-slate-600">Outil interne : devis et activités</p>
        </div>
      </div>
    </header>
  );
}


