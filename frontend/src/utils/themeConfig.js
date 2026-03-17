export const THEME_IDS = {
  DEFAULT: 'default',
  FUTURE_TECH: 'tech',
  PINK_CYBERPUNK: 'pink',
};

export const DEFAULT_THEME_ID = THEME_IDS.DEFAULT;

export const themes = {
  [THEME_IDS.DEFAULT]: {
    id: THEME_IDS.DEFAULT,
    name: 'Cầu vồng',
    background: 'radial-gradient(circle at top, rgba(243,244,255,0.99), rgba(230,236,255,0.97) 38%, rgba(239,242,255,0.99) 100%)',
    backgroundPattern: '#d4dbf4',
    shell: {
      workspaceBg:
        'radial-gradient(circle at top, rgba(228,234,255,0.92), transparent 34%), linear-gradient(180deg, #eef2ff 0%, #e9efff 44%, #f4f6ff 100%)',
      panelBg: 'rgba(255, 255, 255, 0.68)',
      panelStrongBg: 'rgba(255, 255, 255, 0.78)',
      panelBorder: 'rgba(148, 163, 184, 0.18)',
      panelText: '#334155',
      panelMuted: '#64748b',
      accent: '#8b7bff',
      accentSoft: 'rgba(139, 123, 255, 0.12)',
    },
    node: {
      rootBg: 'radial-gradient(circle at 30% 25%, rgba(221,214,254,0.9) 0%, rgba(196,181,253,0.55) 42%, rgba(167,139,250,0.2) 100%)',
      rootBorder: '1px solid rgba(167,139,250,0.52)',
      rootTextColor: '#312e81',
      childBg: 'rgba(255,255,255,0.72)',
      childBorder: '1px solid rgba(148,163,184,0.24)',
      textColor: '#334155',
      fontFamily: '"Segoe UI", sans-serif',
      boxShadow: '0 16px 34px rgba(148, 163, 184, 0.12)',
      textShadow: 'none',
    },
    edge: {
      stroke: '#a78bfa',
      strokeWidth: 3,
      filter: 'drop-shadow(0 0 4px rgba(167, 139, 250, 0.2))',
    },
  },
  [THEME_IDS.FUTURE_TECH]: {
    id: THEME_IDS.FUTURE_TECH,
    name: 'Công nghệ tương lai',
    background: '#0f172a',
    backgroundPattern: '#1e293b',
    shell: {
      workspaceBg:
        'radial-gradient(circle at top, rgba(34,211,238,0.14), transparent 38%), linear-gradient(180deg, #020617 0%, #0f172a 48%, #020617 100%)',
      panelBg: 'rgba(2, 6, 23, 0.72)',
      panelStrongBg: 'rgba(2, 6, 23, 0.84)',
      panelBorder: 'rgba(255, 255, 255, 0.1)',
      panelText: '#e2e8f0',
      panelMuted: '#94a3b8',
      accent: '#22d3ee',
      accentSoft: 'rgba(34, 211, 238, 0.14)',
    },
    node: {
      rootBg: 'linear-gradient(145deg, rgba(6, 182, 212, 0.25) 0%, rgba(8, 145, 178, 0.2) 100%)',
      rootBorder: '2px solid #06b6d4',
      rootTextColor: '#f8fafc',
      childBg: 'rgba(15, 23, 42, 0.85)',
      childBorder: '1px solid #06b6d4',
      textColor: '#f8fafc',
      fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
      boxShadow: '0 0 20px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
      textShadow: '0 1px 2px rgba(2, 6, 23, 0.45)',
    },
    edge: {
      stroke: '#06b6d4',
      strokeWidth: 3,
      filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.6))',
    },
  },
  [THEME_IDS.PINK_CYBERPUNK]: {
    id: THEME_IDS.PINK_CYBERPUNK,
    name: 'Hồng cyberpunk',
    background: 'radial-gradient(circle at top left, rgba(236,72,153,0.2), transparent 30%), radial-gradient(circle at top right, rgba(168,85,247,0.18), transparent 36%), linear-gradient(160deg, #180916 0%, #27122b 48%, #1d1235 100%)',
    backgroundPattern: '#4b244f',
    shell: {
      workspaceBg:
        'radial-gradient(circle at top left, rgba(244, 114, 182, 0.2), transparent 28%), radial-gradient(circle at 80% 0%, rgba(192, 132, 252, 0.18), transparent 34%), linear-gradient(180deg, #2a1024 0%, #341334 45%, #24143b 100%)',
      panelBg: 'rgba(64, 22, 61, 0.64)',
      panelStrongBg: 'rgba(83, 28, 76, 0.76)',
      panelBorder: 'rgba(251, 113, 133, 0.24)',
      panelText: '#fde7f3',
      panelMuted: '#f9a8d4',
      accent: '#ff6fb5',
      accentSoft: 'rgba(255, 111, 181, 0.16)',
    },
    node: {
      rootBg: 'linear-gradient(145deg, rgba(255, 132, 204, 0.42) 0%, rgba(236, 72, 153, 0.2) 100%)',
      rootBorder: '2px solid #ec4899',
      rootTextColor: '#fce7f3',
      childBg: 'linear-gradient(155deg, rgba(101, 36, 92, 0.84) 0%, rgba(58, 18, 69, 0.88) 100%)',
      childBorder: '1px solid rgba(255, 149, 209, 0.68)',
      textColor: '#fce7f3',
      fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
      boxShadow: '0 0 26px rgba(236, 72, 153, 0.24), 0 20px 34px rgba(41, 12, 49, 0.28), inset 0 1px 0 rgba(255,255,255,0.08)',
      textShadow: '0 1px 2px rgba(15, 23, 42, 0.5)',
    },
    edge: {
      stroke: '#ff6fb5',
      strokeWidth: 3,
      filter: 'drop-shadow(0 0 6px rgba(255, 111, 181, 0.42))',
    },
  },
};

export function getTheme(themeId) {
  return themes[themeId] || themes[DEFAULT_THEME_ID];
}

