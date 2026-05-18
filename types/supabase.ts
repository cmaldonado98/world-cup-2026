// Supabase database type definitions — matches supabase/schema.sql exactly
export interface Database {
  public: {
    Tables: {
      user_cards: {
        Row: {
          id:         string;
          user_id:    string;
          card_id:    string;
          quantity:   number;
          updated_at: string;
        };
        Insert: {
          id?:         string;
          user_id:     string;
          card_id:     string;
          quantity?:   number;
          updated_at?: string;
        };
        Update: {
          id?:         string;
          user_id?:    string;
          card_id?:    string;
          quantity?:   number;
          updated_at?: string;
        };
      };
    };
  };
}

export type UserCardRow = Database['public']['Tables']['user_cards']['Row'];
