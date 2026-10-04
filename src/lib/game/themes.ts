/**
 * Visual board themes — board logic never changes, only the paint.
 */

export type ThemeId = 'rainbow' | 'candy' | 'space' | 'jungle' | 'ocean';

export type BoardTheme = {
  id: ThemeId;
  name: string;
  /** 6 tile colors cycled across the board. */
  palette: string[];
  /** Ink used for tile numbers (light tiles need dark ink). */
  ink: string;
  ladderColor: string;
  ladderAccent: string;
  chuteColor: string;
  chuteAccent: string;
  /** Page/backdrop gradient behind the board. */
  backdrop: string;
};

export const THEMES: Record<ThemeId, BoardTheme> = {
  rainbow: {
    id: 'rainbow',
    name: 'Rainbow',
    palette: ['#8B5CF6', '#3B82F6', '#06B6D4', '#22C55E', '#FACC15', '#EC4899'],
    ink: '#0F172A',
    ladderColor: '#F59E0B',
    ladderAccent: '#FDE68A',
    chuteColor: '#F97316',
    chuteAccent: '#FECACA',
    backdrop: 'linear-gradient(160deg, #EEF2FF 0%, #F8FAFC 45%, #FDF4FF 100%)'
  },
  candy: {
    id: 'candy',
    name: 'Candy',
    palette: ['#F472B6', '#FB7185', '#FDBA74', '#FDE68A', '#A7F3D0', '#C4B5FD'],
    ink: '#4C0519',
    ladderColor: '#EC4899',
    ladderAccent: '#FBCFE8',
    chuteColor: '#8B5CF6',
    chuteAccent: '#DDD6FE',
    backdrop: 'linear-gradient(160deg, #FFF1F2 0%, #FFFBEB 50%, #FDF4FF 100%)'
  },
  space: {
    id: 'space',
    name: 'Space',
    palette: ['#312E81', '#4338CA', '#6366F1', '#8B5CF6', '#A78BFA', '#38BDF8'],
    ink: '#F8FAFC',
    ladderColor: '#FACC15',
    ladderAccent: '#FEF3C7',
    chuteColor: '#EC4899',
    chuteAccent: '#FBCFE8',
    backdrop: 'linear-gradient(160deg, #0F172A 0%, #1E1B4B 55%, #312E81 100%)'
  },
  jungle: {
    id: 'jungle',
    name: 'Jungle',
    palette: ['#16A34A', '#22C55E', '#84CC16', '#14B8A6', '#F59E0B', '#A3E635'],
    ink: '#052E16',
    ladderColor: '#92400E',
    ladderAccent: '#FDE68A',
    chuteColor: '#0EA5E9',
    chuteAccent: '#CFFAFE',
    backdrop: 'linear-gradient(160deg, #ECFDF5 0%, #F7FEE7 55%, #F0FDF4 100%)'
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    palette: ['#0EA5E9', '#06B6D4', '#2563EB', '#14B8A6', '#38BDF8', '#60A5FA'],
    ink: '#082F49',
    ladderColor: '#F59E0B',
    ladderAccent: '#FEF3C7',
    chuteColor: '#EF4444',
    chuteAccent: '#FECACA',
    backdrop: 'linear-gradient(160deg, #EFF6FF 0%, #ECFEFF 55%, #F0F9FF 100%)'
  }
};

export const DEFAULT_THEME: ThemeId = 'rainbow';

export const THEME_LIST = Object.values(THEMES);

export function getTheme(id: string | null | undefined): BoardTheme {
  if (id && id in THEMES) return THEMES[id as ThemeId];
  return THEMES[DEFAULT_THEME];
}
