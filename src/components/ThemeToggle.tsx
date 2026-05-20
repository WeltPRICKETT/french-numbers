interface Props {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export default function ThemeToggle({ isDark, onToggleTheme, onOpenSettings }: Props) {
  return (
    <div className="fixed-actions">
      <button
        onClick={onOpenSettings}
        className="fixed-action-btn"
        title="Paramètres"
        aria-label="Settings"
      >
        ⚙
      </button>
      <button
        onClick={onToggleTheme}
        className="fixed-action-btn"
        title={isDark ? 'Mode clair' : 'Mode sombre'}
        aria-label="Toggle theme"
      >
        {isDark ? '☀' : '☾'}
      </button>
    </div>
  );
}
