// Official Panini FIFA World Cup 2026 album structure
// Format: [CODE] [N] — matches Supabase card_id exactly

export type Confederation = 'FIFA' | 'CONCACAF' | 'CONMEBOL' | 'UEFA' | 'CAF' | 'AFC' | 'OFC';

export interface Team {
  code: string;          // e.g. "ARG", "FIFA"
  name: string;          // e.g. "Argentina"
  flag: string;          // emoji
  confederation: Confederation;
  stickerCount: number;  // stickers in this section
  stickerStart: number;  // first sticker number (FIFA section starts at 0)
}

// 48 national teams + 1 special FIFA intro section
export const TEAMS: readonly Team[] = [
  // ── Special / Intro section ───────────────────────────────
  { code: 'FIFA', name: 'FIFA World Cup 2026', flag: '🏆', confederation: 'FIFA',     stickerCount: 20, stickerStart: 0 },

  // ── CONCACAF (hosts + qualifiers) ────────────────────────
  { code: 'USA', name: 'United States',  flag: '🇺🇸', confederation: 'CONCACAF', stickerCount: 18, stickerStart: 1 },
  { code: 'CAN', name: 'Canada',         flag: '🇨🇦', confederation: 'CONCACAF', stickerCount: 18, stickerStart: 1 },
  { code: 'MEX', name: 'Mexico',         flag: '🇲🇽', confederation: 'CONCACAF', stickerCount: 18, stickerStart: 1 },
  { code: 'PAN', name: 'Panama',         flag: '🇵🇦', confederation: 'CONCACAF', stickerCount: 18, stickerStart: 1 },
  { code: 'JAM', name: 'Jamaica',        flag: '🇯🇲', confederation: 'CONCACAF', stickerCount: 18, stickerStart: 1 },
  { code: 'HON', name: 'Honduras',       flag: '🇭🇳', confederation: 'CONCACAF', stickerCount: 18, stickerStart: 1 },

  // ── CONMEBOL ─────────────────────────────────────────────
  { code: 'ARG', name: 'Argentina',  flag: '🇦🇷', confederation: 'CONMEBOL', stickerCount: 18, stickerStart: 1 },
  { code: 'BRA', name: 'Brazil',     flag: '🇧🇷', confederation: 'CONMEBOL', stickerCount: 18, stickerStart: 1 },
  { code: 'URU', name: 'Uruguay',    flag: '🇺🇾', confederation: 'CONMEBOL', stickerCount: 18, stickerStart: 1 },
  { code: 'COL', name: 'Colombia',   flag: '🇨🇴', confederation: 'CONMEBOL', stickerCount: 18, stickerStart: 1 },
  { code: 'ECU', name: 'Ecuador',    flag: '🇪🇨', confederation: 'CONMEBOL', stickerCount: 18, stickerStart: 1 },
  { code: 'VEN', name: 'Venezuela',  flag: '🇻🇪', confederation: 'CONMEBOL', stickerCount: 18, stickerStart: 1 },

  // ── UEFA ─────────────────────────────────────────────────
  { code: 'FRA', name: 'France',      flag: '🇫🇷', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'ENG', name: 'England',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'GER', name: 'Germany',     flag: '🇩🇪', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'ESP', name: 'Spain',       flag: '🇪🇸', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'POR', name: 'Portugal',    flag: '🇵🇹', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'NED', name: 'Netherlands', flag: '🇳🇱', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'BEL', name: 'Belgium',     flag: '🇧🇪', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'ITA', name: 'Italy',       flag: '🇮🇹', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'CRO', name: 'Croatia',     flag: '🇭🇷', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'SUI', name: 'Switzerland', flag: '🇨🇭', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'DEN', name: 'Denmark',     flag: '🇩🇰', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'POL', name: 'Poland',      flag: '🇵🇱', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'AUT', name: 'Austria',     flag: '🇦🇹', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'SCO', name: 'Scotland',    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'TUR', name: 'Turkey',      flag: '🇹🇷', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
  { code: 'SRB', name: 'Serbia',      flag: '🇷🇸', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },

  // ── CAF ──────────────────────────────────────────────────
  { code: 'MAR', name: 'Morocco',      flag: '🇲🇦', confederation: 'CAF', stickerCount: 18, stickerStart: 1 },
  { code: 'SEN', name: 'Senegal',      flag: '🇸🇳', confederation: 'CAF', stickerCount: 18, stickerStart: 1 },
  { code: 'EGY', name: 'Egypt',        flag: '🇪🇬', confederation: 'CAF', stickerCount: 18, stickerStart: 1 },
  { code: 'NGA', name: 'Nigeria',      flag: '🇳🇬', confederation: 'CAF', stickerCount: 18, stickerStart: 1 },
  { code: 'CMR', name: 'Cameroon',     flag: '🇨🇲', confederation: 'CAF', stickerCount: 18, stickerStart: 1 },
  { code: 'ALG', name: 'Algeria',      flag: '🇩🇿', confederation: 'CAF', stickerCount: 18, stickerStart: 1 },
  { code: 'TUN', name: 'Tunisia',      flag: '🇹🇳', confederation: 'CAF', stickerCount: 18, stickerStart: 1 },
  { code: 'GHA', name: 'Ghana',        flag: '🇬🇭', confederation: 'CAF', stickerCount: 18, stickerStart: 1 },
  { code: 'CIV', name: 'Ivory Coast',  flag: '🇨🇮', confederation: 'CAF', stickerCount: 18, stickerStart: 1 },

  // ── AFC ──────────────────────────────────────────────────
  { code: 'JPN', name: 'Japan',        flag: '🇯🇵', confederation: 'AFC', stickerCount: 18, stickerStart: 1 },
  { code: 'KOR', name: 'South Korea',  flag: '🇰🇷', confederation: 'AFC', stickerCount: 18, stickerStart: 1 },
  { code: 'AUS', name: 'Australia',    flag: '🇦🇺', confederation: 'AFC', stickerCount: 18, stickerStart: 1 },
  { code: 'IRN', name: 'Iran',         flag: '🇮🇷', confederation: 'AFC', stickerCount: 18, stickerStart: 1 },
  { code: 'KSA', name: 'Saudi Arabia', flag: '🇸🇦', confederation: 'AFC', stickerCount: 18, stickerStart: 1 },
  { code: 'IRQ', name: 'Iraq',         flag: '🇮🇶', confederation: 'AFC', stickerCount: 18, stickerStart: 1 },
  { code: 'JOR', name: 'Jordan',       flag: '🇯🇴', confederation: 'AFC', stickerCount: 18, stickerStart: 1 },
  { code: 'UZB', name: 'Uzbekistan',   flag: '🇺🇿', confederation: 'AFC', stickerCount: 18, stickerStart: 1 },

  // ── OFC ──────────────────────────────────────────────────
  { code: 'NZL', name: 'New Zealand',  flag: '🇳🇿', confederation: 'OFC', stickerCount: 18, stickerStart: 1 },

  // ── Intercontinental playoff winners ─────────────────────
  { code: 'IDN', name: 'Indonesia',    flag: '🇮🇩', confederation: 'AFC', stickerCount: 18, stickerStart: 1 },
  { code: 'KAZ', name: 'Kazakhstan',   flag: '🇰🇿', confederation: 'UEFA', stickerCount: 18, stickerStart: 1 },
] as const;

/** All sticker IDs for a team, e.g. ["ARG 1", "ARG 2", …, "ARG 18"] */
export function getTeamStickers(team: Team): string[] {
  return Array.from(
    { length: team.stickerCount },
    (_, i) => `${team.code} ${team.stickerStart + i}`
  );
}

/** Flat list of every sticker ID in the album */
export function getAllStickers(): string[] {
  return TEAMS.flatMap(getTeamStickers);
}

/** Total sticker count across the entire album */
export const TOTAL_STICKERS = TEAMS.reduce((s, t) => s + t.stickerCount, 0);
// 20 (FIFA) + 48 × 18 = 884 stickers

/** O(1) lookup: code → Team */
export const TEAM_MAP: ReadonlyMap<string, Team> = new Map(TEAMS.map(t => [t.code, t]));
