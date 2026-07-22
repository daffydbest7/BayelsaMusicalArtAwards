export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          user_id: string;
          role: "super_admin" | "site_manager";
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          user_id: string;
          role?: "super_admin" | "site_manager";
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          user_id?: string;
          role?: "super_admin" | "site_manager";
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_users_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      settings: {
        Row: {
          id: number;
          submission_open_at: string | null;
          submission_close_at: string | null;
          voting_open_at: string | null;
          voting_close_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          submission_open_at?: string | null;
          submission_close_at?: string | null;
          voting_open_at?: string | null;
          voting_close_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          submission_open_at?: string | null;
          submission_close_at?: string | null;
          voting_open_at?: string | null;
          voting_close_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          reference_id: string;
          stage_name: string;
          real_name: string;
          phone: string;
          email: string;
          location: string;
          category: string;
          song_title: string;
          media_link: string;
          release_date: string;
          cover_art_url: string;
          photo_url: string;
          instagram: string | null;
          facebook: string | null;
          tiktok: string | null;
          youtube: string | null;
          status: "pending" | "approved" | "rejected";
          rejection_reason: string | null;
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          reference_id: string;
          stage_name: string;
          real_name: string;
          phone: string;
          email: string;
          location: string;
          category: string;
          song_title: string;
          media_link: string;
          release_date: string;
          cover_art_url: string;
          photo_url: string;
          instagram?: string | null;
          facebook?: string | null;
          tiktok?: string | null;
          youtube?: string | null;
          status?: "pending" | "approved" | "rejected";
          rejection_reason?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          id?: string;
          reference_id?: string;
          stage_name?: string;
          real_name?: string;
          phone?: string;
          email?: string;
          location?: string;
          category?: string;
          song_title?: string;
          media_link?: string;
          release_date?: string;
          cover_art_url?: string;
          photo_url?: string;
          instagram?: string | null;
          facebook?: string | null;
          tiktok?: string | null;
          youtube?: string | null;
          status?: "pending" | "approved" | "rejected";
          rejection_reason?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_reviewed_by_fkey";
            columns: ["reviewed_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      votes: {
        Row: {
          id: string;
          submission_id: string;
          category: string;
          voter_fingerprint_hash: string;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          category: string;
          voter_fingerprint_hash: string;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          category?: string;
          voter_fingerprint_hash?: string;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_submission_id_fkey";
            columns: ["submission_id"];
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cast_vote: {
        Args: {
          p_submission_id: string;
          p_category: string;
          p_voter_fingerprint_hash: string;
          p_ip_address: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
