'use client';

import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { TEAM_SEARCH_DOCS } from '@/lib/data/teams';

// ── Fuse instance (module-level, static data → initialized once) ──────────────

const fuse = new Fuse(TEAM_SEARCH_DOCS, {
  keys: [
    { name: 'name',        weight: 3 },
    { name: 'code',        weight: 2 },
    { name: 'searchTerms', weight: 1 },
  ],
  threshold:          0.35, // 0 = exact, 1 = anything; 0.35 allows minor typos
  minMatchCharLength: 2,
  includeScore:       false,
  shouldSort:         true,
});

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Runs Fuse.js against the team name/code/group corpus.
 *
 * Returns:
 *  - `null`            when the query is empty or purely numeric
 *                      (caller should use the sticker-number flat-list instead)
 *  - `Set<string>`     of matching team codes (may be empty if no match found)
 */
export function useTeamSearch(query: string): Set<string> | null {
  return useMemo(() => {
    const q = query.trim();

    // Empty or purely numeric → not a team name search
    if (!q || /^\d+$/.test(q)) return null;

    const results = fuse.search(q);
    return new Set(results.map(r => r.item.code));
  }, [query]);
}

// ── Utility: map a group chip label → the search term Fuse.js understands ─────

/**
 * Returns the search string to put in the input when a group chip is pressed.
 * e.g. 'A' → 'Grupo A', 'Especiales' → 'Especiales', 'CocaCola' → 'CocaCola'
 */
export function groupChipToSearchTerm(groupName: string): string {
  if (groupName === 'Especiales' || groupName === 'CocaCola') return groupName;
  return `Grupo ${groupName}`;
}
