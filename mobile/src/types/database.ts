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
      colleges: {
        Row: {
          college_id: string;
          name: string;
          short_name: string;
          campus_locations: string[];
          email_domain: string;
          city: string;
          state: string;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          college_id: string;
          name: string;
          short_name: string;
          campus_locations?: string[];
          email_domain: string;
          city?: string;
          state?: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          college_id?: string;
          name?: string;
          short_name?: string;
          campus_locations?: string[];
          email_domain?: string;
          city?: string;
          state?: string;
          logo_url?: string | null;
        };
      };
      users: {
        Row: {
          user_id: string;
          auth_user_id: string | null;
          college_id: string | null;
          college_name: string | null;
          prn_or_roll: string | null;
          name: string;
          email: string;
          phone: string | null;
          year_of_study: string;
          branch: string;
          cgpa: number;
          user_type: string;
          bio: string | null;
          skills: string[];
          interests: string[];
          github_handle: string | null;
          linkedin_handle: string | null;
          avatar_url: string | null;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          user_id?: string;
          auth_user_id?: string | null;
          college_id?: string | null;
          college_name?: string | null;
          prn_or_roll?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          year_of_study?: string;
          branch?: string;
          cgpa?: number;
          user_type?: string;
          bio?: string | null;
          skills?: string[];
          interests?: string[];
          github_handle?: string | null;
          linkedin_handle?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          name?: string;
          college_id?: string | null;
          college_name?: string | null;
          prn_or_roll?: string | null;
          phone?: string | null;
          year_of_study?: string;
          branch?: string;
          cgpa?: number;
          bio?: string | null;
          skills?: string[];
          interests?: string[];
          github_handle?: string | null;
          linkedin_handle?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      clubs: {
        Row: {
          club_id: string;
          club_no: string;
          college_id: string;
          name: string;
          short_name: string | null;
          tagline: string | null;
          vertical: string;
          content_visibility: string;
          campus: string;
          workshop_or_room: string | null;
          faculty_mentor: string;
          faculty_designation: string | null;
          president_name: string | null;
          president_contact: string | null;
          established_year: number;
          description: string | null;
          vision: string | null;
          mission: string | null;
          website_url: string | null;
          instagram_handle: string | null;
          linkedin_handle: string | null;
          discord_url: string | null;
          whatsapp_group: string | null;
          official_email: string | null;
          members_count: number;
          followers_count: number;
          open_recruitment: boolean;
          recruitment_deadline: string | null;
          recruitment_roles: string[];
          logo_bg: string;
          status: string;
          updated_at: string;
          created_at: string;
        };
      };
      events: {
        Row: {
          event_id: string;
          club_id: string | null;
          club_name: string | null;
          college_id: string | null;
          college_name: string | null;
          title: string;
          description: string | null;
          event_type: string;
          vertical: string;
          scope: string;
          venue_name: string | null;
          venue_type: string | null;
          room_or_lab_numbers: string | null;
          event_date: string;
          event_time: string;
          ticket_price: number;
          prize_pool: string | null;
          is_hackathon: boolean;
          registered_count: number;
          banner_image_url: string | null;
          academic_year: string;
          status: string;
          created_at: string;
        };
      };
      event_registrations: {
        Row: {
          registration_id: string;
          event_id: string;
          user_id: string;
          college_id: string | null;
          attendee_name: string | null;
          attendee_prn: string | null;
          ticket_tier: string;
          academic_year: string;
          amount_paid: number;
          payment_status: string;
          payment_reference: string | null;
          qr_token: string;
          check_in_status: string;
          check_in_timestamp: string | null;
          registered_at: string;
        };
      };
      competitions: {
        Row: {
          competition_id: string;
          title: string;
          organizer: string;
          organizer_logo_bg: string;
          college_name: string;
          category: string;
          mode: string;
          location: string;
          team_size: string;
          min_team: number;
          max_team: number;
          tags: string[];
          days_left: string;
          deadline_date: string;
          prize_pool: string;
          entry_fee: number;
          registered_count: number;
          description: string | null;
          eligibility: string;
          status: string;
          winner_name: string | null;
          winning_college: string | null;
          created_at: string;
        };
      };
      applications: {
        Row: {
          application_id: string;
          drive_id: string | null;
          club_id: string;
          applicant_id: string;
          applicant_name: string;
          applicant_email: string;
          applicant_prn: string;
          applicant_cgpa: number | null;
          applied_role: string;
          sop_statement: string | null;
          resume_url: string | null;
          interview_score: number | null;
          status: string;
          interview_date: string | null;
          remarks: string | null;
          submitted_at: string;
        };
      };
      notifications: {
        Row: {
          notification_id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
      };
    };
  };
}
