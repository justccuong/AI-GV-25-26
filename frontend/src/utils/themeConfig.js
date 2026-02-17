/**
 * Theme definitions for the mind map editor.
 * Apply these when building nodes/edges in processMindMapData or when rendering.
 */

export const THEME_IDS = {
  DEFAULT: 'default',
  FUTURE_TECH: 'tech',
  PINK_CYBERPUNK: 'pink',
};

export const DEFAULT_THEME_ID = THEME_IDS.DEFAULT;

export const themes = {
  [THEME_IDS.DEFAULT]: {
    id: THEME_IDS.DEFAULT,
    name: 'Default (Light)',
    background: '#f8fafc',
    backgroundPattern: '#e2e8f0',
    node: {
      rootBg: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
      rootBorder: '2px solid #94a3b8',
      rootTextColor: '#1e293b',
      childBg: '#ffffff',
      childBorder: '1px solid #cbd5e1',
      textColor: '#1e293b',
      fontFamily: 'Segoe UI, sans-serif',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    edge: {
      stroke: '#64748b',
      strokeWidth: 3,
      filter: 'none',
    },
  },
  [THEME_IDS.FUTURE_TECH]: {
    id: THEME_IDS.FUTURE_TECH,
    name: 'Future Tech',
    background: '#0f172a',
    backgroundPattern: '#1e293b',
    node: {
      rootBg: 'linear-gradient(145deg, rgba(6, 182, 212, 0.25) 0%, rgba(8, 145, 178, 0.2) 100%)',
      rootBorder: '2px solid #06b6d4',
      rootTextColor: '#f8fafc',
      childBg: 'rgba(15, 23, 42, 0.85)',
      childBorder: '1px solid #06b6d4',
      textColor: '#f8fafc',
      fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
      boxShadow: '0 0 20px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
    },
    edge: {
      stroke: '#06b6d4',
      strokeWidth: 3,
      filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.6))',
    },
  },
  [THEME_IDS.PINK_CYBERPUNK]: {
    id: THEME_IDS.PINK_CYBERPUNK,
    name: 'Pink Cyberpunk',
    background: '#000000',
    backgroundPattern: '#0a0a0a',
    node: {
      rootBg: 'linear-gradient(145deg, rgba(236, 72, 153, 0.2) 0%, rgba(219, 39, 119, 0.15) 100%)',
      rootBorder: '2px solid #ec4899',
      rootTextColor: '#fce7f3',
      childBg: 'rgba(0, 0, 0, 0.9)',
      childBorder: '1px solid #ec4899',
      textColor: '#fce7f3',
      fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
      boxShadow: '0 0 20px rgba(236, 72, 153, 0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
    },
    edge: {
      stroke: '#ec4899',
      strokeWidth: 3,
      filter: 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.6))',
    },
  },
};

export function getTheme(themeId) {
  return themes[themeId] || themes[DEFAULT_THEME_ID];
}
