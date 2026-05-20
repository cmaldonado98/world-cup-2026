'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';
import { TOTAL_STICKERS, TEAMS, getTeamStickers } from '@/lib/data/teams';

// ─── Types ────────────────────────────────────────────────────────────────────

/** card_id → quantity.  Keys only exist for quantity > 0. */
export type CardMap = Record<string, number>;

interface AlbumState {
  cardMap: CardMap;
  user:    User | null;
  loading: boolean;
}

type Action =
  | { type: 'SET_USER';    user:    User | null }
  | { type: 'LOAD_CARDS';  cards:   CardMap }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'UPDATE_CARD'; cardId:  string; quantity: number };

export interface GroupProgressItem {
  code:       string;
  name:       string;
  flag:       string;
  group:      string;
  owned:      number;
  total:      number;
  percentage: number;
}

export interface AlbumContextValue {
  cardMap:       CardMap;
  user:          User | null;
  loading:       boolean;
  todayAdded:    number;
  incrementCard: (cardId: string) => void;
  decrementCard: (cardId: string) => void;
  removeCard:    (cardId: string) => void;
  stats: {
    owned:              number;
    missing:            number;
    duplicates:         number;
    total:              number;
    percentage:         number;
    // Trade power
    tradeableCount:     number;
    tradePower:         number;
    // Specials vs normals
    specialsOwned:      number;
    specialsTotal:      number;
    specialsPercentage: number;
    normalsOwned:       number;
    normalsTotal:       number;
    normalsPercentage:  number;
    // Curiosity
    mostDuplicated:     { cardId: string; count: number } | null;
    // Per-team progress sorted by % desc
    groupProgress:      GroupProgressItem[];
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: AlbumState, action: Action): AlbumState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user };
    case 'LOAD_CARDS':
      return { ...state, cardMap: action.cards, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'UPDATE_CARD': {
      const next = { ...state.cardMap };
      if (action.quantity <= 0) {
        delete next[action.cardId];
      } else {
        next[action.cardId] = action.quantity;
      }
      return { ...state, cardMap: next };
    }
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AlbumContext = createContext<AlbumContextValue | null>(null);
const LS_KEY = 'wc2026_cards';

// Pre-compute specials sticker IDs once (stable across renders)
const SPECIAL_GROUPS = new Set(['Especiales', 'CocaCola']);
const SPECIAL_STICKER_IDS = new Set(
  TEAMS.filter(t => SPECIAL_GROUPS.has(t.group)).flatMap(getTeamStickers)
);

export function AlbumProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [state, dispatch] = useReducer(reducer, {
    cardMap: {},
    user:    null,
    loading: true,
  });

  // Keep a ref so callbacks always read the latest value without re-creating
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // ── Today-added counter (persisted in localStorage per calendar day) ────────
  const [todayAdded, setTodayAdded] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = localStorage.getItem('wc2026_today_log');
      if (raw) {
        const { date, count } = JSON.parse(raw) as { date: string; count: number };
        if (date === new Date().toDateString()) return count;
      }
    } catch { /* ignore */ }
    return 0;
  });

  // Debounce timers: we send the final quantity to Supabase after 600 ms of inactivity
  const debounceMap = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── 1. Seed from localStorage immediately (0 ms latency on first load) ──────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) dispatch({ type: 'LOAD_CARDS', cards: JSON.parse(raw) });
      else     dispatch({ type: 'SET_LOADING', loading: false });
    } catch {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  // ── 2. Persist to localStorage on every cardMap change ──────────────────────
  const prevCardMap = useRef<CardMap | null>(null);
  useEffect(() => {
    if (prevCardMap.current === state.cardMap) return;
    prevCardMap.current = state.cardMap;
    try { localStorage.setItem(LS_KEY, JSON.stringify(state.cardMap)); } catch { /* quota */ }
  }, [state.cardMap]);

  // ── 3. Auth listener + pull from Supabase on login ──────────────────────────
  useEffect(() => {
    // Initial session check — explicit type avoids implicit-any with untyped SSR client
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      dispatch({ type: 'SET_USER', user: data.session?.user ?? null });
      if (data.session?.user) pullFromSupabase(data.session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
      dispatch({ type: 'SET_USER', user: session?.user ?? null });
      if (session?.user) pullFromSupabase(session.user.id);
      if (!session) {
        // Logged out – clear remote data but keep nothing (stale local stays)
        dispatch({ type: 'LOAD_CARDS', cards: {} });
        localStorage.removeItem(LS_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function pullFromSupabase(userId: string) {
    const { data, error } = await supabase
      .from('user_cards')
      .select('card_id, quantity')
      .eq('user_id', userId);

    if (error || !data) return;

    const rows = data as Array<{ card_id: string; quantity: number }>;
    const cards: CardMap = {};
    for (const row of rows) {
      if (row.quantity > 0) cards[row.card_id] = row.quantity;
    }
    dispatch({ type: 'LOAD_CARDS', cards });
    try { localStorage.setItem(LS_KEY, JSON.stringify(cards)); } catch { /* quota */ }
  }

  // ── 4. Debounced Supabase sync (fire-and-forget) ────────────────────────────
  const syncToSupabase = useCallback(
    (cardId: string, quantity: number) => {
      const user = stateRef.current.user;
      if (!user) return;

      clearTimeout(debounceMap.current[cardId]);
      debounceMap.current[cardId] = setTimeout(async () => {
        if (quantity <= 0) {
          await supabase
            .from('user_cards')
            .delete()
            .eq('user_id', user.id)
            .eq('card_id', cardId);
        } else {
          await supabase.from('user_cards').upsert(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { user_id: user.id, card_id: cardId, quantity } as any,
            { onConflict: 'user_id,card_id' }
          );
        }
      }, 600);
    },
    [supabase]
  );

  // ── 5. Public actions (optimistic first, then sync) ──────────────────────────

  const incrementCard = useCallback(
    (cardId: string) => {
      const prev = stateRef.current.cardMap[cardId] ?? 0;
      const next = prev + 1;
      dispatch({ type: 'UPDATE_CARD', cardId, quantity: next }); // instant UI
      syncToSupabase(cardId, next);
      // Track first-time additions for the "today" counter
      if (prev === 0) {
        setTodayAdded(c => {
          const newCount = c + 1;
          try {
            localStorage.setItem(
              'wc2026_today_log',
              JSON.stringify({ date: new Date().toDateString(), count: newCount })
            );
          } catch { /* quota */ }
          return newCount;
        });
      }
    },
    [syncToSupabase]
  );

  const decrementCard = useCallback(
    (cardId: string) => {
      const next = Math.max(0, (stateRef.current.cardMap[cardId] ?? 0) - 1);
      dispatch({ type: 'UPDATE_CARD', cardId, quantity: next }); // instant UI
      syncToSupabase(cardId, next);
    },
    [syncToSupabase]
  );

  const removeCard = useCallback(
    (cardId: string) => {
      dispatch({ type: 'UPDATE_CARD', cardId, quantity: 0 }); // instant UI
      syncToSupabase(cardId, 0);
    },
    [syncToSupabase]
  );

  // ── 6. Derived stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const cardMap    = state.cardMap;
    const entries    = Object.entries(cardMap);
    const owned      = entries.length;
    const missing    = TOTAL_STICKERS - owned;
    const percentage = TOTAL_STICKERS > 0 ? Math.round((owned / TOTAL_STICKERS) * 100) : 0;

    // Duplicates & trade power
    const dupEntries    = entries.filter(([, q]) => q > 1);
    const duplicates    = dupEntries.length;
    const tradeableCount = dupEntries.reduce((sum, [, q]) => sum + (q - 1), 0);
    const tradePower    = missing > 0
      ? Math.min(100, Math.round((tradeableCount / missing) * 100))
      : 0;

    // Most duplicated card (highest quantity)
    const mostDuplicated = entries.length > 0
      ? entries.reduce<[string, number]>(
          (best, cur) => (cur[1] > best[1] ? cur : best),
          entries[0]
        )
      : null;

    // Specials vs normals
    const specialsTotal  = SPECIAL_STICKER_IDS.size;
    const specialsOwned  = entries.filter(([id]) => SPECIAL_STICKER_IDS.has(id)).length;
    const specialsPercentage = specialsTotal > 0
      ? Math.round((specialsOwned / specialsTotal) * 100) : 0;
    const normalsTotal   = TOTAL_STICKERS - specialsTotal;
    const normalsOwned   = owned - specialsOwned;
    const normalsPercentage = normalsTotal > 0
      ? Math.round((normalsOwned / normalsTotal) * 100) : 0;

    // Per-team progress sorted by completion % descending
    const groupProgress: GroupProgressItem[] = TEAMS.map(team => {
      const stickers  = getTeamStickers(team);
      const teamOwned = stickers.filter(id => cardMap[id] !== undefined).length;
      return {
        code:       team.code,
        name:       team.name,
        flag:       team.flag,
        group:      team.group,
        owned:      teamOwned,
        total:      team.stickerCount,
        percentage: Math.round((teamOwned / team.stickerCount) * 100),
      };
    }).sort((a, b) => b.percentage - a.percentage);

    return {
      owned, missing, duplicates, total: TOTAL_STICKERS, percentage,
      tradeableCount, tradePower,
      specialsOwned, specialsTotal, specialsPercentage,
      normalsOwned, normalsTotal, normalsPercentage,
      mostDuplicated: mostDuplicated
        ? { cardId: mostDuplicated[0], count: mostDuplicated[1] }
        : null,
      groupProgress,
    };
  }, [state.cardMap]);

  return (
    <AlbumContext.Provider
      value={{
        cardMap:    state.cardMap,
        user:       state.user,
        loading:    state.loading,
        todayAdded,
        incrementCard,
        decrementCard,
        removeCard,
        stats,
      }}
    >
      {children}
    </AlbumContext.Provider>
  );
}

export function useAlbum(): AlbumContextValue {
  const ctx = useContext(AlbumContext);
  if (!ctx) throw new Error('useAlbum must be used inside <AlbumProvider>');
  return ctx;
}
