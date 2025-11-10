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
      messages: {
        Row: {
          id: string;
          thread_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
  };
}
