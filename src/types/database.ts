import type { PedalModelConfig, PresetSettings } from "./pedal";

/**
 * Tipos escritos à mão espelhando supabase/migrations/0001_init.sql.
 *
 * As `Relationships` não são decorativas: o postgrest-js as usa para tipar
 * embeds (`select("...author:profiles(...)")`) e para decidir se a relação é
 * objeto ou lista. Sem elas, as queries com join viram erro de tipo.
 * Alternativa: `npx supabase gen types typescript --project-id <id>`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Rel<
  Fk extends string,
  Col extends string,
  Ref extends string,
  One extends boolean = false,
> = {
  foreignKeyName: Fk;
  columns: [Col];
  isOneToOne: One;
  referencedRelation: Ref;
  referencedColumns: ["id"];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      pedal_models: {
        Row: {
          id: string;
          name: string;
          slug: string;
          config: PedalModelConfig;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          config: PedalModelConfig;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pedal_models"]["Insert"]>;
        Relationships: [];
      };
      bands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          cover_url: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          cover_url?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bands"]["Insert"]>;
        Relationships: [Rel<"bands_created_by_fkey", "created_by", "profiles">];
      };
      songs: {
        Row: {
          id: string;
          band_id: string;
          title: string;
          slug: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          band_id: string;
          title: string;
          slug: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["songs"]["Insert"]>;
        Relationships: [
          Rel<"songs_band_id_fkey", "band_id", "bands">,
          Rel<"songs_created_by_fkey", "created_by", "profiles">,
        ];
      };
      uploads: {
        Row: {
          id: string;
          song_id: string;
          user_id: string;
          title: string;
          note: string | null;
          views: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          user_id: string;
          title: string;
          note?: string | null;
          views?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["uploads"]["Insert"]>;
        Relationships: [
          Rel<"uploads_song_id_fkey", "song_id", "songs">,
          Rel<"uploads_user_id_fkey", "user_id", "profiles">,
        ];
      };
      tracks: {
        Row: {
          id: string;
          upload_id: string;
          name: string;
          position: number;
          pedal_model_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          upload_id: string;
          name: string;
          position?: number;
          pedal_model_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracks"]["Insert"]>;
        Relationships: [
          Rel<"tracks_upload_id_fkey", "upload_id", "uploads">,
          Rel<"tracks_pedal_model_id_fkey", "pedal_model_id", "pedal_models">,
        ];
      };
      presets: {
        Row: {
          id: string;
          track_id: string;
          name: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          track_id: string;
          name: string;
          position?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["presets"]["Insert"]>;
        Relationships: [Rel<"presets_track_id_fkey", "track_id", "tracks">];
      };
      /** Uma pedaleira dentro de um preset — ver 0010_preset_boards.sql. */
      preset_boards: {
        Row: {
          id: string;
          preset_id: string;
          pedal_model_id: string;
          settings: PresetSettings;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          preset_id: string;
          pedal_model_id: string;
          settings: PresetSettings;
          position?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["preset_boards"]["Insert"]>;
        Relationships: [
          Rel<"preset_boards_preset_id_fkey", "preset_id", "presets">,
          Rel<"preset_boards_pedal_model_id_fkey", "pedal_model_id", "pedal_models">,
        ];
      };
      votes: {
        Row: {
          id: string;
          upload_id: string;
          user_id: string;
          value: 1 | -1;
          created_at: string;
        };
        Insert: {
          id?: string;
          upload_id: string;
          user_id: string;
          value: 1 | -1;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["votes"]["Insert"]>;
        Relationships: [
          Rel<"votes_upload_id_fkey", "upload_id", "uploads">,
          Rel<"votes_user_id_fkey", "user_id", "profiles">,
        ];
      };
    };
    Views: {
      upload_scores: {
        Row: {
          upload_id: string;
          score: number;
          approvals: number;
          disapprovals: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      /** supabase/migrations/0004_security_limits.sql — 0 = liberado, >0 = segundos de espera */
      consume_rate_limit: {
        Args: { p_bucket: string; p_limit: number; p_window_seconds: number };
        Returns: number;
      };
      /** supabase/migrations/0010_preset_boards.sql */
      create_upload: {
        Args: {
          p_song_id: string;
          p_title: string;
          p_note: string | null;
          p_tracks: Json;
        };
        Returns: string;
      };
      /** supabase/migrations/0010_preset_boards.sql */
      update_upload: {
        Args: {
          p_upload_id: string;
          p_title: string;
          p_note: string | null;
          p_tracks: Json;
        };
        Returns: string;
      };
      /** supabase/migrations/0003_upload_shape.sql */
      increment_upload_views: {
        Args: { p_upload_id: string };
        Returns: undefined;
      };
      /** supabase/migrations/0003_upload_shape.sql */
      search_catalog: {
        Args: { p_query: string; p_limit?: number };
        Returns: {
          kind: "band" | "song";
          id: string;
          title: string;
          slug: string;
          band_name: string;
          band_slug: string;
          uploads_count: number;
          relevance: number;
        }[];
      };
    };
  };
};
