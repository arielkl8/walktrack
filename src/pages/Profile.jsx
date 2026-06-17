import { useState, useEffect } from 'react';
import { saveProfile } from '../utils/storage';

const DEFAULTS = { displayName: '', age: 30, gender: 'male', heightCm: 170, weightKg: 70 };

export default function Profile({ profile, userId, onSaved, onSignOut }) {
  const [form, setForm]   = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => { if (profile) setForm({ ...DEFAULTS, ...profile }); }, [profile]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({ ...form, createdAt: profile?.createdAt ?? new Date().toISOString() }, userId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved({ ...form });
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const isComplete = form.weightKg && form.heightCm && form.age && form.gender;

  return (
    <div className="flex flex-col h-full page-enter" style={{ background: '#070B14' }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-text-1">פרופיל</h1>
          <button onClick={onSignOut} className="btn-ghost rounded-xl px-3 py-2 text-xs font-semibold" style={{ color: '#FF4757' }}>
            התנתק
          </button>
        </div>
        {form.displayName && (
          <p className="text-text-2 text-sm mt-1">שלום, {form.displayName} 👋</p>
        )}
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-3">
        {!isComplete && (
          <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'rgba(255,159,67,0.1)', border: '1px solid rgba(255,159,67,0.25)', color: '#FF9F43' }}>
            ⚠️ ללא פרופיל שלם לא ניתן לחשב קלוריות
          </div>
        )}

        <Field label="שם תצוגה">
          <input type="text" value={form.displayName} onChange={(e) => set('displayName', e.target.value)} placeholder="השם שלך" className="input-dark" />
        </Field>

        <Field label="מגדר">
          <div className="grid grid-cols-2 gap-2">
            {[['male', 'זכר 👨'], ['female', 'נקבה 👩']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => set('gender', val)}
                className="py-3 rounded-xl text-sm font-semibold transition-all"
                style={form.gender === val
                  ? { background: 'linear-gradient(135deg,#4F94FF,#1D6FE8)', color: '#fff', boxShadow: '0 0 20px rgba(79,148,255,0.3)' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8' }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label={`גיל: ${form.age} שנים`}>
          <input type="range" min="10" max="99" value={form.age} onChange={(e) => set('age', Number(e.target.value))} className="range-dark" />
          <div className="flex justify-between text-xs mt-1" style={{ color: '#475569' }}><span>10</span><span>99</span></div>
        </Field>

        <Field label={`גובה: ${form.heightCm} ס"מ`}>
          <input type="range" min="100" max="220" value={form.heightCm} onChange={(e) => set('heightCm', Number(e.target.value))} className="range-dark" />
          <div className="flex justify-between text-xs mt-1" style={{ color: '#475569' }}><span>100</span><span>220</span></div>
        </Field>

        <Field label={`משקל: ${form.weightKg} ק"ג`}>
          <input type="range" min="30" max="200" value={form.weightKg} onChange={(e) => set('weightKg', Number(e.target.value))} className="range-dark" />
          <div className="flex justify-between text-xs mt-1" style={{ color: '#475569' }}><span>30</span><span>200</span></div>
        </Field>
      </div>

      {/* Save */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ minHeight: 56 }}
          className={`w-full rounded-2xl text-white font-black text-base transition-all ${saved ? 'btn-start' : 'btn-primary'} ${saving ? 'opacity-60' : ''}`}
        >
          {saving ? 'שומר...' : saved ? '✓ נשמר!' : 'שמור פרופיל'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="dark-card rounded-2xl p-4">
      <label className="block text-sm font-semibold mb-3" style={{ color: '#94A3B8' }}>{label}</label>
      {children}
    </div>
  );
}
