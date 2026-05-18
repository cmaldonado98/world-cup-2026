'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';
import { TOTAL_STICKERS } from '@/lib/data/teams';

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

export interface AlbumContextValue {
  cardMap:       CardMap;
  user:          User | null;
  loading:       boolean;
  incrementCard: (cardId: string) => void;
  decrementCard: (cardId: string) => void;
  removeCard:    (cardId: string) => void;
  stats: {
    owned:      number;
    missing:    number;
    duplicates: number;
    total:      number;
    percentage: number;
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
      const next = (stateRef.current.cardMap[cardId] ?? 0) + 1;
      dispatch({ type: 'UPDATE_CARD', cardId, quantity: next }); // instant UI
      syncToSupabase(cardId, next);
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
    const owned      = Object.keys(state.cardMap).length;
    const missing    = TOTAL_STICKERS - owned;
    const duplicates = Object.values(state.cardMap).filter(q => q > 1).length;
    const percentage = TOTAL_STICKERS > 0 ? Math.round((owned / TOTAL_STICKERS) * 100) : 0;
    return { owned, missing, duplicates, total: TOTAL_STICKERS, percentage };
  }, [state.cardMap]);

  return (
    <AlbumContext.Provider
      value={{
        cardMap: state.cardMap,
        user:    state.user,
        loading: state.loading,
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
