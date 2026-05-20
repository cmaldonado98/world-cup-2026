// Official Panini FIFA World Cup 2026 album structure
// Sticker codes match cods.csv exactly (no-space format: MEX1, ARG20, FWC, etc.)
// Teams ordered exactly as in cods.csv; every 4 national teams = one group (A–L)

export type Confederation = 'FIFA' | 'CONCACAF' | 'CONMEBOL' | 'UEFA' | 'CAF' | 'AFC' | 'OFC';

export interface Team {
  code: string;          // e.g. "ARG", "FWC", "CC"
  name: string;          // e.g. "Argentina"
  flag: string;          // emoji
  confederation: Confederation;
  stickerCount: number;  // total stickers in this section
  group: string;         // e.g. "A", "B", "Especiales", "CocaCola"
}

// ── Album order: FWC → Groups A-L (4 teams each) → CC ─────────────────────────
export const TEAMS: readonly Team[] = [
  // ── Especiales ────────────────────────────────────────────
  // FWC: Logo sticker ("FWC") + FWC1–FWC19 = 20 stickers
  { code: 'FWC', name: 'FIFA World Cup 2026', flag: '🏆', confederation: 'FIFA',     stickerCount: 20, group: 'Especiales' },

  // ── Grupo A ───────────────────────────────────────────────
  { code: 'MEX', name: 'Mexico',         flag: '🇲🇽', confederation: 'CONCACAF', stickerCount: 20, group: 'A' },
  { code: 'RSA', name: 'South Africa',   flag: '🇿🇦', confederation: 'CAF',      stickerCount: 20, group: 'A' },
  { code: 'KOR', name: 'South Korea',    flag: '🇰🇷', confederation: 'AFC',      stickerCount: 20, group: 'A' },
  { code: 'CZE', name: 'Czech Republic', flag: '🇨🇿', confederation: 'UEFA',     stickerCount: 20, group: 'A' },

  // ── Grupo B ───────────────────────────────────────────────
  { code: 'CAN', name: 'Canada',                   flag: '🇨🇦', confederation: 'CONCACAF', stickerCount: 20, group: 'B' },
  { code: 'BIH', name: 'Bosnia and Herzegovina',   flag: '🇧🇦', confederation: 'UEFA',     stickerCount: 20, group: 'B' },
  { code: 'QAT', name: 'Qatar',                    flag: '🇶🇦', confederation: 'AFC',      stickerCount: 20, group: 'B' },
  { code: 'SUI', name: 'Switzerland',              flag: '🇨🇭', confederation: 'UEFA',     stickerCount: 20, group: 'B' },

  // ── Grupo C ───────────────────────────────────────────────
  { code: 'BRA', name: 'Brazil',      flag: '🇧🇷', confederation: 'CONMEBOL', stickerCount: 20, group: 'C' },
  { code: 'MAR', name: 'Morocco',     flag: '🇲🇦', confederation: 'CAF',      stickerCount: 20, group: 'C' },
  { code: 'HAI', name: 'Haiti',       flag: '🇭🇹', confederation: 'CONCACAF', stickerCount: 20, group: 'C' },
  { code: 'SCO', name: 'Scotland',    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA',     stickerCount: 20, group: 'C' },

  // ── Grupo D ───────────────────────────────────────────────
  { code: 'USA', name: 'United States', flag: '🇺🇸', confederation: 'CONCACAF', stickerCount: 20, group: 'D' },
  { code: 'PAR', name: 'Paraguay',      flag: '🇵🇾', confederation: 'CONMEBOL', stickerCount: 20, group: 'D' },
  { code: 'AUS', name: 'Australia',     flag: '🇦🇺', confederation: 'AFC',      stickerCount: 20, group: 'D' },
  { code: 'TUR', name: 'Turkey',        flag: '🇹🇷', confederation: 'UEFA',     stickerCount: 20, group: 'D' },

  // ── Grupo E ───────────────────────────────────────────────
  { code: 'GER', name: 'Germany',     flag: '🇩🇪', confederation: 'UEFA',     stickerCount: 20, group: 'E' },
  { code: 'CUW', name: 'Curaçao',     flag: '🇨🇼', confederation: 'CONCACAF', stickerCount: 20, group: 'E' },
  { code: 'CIV', name: 'Ivory Coast', flag: '🇨🇮', confederation: 'CAF',      stickerCount: 20, group: 'E' },
  { code: 'ECU', name: 'Ecuador',     flag: '🇪🇨', confederation: 'CONMEBOL', stickerCount: 20, group: 'E' },

  // ── Grupo F ───────────────────────────────────────────────
  { code: 'NED', name: 'Netherlands', flag: '🇳🇱', confederation: 'UEFA', stickerCount: 20, group: 'F' },
  { code: 'JPN', name: 'Japan',       flag: '🇯🇵', confederation: 'AFC',  stickerCount: 20, group: 'F' },
  { code: 'SWE', name: 'Sweden',      flag: '🇸🇪', confederation: 'UEFA', stickerCount: 20, group: 'F' },
  { code: 'TUN', name: 'Tunisia',     flag: '🇹🇳', confederation: 'CAF',  stickerCount: 20, group: 'F' },

  // ── Grupo G ───────────────────────────────────────────────
  { code: 'BEL', name: 'Belgium',     flag: '🇧🇪', confederation: 'UEFA', stickerCount: 20, group: 'G' },
  { code: 'EGY', name: 'Egypt',       flag: '🇪🇬', confederation: 'CAF',  stickerCount: 20, group: 'G' },
  { code: 'IRN', name: 'Iran',        flag: '🇮🇷', confederation: 'AFC',  stickerCount: 20, group: 'G' },
  { code: 'NZL', name: 'New Zealand', flag: '🇳🇿', confederation: 'OFC',  stickerCount: 20, group: 'G' },

  // ── Grupo H ───────────────────────────────────────────────
  { code: 'ESP', name: 'Spain',         flag: '🇪🇸', confederation: 'UEFA', stickerCount: 20, group: 'H' },
  { code: 'CPV', name: 'Cape Verde',    flag: '🇨🇻', confederation: 'CAF',  stickerCount: 20, group: 'H' },
  { code: 'KSA', name: 'Saudi Arabia',  flag: '🇸🇦', confederation: 'AFC',  stickerCount: 20, group: 'H' },
  { code: 'URU', name: 'Uruguay',       flag: '🇺🇾', confederation: 'CONMEBOL', stickerCount: 20, group: 'H' },

  // ── Grupo I ───────────────────────────────────────────────
  { code: 'FRA', name: 'France',   flag: '🇫🇷', confederation: 'UEFA', stickerCount: 20, group: 'I' },
  { code: 'SEN', name: 'Senegal',  flag: '🇸🇳', confederation: 'CAF',  stickerCount: 20, group: 'I' },
  { code: 'IRQ', name: 'Iraq',     flag: '🇮🇶', confederation: 'AFC',  stickerCount: 20, group: 'I' },
  { code: 'NOR', name: 'Norway',   flag: '🇳🇴', confederation: 'UEFA', stickerCount: 20, group: 'I' },

  // ── Grupo J ───────────────────────────────────────────────
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', confederation: 'CONMEBOL', stickerCount: 20, group: 'J' },
  { code: 'ALG', name: 'Algeria',   flag: '🇩🇿', confederation: 'CAF',      stickerCount: 20, group: 'J' },
  { code: 'AUT', name: 'Austria',   flag: '🇦🇹', confederation: 'UEFA',     stickerCount: 20, group: 'J' },
  { code: 'JOR', name: 'Jordan',    flag: '🇯🇴', confederation: 'AFC',      stickerCount: 20, group: 'J' },

  // ── Grupo K ───────────────────────────────────────────────
  { code: 'POR', name: 'Portugal',   flag: '🇵🇹', confederation: 'UEFA',     stickerCount: 20, group: 'K' },
  { code: 'COD', name: 'DR Congo',   flag: '🇨🇩', confederation: 'CAF',      stickerCount: 20, group: 'K' },
  { code: 'UZB', name: 'Uzbekistan', flag: '🇺🇿', confederation: 'AFC',      stickerCount: 20, group: 'K' },
  { code: 'COL', name: 'Colombia',   flag: '🇨🇴', confederation: 'CONMEBOL', stickerCount: 20, group: 'K' },

  // ── Grupo L ───────────────────────────────────────────────
  { code: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA',     stickerCount: 20, group: 'L' },
  { code: 'CRO', name: 'Croatia', flag: '🇭🇷', confederation: 'UEFA',     stickerCount: 20, group: 'L' },
  { code: 'GHA', name: 'Ghana',   flag: '🇬🇭', confederation: 'CAF',      stickerCount: 20, group: 'L' },
  { code: 'PAN', name: 'Panama',  flag: '🇵🇦', confederation: 'CONCACAF', stickerCount: 20, group: 'L' },

  // ── CocaCola ──────────────────────────────────────────────
  { code: 'CC', name: 'Coca-Cola Cup', flag: '🥤', confederation: 'FIFA', stickerCount: 14, group: 'CocaCola' },
] as const;

/**
 * All sticker IDs for a section.
 * FWC is special: first sticker is "FWC" (logo), then FWC1–FWC19.
 * All other sections: CODE1–CODE{stickerCount}.
 */
export function getTeamStickers(team: Team): string[] {
  if (team.code === 'FWC') {
    return ['FWC', ...Array.from({ length: 19 }, (_, i) => `FWC${i + 1}`)];
  }
  return Array.from({ length: team.stickerCount }, (_, i) => `${team.code}${i + 1}`);
}

/** Flat list of every sticker ID in the album */
export function getAllStickers(): string[] {
  return TEAMS.flatMap(getTeamStickers);
}

/** Total sticker count across the entire album */
export const TOTAL_STICKERS = TEAMS.reduce((s, t) => s + t.stickerCount, 0);
// 20 (FWC) + 48 × 20 + 14 (CC) = 994 stickers

/** O(1) lookup: code → Team */
export const TEAM_MAP: ReadonlyMap<string, Team> = new Map(TEAMS.map(t => [t.code, t]));

/** Group names in album order (Set preserves insertion order) */
export const GROUP_NAMES: readonly string[] = [...new Set(TEAMS.map(t => t.group))];

/** Map: group name → teams in album order */
export const GROUPS: ReadonlyMap<string, readonly Team[]> = new Map(
  GROUP_NAMES.map(g => [g, TEAMS.filter(t => t.group === g)])
);

// ── Search index ──────────────────────────────────────────────────────────────

/** Enriched document used by Fuse.js — built from static TEAMS data. */
export interface TeamSearchDoc {
  code:        string; // e.g. "ARG"
  name:        string; // e.g. "Argentina"
  searchTerms: string; // concatenated: name + code + group label + confederation
}

/**
 * Pre-built search documents.
 * `searchTerms` contains every natural-language token a user might type:
 *  - Country name (English)
 *  - 3-letter code
 *  - Group label ("Grupo A", "Especiales", "CocaCola")
 *  - Confederation acronym (UEFA, CONMEBOL, …)
 */
export const TEAM_SEARCH_DOCS: TeamSearchDoc[] = (TEAMS as readonly Team[]).map(t => ({
  code: t.code,
  name: t.name,
  searchTerms: [
    t.name,
    t.code,
    t.group.length === 1 ? `Grupo ${t.group}` : t.group,
    t.confederation,
  ].join(' '),
}));
