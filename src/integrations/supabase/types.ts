export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      campaign_recipients: {
        Row: {
          campaign_id: string
          clicks: number
          company: string | null
          created_at: string
          email: string
          error_message: string | null
          id: string
          name: string | null
          opens: number
          sent_at: string | null
          status: Database["public"]["Enums"]["campaign_recipient_status"]
          tracking_id: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          clicks?: number
          company?: string | null
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          name?: string | null
          opens?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_recipient_status"]
          tracking_id?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          clicks?: number
          company?: string | null
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          name?: string | null
          opens?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_recipient_status"]
          tracking_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          batch_delay_seconds: number
          batch_size: number
          click_count: number
          created_at: string
          failed_count: number
          from_name: string | null
          html: string
          id: string
          last_batch_at: string | null
          list_id: string | null
          name: string
          open_count: number
          reply_to: string | null
          scheduled_at: string | null
          sent_count: number
          status: Database["public"]["Enums"]["campaign_status"]
          subject: string
          timezone: string | null
          total_recipients: number
          updated_at: string
          user_id: string
        }
        Insert: {
          batch_delay_seconds?: number
          batch_size?: number
          click_count?: number
          created_at?: string
          failed_count?: number
          from_name?: string | null
          html: string
          id?: string
          last_batch_at?: string | null
          list_id?: string | null
          name: string
          open_count?: number
          reply_to?: string | null
          scheduled_at?: string | null
          sent_count?: number
          status?: Database["public"]["Enums"]["campaign_status"]
          subject: string
          timezone?: string | null
          total_recipients?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          batch_delay_seconds?: number
          batch_size?: number
          click_count?: number
          created_at?: string
          failed_count?: number
          from_name?: string | null
          html?: string
          id?: string
          last_batch_at?: string | null
          list_id?: string | null
          name?: string
          open_count?: number
          reply_to?: string | null
          scheduled_at?: string | null
          sent_count?: number
          status?: Database["public"]["Enums"]["campaign_status"]
          subject?: string
          timezone?: string | null
          total_recipients?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "recipient_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          campaign_id: string
          campaign_recipient_id: string
          created_at: string
          event_type: string
          id: string
          ip: string | null
          url: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          campaign_recipient_id: string
          created_at?: string
          event_type: string
          id?: string
          ip?: string | null
          url?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          campaign_recipient_id?: string
          created_at?: string
          event_type?: string
          id?: string
          ip?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_events_campaign_recipient_id_fkey"
            columns: ["campaign_recipient_id"]
            isOneToOne: false
            referencedRelation: "campaign_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          reply_to: string | null
          sender_name: string | null
          signature: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          reply_to?: string | null
          sender_name?: string | null
          signature?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          reply_to?: string | null
          sender_name?: string | null
          signature?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recipient_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      recipients: {
        Row: {
          company: string | null
          created_at: string
          custom_fields: Json | null
          email: string
          id: string
          is_valid: boolean | null
          list_id: string
          name: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email: string
          id?: string
          is_valid?: boolean | null
          list_id: string
          name?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string
          id?: string
          is_valid?: boolean | null
          list_id?: string
          name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipients_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "recipient_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      smtp_settings: {
        Row: {
          from_email: string
          from_name: string | null
          host: string
          password: string
          port: number
          provider: string
          secure: boolean
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          from_email: string
          from_name?: string | null
          host: string
          password: string
          port?: number
          provider?: string
          secure?: boolean
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          from_email?: string
          from_name?: string | null
          host?: string
          password?: string
          port?: number
          provider?: string
          secure?: boolean
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string
          html: string | null
          id: string
          name: string
          subject: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          html?: string | null
          id?: string
          name: string
          subject?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          html?: string | null
          id?: string
          name?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      campaign_recipient_status: "queued" | "sending" | "sent" | "failed"
      campaign_status:
        | "draft"
        | "scheduled"
        | "sending"
        | "sent"
        | "paused"
        | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      campaign_recipient_status: ["queued", "sending", "sent", "failed"],
      campaign_status: [
        "draft",
        "scheduled",
        "sending",
        "sent",
        "paused",
        "failed",
      ],
    },
  },
} as const
