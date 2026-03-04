export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string | null;
          color?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          city: string | null;
          birth_year: number | null;
          notification_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          birth_year?: number | null;
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          birth_year?: number | null;
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          title: string;
          summary: string;
          full_text: string | null;
          pdf_url: string | null;
          category_id: string | null;
          status: "draft" | "open" | "closed" | "archived";
          opens_at: string | null;
          closes_at: string | null;
          source_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          summary: string;
          full_text?: string | null;
          pdf_url?: string | null;
          category_id?: string | null;
          status?: "draft" | "open" | "closed" | "archived";
          opens_at?: string | null;
          closes_at?: string | null;
          source_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          summary?: string;
          full_text?: string | null;
          pdf_url?: string | null;
          category_id?: string | null;
          status?: "draft" | "open" | "closed" | "archived";
          opens_at?: string | null;
          closes_at?: string | null;
          source_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      arguments: {
        Row: {
          id: string;
          subject_id: string;
          author_id: string | null;
          position: "for" | "against";
          title: string;
          body: string;
          sources: string[] | null;
          upvotes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          author_id?: string | null;
          position: "for" | "against";
          title: string;
          body: string;
          sources?: string[] | null;
          upvotes?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          author_id?: string | null;
          position?: "for" | "against";
          title?: string;
          body?: string;
          sources?: string[] | null;
          upvotes?: number;
          created_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          subject_id: string;
          user_id: string;
          value: "for" | "against" | "abstain";
          voted_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          user_id: string;
          value: "for" | "against" | "abstain";
          voted_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          user_id?: string;
          value?: "for" | "against" | "abstain";
          voted_at?: string;
        };
      };
      quiz_questions: {
        Row: {
          id: string;
          subject_id: string;
          question: string;
          options: Json;
          correct_index: number | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          question: string;
          options: Json;
          correct_index?: number | null;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          question?: string;
          options?: Json;
          correct_index?: number | null;
          order_index?: number;
          created_at?: string;
        };
      };
      argument_upvotes: {
        Row: {
          argument_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          argument_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          argument_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      debate_comments: {
        Row: {
          id: string;
          subject_id: string;
          author_id: string | null;
          parent_id: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          author_id?: string | null;
          parent_id?: string | null;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          author_id?: string | null;
          parent_id?: string | null;
          body?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      subject_results: {
        Row: {
          subject_id: string;
          votes_for: number;
          votes_against: number;
          votes_abstain: number;
          total_votes: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
