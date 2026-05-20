import type { AppSettings } from '../hooks/useSettings';

interface Props {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  onReset: () => void;
  onBack: () => void;
}

export default function SettingsPage({ settings, onUpdate, onReset, onBack }: Props) {
  return (
    <div className="min-h-screen bg-parchment p-4">
      <div className="mx-auto animate-fade-slide-in" style={{ maxWidth: 'var(--app-content-width, 32rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-[var(--c-heading)] tracking-wide">
            Paramètres
          </h2>
          <button
            onClick={onBack}
            className="font-display text-sm text-[var(--c-gold)] hover:text-[var(--c-gold-dark)] transition-colors"
          >
            ← Retour
          </button>
        </div>

        <div className="space-y-4">
          {/* ─── Theme ─── */}
          <Section title="APPARENCE" subtitle="主题">
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'light', label: 'Clair', icon: '☀', sub: '浅色' },
                { value: 'dark', label: 'Sombre', icon: '☾', sub: '深色' },
                { value: 'system', label: 'Système', icon: '⚙', sub: '跟随系统' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ theme: opt.value })}
                  className={`select-card p-3 text-center transition-all duration-300 ${
                    settings.theme === opt.value ? 'active' : ''
                  }`}
                >
                  <div className="text-xl mb-1">{opt.icon}</div>
                  <div className="font-display text-xs text-[var(--c-heading)]">{opt.label}</div>
                  <div className="font-body text-[10px] text-[var(--c-muted)] mt-0.5">{opt.sub}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* ─── Font Size ─── */}
          <Section title="TAILLE DU TEXTE" subtitle="字号大小">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-[var(--c-secondary)]">
                  {settings.fontSize}%
                </span>
                <div className="flex gap-2">
                  {[80, 90, 100, 110, 120, 130, 150].map(size => (
                    <button
                      key={size}
                      onClick={() => onUpdate({ fontSize: size })}
                      className={`px-2 py-1 text-xs font-display rounded-lg transition-all ${
                        settings.fontSize === size
                          ? 'bg-[var(--c-heading)] text-[var(--c-bg)]'
                          : 'text-[var(--c-muted)] hover:text-[var(--c-heading)] hover:bg-[color-mix(in_srgb,var(--c-heading)_10%,transparent)]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min={80}
                max={150}
                step={5}
                value={settings.fontSize}
                onChange={e => onUpdate({ fontSize: Number(e.target.value) })}
                className="range-medieval w-full"
              />
              <div className="card-medieval p-4 space-y-1">
                <p className="font-display text-sm text-[var(--c-heading)]">Exemple d'affichage</p>
                <p className="font-body text-[var(--c-text)]">
                  Vingt-et-un, quarante-deux, soixante-dix-huit, quatre-vingt-dix-neuf
                </p>
                <p className="font-body text-sm text-[var(--c-muted)] italic">
                  预览：二十一、四十二、七十八、九十九
                </p>
              </div>
            </div>
          </Section>

          {/* ─── Line Height ─── */}
          <Section title="INTERLIGNE" subtitle="行高间距">
            <div className="flex items-center gap-3">
              {([
                { value: 1.3, label: 'Serré', sub: '紧凑' },
                { value: 1.5, label: 'Normal', sub: '标准' },
                { value: 1.8, label: 'Aéré', sub: '宽松' },
                { value: 2.0, label: 'Large', sub: '特大' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ lineHeight: opt.value })}
                  className={`select-card flex-1 p-2.5 text-center transition-all duration-300 ${
                    settings.lineHeight === opt.value ? 'active' : ''
                  }`}
                >
                  <div className="font-display text-xs text-[var(--c-heading)]">{opt.label}</div>
                  <div className="font-body text-[10px] text-[var(--c-muted)]">{opt.sub}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* ─── Font Weight ─── */}
          <Section title="ÉPAISSEUR" subtitle="字重">
            <div className="flex gap-3">
              {([
                { value: 'normal', label: 'Fin', sub: '常规', style: 'font-normal' },
                { value: 'medium', label: 'Moyen', sub: '中等', style: 'font-medium' },
                { value: 'bold', label: 'Gras', sub: '粗体', style: 'font-semibold' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ fontWeight: opt.value })}
                  className={`select-card flex-1 p-3 text-center transition-all duration-300 ${
                    settings.fontWeight === opt.value ? 'active' : ''
                  }`}
                >
                  <div className={`font-body text-sm text-[var(--c-heading)] ${opt.style}`}>{opt.label}</div>
                  <div className="font-body text-[10px] text-[var(--c-muted)]">{opt.sub}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* ─── Content Width ─── */}
          <Section title="LARGEUR" subtitle="内容宽度">
            <div className="flex gap-3">
              {([
                { value: 'compact', label: 'Étroit', sub: '窄', icon: '┃' },
                { value: 'normal', label: 'Normal', sub: '标准', icon: '┃ ┃' },
                { value: 'wide', label: 'Large', sub: '宽', icon: '┃   ┃' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ contentWidth: opt.value })}
                  className={`select-card flex-1 p-3 text-center transition-all duration-300 ${
                    settings.contentWidth === opt.value ? 'active' : ''
                  }`}
                >
                  <div className="font-mono text-xs text-[var(--c-gold)] mb-1">{opt.icon}</div>
                  <div className="font-display text-xs text-[var(--c-heading)]">{opt.label}</div>
                  <div className="font-body text-[10px] text-[var(--c-muted)]">{opt.sub}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* ─── Keyboard Shortcuts ─── */}
          <Section title="RACCOURCIS" subtitle="键盘快捷键">
            <div className="space-y-1.5">
              {[
                { keys: 'Enter', desc: 'Valider / Suivant — 提交/下一题' },
                { keys: '← →', desc: 'Naviguer — 题目前后跳转' },
                { keys: '1 2 3 4', desc: 'Choisir A/B/C/D — 选择选项' },
                { keys: 'Espace', desc: 'Écouter TTS — 播放语音' },
              ].map(item => (
                <div key={item.keys} className="flex items-center gap-3">
                  <kbd className="font-mono text-xs bg-[color-mix(in_srgb,var(--c-heading)_10%,transparent)] text-[var(--c-heading)] px-2 py-0.5 rounded border border-[color-mix(in_srgb,var(--c-heading)_20%,transparent)] min-w-[4.5rem] text-center">
                    {item.keys}
                  </kbd>
                  <span className="font-body text-sm text-[var(--c-secondary)]">{item.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ─── Reset ─── */}
          <div className="pt-2 pb-8">
            <button
              onClick={onReset}
              className="w-full py-2.5 font-display text-sm text-[var(--c-error)] border border-[color-mix(in_srgb,var(--c-error)_30%,transparent)] rounded-xl hover:bg-[color-mix(in_srgb,var(--c-error)_10%,transparent)] transition-colors"
            >
              Réinitialiser — 恢复默认设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="card-medieval p-5 space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-xs text-[var(--c-gold)] tracking-[0.15em]">{title}</span>
        <span className="font-body text-xs text-[var(--c-muted)] italic">{subtitle}</span>
      </div>
      {children}
    </div>
  );
}
