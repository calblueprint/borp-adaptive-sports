export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      photos: {
        Row: {
          created_at: string;
          id: string;
          storage_path: string;
          survey_id: string;
          survey_item_id: string | null;
          uploaded: boolean;
        };
        Insert: {
          created_at?: string;
          id?: string;
          storage_path: string;
          survey_id: string;
          survey_item_id?: string | null;
          uploaded?: boolean;
        };
        Update: {
          created_at?: string;
          id?: string;
          storage_path?: string;
          survey_id?: string;
          survey_item_id?: string | null;
          uploaded?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'photos_survey_id_fkey';
            columns: ['survey_id'];
            isOneToOne: false;
            referencedRelation: 'surveys';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'photos_survey_item_id_fkey';
            columns: ['survey_item_id'];
            isOneToOne: false;
            referencedRelation: 'survey_items';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          affiliation: string | null;
          created_at: string;
          email: string;
          id: string;
          mobility_device: string | null;
          name: string;
          phone_number: string | null;
          role: Database['public']['Enums']['role'];
        };
        Insert: {
          affiliation?: string | null;
          created_at?: string;
          email: string;
          id: string;
          mobility_device?: string | null;
          name: string;
          phone_number?: string | null;
          role?: Database['public']['Enums']['role'];
        };
        Update: {
          affiliation?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          mobility_device?: string | null;
          name?: string;
          phone_number?: string | null;
          role?: Database['public']['Enums']['role'];
        };
        Relationships: [];
      };
      sites: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          lat: number;
          lng: number;
          name: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          lat: number;
          lng: number;
          name: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          lat?: number;
          lng?: number;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sites_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      survey_items: {
        Row: {
          created_at: string;
          id: string;
          item_order: number;
          lat: number | null;
          lng: number | null;
          notes: string | null;
          survey_id: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_order: number;
          lat?: number | null;
          lng?: number | null;
          notes?: string | null;
          survey_id: string;
          type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_order?: number;
          lat?: number | null;
          lng?: number | null;
          notes?: string | null;
          survey_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'survey_items_survey_id_fkey';
            columns: ['survey_id'];
            isOneToOne: false;
            referencedRelation: 'surveys';
            referencedColumns: ['id'];
          },
        ];
      };
      surveys: {
        Row: {
          accessible_facilities: string[] | null;
          accessible_parking_spaces: string | null;
          accessible_restroom: string | null;
          accessible_visitor_center: boolean | null;
          activities: string[] | null;
          created_at: string;
          dog_policy: string | null;
          id: string;
          parking_level: boolean | null;
          parking_surface: string | null;
          region: string | null;
          restroom_type: string[] | null;
          review_notes: string | null;
          reviewer_id: string | null;
          site_id: string;
          site_type: string[] | null;
          status: string;
          submitted_at: string | null;
          surveyor_id: string;
          trail_length_m: number | null;
          trail_surface: string | null;
          trail_width_m: number | null;
          updated_at: string;
          van_accessible: boolean | null;
          version: number;
          visitor_center_notes: string | null;
        };
        Insert: {
          accessible_facilities?: string[] | null;
          accessible_parking_spaces?: string | null;
          accessible_restroom?: string | null;
          accessible_visitor_center?: boolean | null;
          activities?: string[] | null;
          created_at?: string;
          dog_policy?: string | null;
          id?: string;
          parking_level?: boolean | null;
          parking_surface?: string | null;
          region?: string | null;
          restroom_type?: string[] | null;
          review_notes?: string | null;
          reviewer_id?: string | null;
          site_id: string;
          site_type?: string[] | null;
          status?: string;
          submitted_at?: string | null;
          surveyor_id: string;
          trail_length_m?: number | null;
          trail_surface?: string | null;
          trail_width_m?: number | null;
          updated_at?: string;
          van_accessible?: boolean | null;
          version?: number;
          visitor_center_notes?: string | null;
        };
        Update: {
          accessible_facilities?: string[] | null;
          accessible_parking_spaces?: string | null;
          accessible_restroom?: string | null;
          accessible_visitor_center?: boolean | null;
          activities?: string[] | null;
          created_at?: string;
          dog_policy?: string | null;
          id?: string;
          parking_level?: boolean | null;
          parking_surface?: string | null;
          region?: string | null;
          restroom_type?: string[] | null;
          review_notes?: string | null;
          reviewer_id?: string | null;
          site_id?: string;
          site_type?: string[] | null;
          status?: string;
          submitted_at?: string | null;
          surveyor_id?: string;
          trail_length_m?: number | null;
          trail_surface?: string | null;
          trail_width_m?: number | null;
          updated_at?: string;
          van_accessible?: boolean | null;
          version?: number;
          visitor_center_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'surveys_reviewer_id_fkey';
            columns: ['reviewer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'surveys_site_id_fkey';
            columns: ['site_id'];
            isOneToOne: false;
            referencedRelation: 'sites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'surveys_surveyor_id_fkey';
            columns: ['surveyor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      trail_sessions: {
        Row: {
          created_at: string;
          device_id: string;
          device_session_id: string;
          elevation_absolute: boolean | null;
          elevation_gain_m: number | null;
          elevation_preview: Json | null;
          elevation_source: string | null;
          ended_at: string;
          id: string;
          max_elevation_m: number | null;
          point_count: number;
          recorded_at: string;
          recorded_by: string;
          route: Json;
          storage_path: string;
          survey_id: string | null;
          total_distance_meters: number;
          track_bytes: number;
        };
        Insert: {
          created_at?: string;
          device_id: string;
          device_session_id: string;
          elevation_absolute?: boolean | null;
          elevation_gain_m?: number | null;
          elevation_preview?: Json | null;
          elevation_source?: string | null;
          ended_at: string;
          id?: string;
          max_elevation_m?: number | null;
          point_count: number;
          recorded_at: string;
          recorded_by?: string;
          route: Json;
          storage_path: string;
          survey_id?: string | null;
          total_distance_meters: number;
          track_bytes: number;
        };
        Update: {
          created_at?: string;
          device_id?: string;
          device_session_id?: string;
          elevation_absolute?: boolean | null;
          elevation_gain_m?: number | null;
          elevation_preview?: Json | null;
          elevation_source?: string | null;
          ended_at?: string;
          id?: string;
          max_elevation_m?: number | null;
          point_count?: number;
          recorded_at?: string;
          recorded_by?: string;
          route?: Json;
          storage_path?: string;
          survey_id?: string | null;
          total_distance_meters?: number;
          track_bytes?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'trail_sessions_survey_id_fkey';
            columns: ['survey_id'];
            isOneToOne: false;
            referencedRelation: 'surveys';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      account_email_exists: {
        Args: { email_to_check: string };
        Returns: boolean;
      };
    };
    Enums: {
      role: 'surveyor' | 'admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      role: ['surveyor', 'admin'],
    },
  },
} as const;
