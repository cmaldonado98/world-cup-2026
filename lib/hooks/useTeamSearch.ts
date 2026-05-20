'use client';

import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { TEAM_SEARCH_DOCS, TEAMS } from '@/lib/data/teams';

// ── Fuse instance (module-level, static data → initialized once) ──────────────

const fuse = new Fuse(TEAM_SEARCH_DOCS, {
  keys: [
    { name: 'name',        weight: 3 },
    { name: 'code',        weight: 2 },
    { name: 'searchTerms', weight: 1 },
  ],
  threshold:          0.35,
  minMatchCharLength: 2,
  includeScore:       false,
  shouldSort:         true,
});

// ── Hook ──────────────────────────────────────────────────────────────────────

/** Pattern for a group chip term, e.g. "Grupo A" */
const GROUP_CHIP_RE = /^Grupo ([A-L])$/i;

/**
 * Runs Fuse.js against the team name/code/group corpus — but uses
 * exact group matching when the query is a group-chip term (e.g. "Grupo A").
 *
 * Returns:
 *  - `null`         when the query is empty or purely numeric
 *                   (caller should use the sticker-number flat-list instead)
 *  - `Set<string>`  of matching team codes (may be empty if no match)
 */
export function useTeamSearch(query: string): Set<string> | null {
  return useMemo(() => {
    const q = query.trim();

    // Empty or purely numeric → sticker-number mode
    if (!q || /^\d+$/.test(q)) return null;

    // Exact group match — "Grupo A" through "Grupo L"
    const groupMatch = q.match(GROUP_CHIP_RE);
    if (groupMatch) {
      const letter = groupMatch[1].toUpperCase();
      return new Set(TEAMS.filter(t => t.group === letter).map(t => t.code));
    }

    // Exact special-section match
    if (/^Especiales$/i.test(q)) {
      return new Set(TEAMS.filter(t => t.group === 'Especiales').map(t => t.code));
    }
    if (/^CocaCola$/i.test(q)) {
      return new Set(TEAMS.filter(t => t.group === 'CocaCola').map(t => t.code));
    }

    // Free-text fuzzy search
    const results = fuse.search(q);
    return new Set(results.map(r => r.item.code));
  }, [query]);
}

// ── Utility ──────────────────────────────────────────────────────────────────

/**
 * Returns the search string written into the input when a group chip is pressed.
 * e.g. 'A' → 'Grupo A', 'Especiales' → 'Especiales', 'CocaCola' → 'CocaCola'
 */
export function groupChipToSearchTerm(groupName: string): string {
  if (groupName === 'Especiales' || groupName === 'CocaCola') return groupName;
  return `Grupo ${groupName}`;
}

