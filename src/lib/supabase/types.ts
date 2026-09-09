/**
 * Supabase Database type definitions
 *
 * Manually maintained to match migrations 001–002.
 * When Supabase CLI is connected: replace with `supabase gen types typescript`
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  // Required by @supabase/supabase-js ≥2.100 for proper overload resolution
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      homes: {
        Row: {
          id: string;
          name: string;
          address: string;
          phone: string | null;
          ofsted_urn: string | null;
          registered_manager_id: string | null;
          responsible_individual_id: string | null;
          max_beds: number;
          current_occupancy: number;
          last_inspection_date: string | null;
          last_inspection_grade: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["homes"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["homes"]["Insert"]>;
        Relationships: [];
      };

      cs_communication_drafts: {
        Row: {
          id: string;
          home_id: string;
          communication_type: string;
          title: string;
          content: string;
          recipient_context: string | null;
          child_id: string | null;
          staff_id: string | null;
          linked_entity_type: string | null;
          linked_entity_id: string | null;
          status: string;
          cara_generated: boolean;
          cara_prompt_used: string | null;
          edited_by: string | null;
          edited_at: string | null;
          approved_by: string | null;
          approved_at: string | null;
          sent_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cs_communication_drafts"]["Row"]> & {
          home_id: string;
          communication_type: string;
          title: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["cs_communication_drafts"]["Insert"]>;
        Relationships: [];
      };
      staff_members: {
        Row: {
          id: string;
          home_id: string;
          auth_user_id: string | null;
          first_name: string;
          last_name: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          role: string;
          job_title: string;
          employment_type: string;
          employment_status: string;
          start_date: string;
          end_date: string | null;
          probation_end_date: string | null;
          contracted_hours: number;
          hourly_rate: number | null;
          annual_salary: number | null;
          payroll_id: string | null;
          dbs_number: string | null;
          dbs_issue_date: string | null;
          dbs_update_service: boolean;
          right_to_work_checked_date: string | null;
          right_to_work_checked_by: string | null;
          barred_list_checked_date: string | null;
          barred_list_checked_by: string | null;
          prohibition_checked_date: string | null;
          prohibition_checked_by: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          next_supervision_due: string | null;
          next_appraisal_due: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["staff_members"]["Row"], "id" | "full_name" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["staff_members"]["Insert"]>;
        Relationships: [];
      };

      young_people: {
        Row: {
          id: string;
          home_id: string;
          first_name: string;
          last_name: string;
          preferred_name: string | null;
          date_of_birth: string;
          gender: string | null;
          ethnicity: string | null;
          religion: string | null;
          placement_start: string;
          placement_end: string | null;
          placement_type: string | null;
          local_authority: string;
          social_worker_name: string | null;
          social_worker_phone: string | null;
          social_worker_email: string | null;
          iro_name: string | null;
          iro_phone: string | null;
          key_worker_id: string | null;
          secondary_worker_id: string | null;
          legal_status: string;
          risk_flags: string[];
          dietary_requirements: string | null;
          allergies: string[];
          gp_name: string | null;
          gp_phone: string | null;
          school_name: string | null;
          school_contact: string | null;
          photo_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["young_people"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["young_people"]["Insert"]>;
        Relationships: [];
      };

      tasks: {
        Row: {
          id: string;
          home_id: string;
          title: string;
          description: string;
          category: string;
          priority: string;
          status: string;
          assigned_to: string | null;
          assigned_role: string | null;
          due_date: string | null;
          start_date: string | null;
          completed_at: string | null;
          completed_by: string | null;
          estimated_minutes: number | null;
          actual_minutes: number | null;
          recurring: boolean;
          recurring_schedule: string | null;
          requires_sign_off: boolean;
          signed_off_by: string | null;
          signed_off_at: string | null;
          evidence_note: string | null;
          evidence_files: string[];
          escalated: boolean;
          escalated_to: string | null;
          escalated_at: string | null;
          escalation_reason: string | null;
          linked_child_id: string | null;
          linked_incident_id: string | null;
          linked_document_id: string | null;
          parent_task_id: string | null;
          tags: string[];
          auto_generated: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["tasks"]["Row"], "created_at" | "updated_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [];
      };

      incidents: {
        Row: {
          id: string;
          home_id: string;
          reference: string;
          type: string;
          severity: string;
          child_id: string;
          date: string;
          time: string | null;
          location: string | null;
          description: string;
          immediate_action: string;
          reported_by: string;
          witnesses: string[];
          body_map_required: boolean;
          body_map_completed: boolean;
          body_map_url: string | null;
          notifications: Json;
          requires_oversight: boolean;
          oversight_note: string | null;
          oversight_by: string | null;
          oversight_at: string | null;
          status: string;
          outcome: string | null;
          lessons_learned: string | null;
          linked_task_ids: string[];
          linked_document_ids: string[];
          cara_oversight_used: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["incidents"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["incidents"]["Insert"]>;
        Relationships: [];
      };

      shifts: {
        Row: {
          id: string;
          home_id: string;
          staff_id: string | null;
          date: string;
          shift_type: string;
          start_time: string;
          end_time: string;
          break_minutes: number;
          actual_start: string | null;
          actual_end: string | null;
          clock_in_at: string | null;
          clock_out_at: string | null;
          overtime_minutes: number;
          notes: string | null;
          status: string;
          is_open_shift: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["shifts"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["shifts"]["Insert"]>;
        Relationships: [];
      };

      leave_requests: {
        Row: {
          id: string;
          home_id: string;
          staff_id: string;
          leave_type: string;
          start_date: string;
          end_date: string;
          total_days: number;
          reason: string | null;
          status: string;
          approved_by: string | null;
          approved_at: string | null;
          return_to_work_required: boolean;
          return_to_work_completed: boolean;
          return_to_work_date: string | null;
          return_to_work_by: string | null;
          return_to_work_notes: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["leave_requests"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["leave_requests"]["Insert"]>;
        Relationships: [];
      };

      medications: {
        Row: {
          id: string;
          home_id: string;
          child_id: string;
          name: string;
          type: string;
          dosage: string;
          frequency: string;
          route: string;
          prescriber: string;
          pharmacy: string | null;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          stock_count: number | null;
          stock_last_checked: string | null;
          side_effects: string | null;
          special_instructions: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["medications"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["medications"]["Insert"]>;
        Relationships: [];
      };

      medication_administrations: {
        Row: {
          id: string;
          home_id: string;
          medication_id: string;
          child_id: string;
          scheduled_time: string;
          actual_time: string | null;
          status: string;
          administered_by: string | null;
          witnessed_by: string | null;
          dose_given: string | null;
          reason_not_given: string | null;
          notes: string | null;
          prn_reason: string | null;
          prn_effectiveness: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["medication_administrations"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["medication_administrations"]["Insert"]>;
        Relationships: [];
      };

      daily_log_entries: {
        Row: {
          id: string;
          home_id: string;
          child_id: string;
          date: string;
          time: string | null;
          entry_type: string;
          content: string;
          mood_score: number | null;
          staff_id: string;
          linked_incident_id: string | null;
          is_significant: boolean;
          auto_generated: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["daily_log_entries"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["daily_log_entries"]["Insert"]>;
        Relationships: [];
      };

      handovers: {
        Row: {
          id: string;
          home_id: string;
          shift_date: string;
          shift_from: string;
          shift_to: string;
          handover_time: string | null;
          completed_at: string | null;
          outgoing_staff: string[];
          incoming_staff: string[];
          created_by: string;
          signed_off_by: string | null;
          child_updates: Json;
          general_notes: string;
          flags: string[];
          linked_incident_ids: string[];
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["handovers"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["handovers"]["Insert"]>;
        Relationships: [];
      };

      training_records: {
        Row: {
          id: string;
          home_id: string;
          staff_id: string;
          course_name: string;
          category: string;
          provider: string | null;
          completed_date: string | null;
          expiry_date: string | null;
          certificate_url: string | null;
          status: string;
          is_mandatory: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["training_records"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["training_records"]["Insert"]>;
        Relationships: [];
      };

      supervisions: {
        Row: {
          id: string;
          home_id: string;
          staff_id: string;
          supervisor_id: string;
          type: string;
          scheduled_date: string;
          actual_date: string | null;
          duration_minutes: number | null;
          status: string;
          discussion_points: string;
          actions_agreed: Json;
          wellbeing_score: number | null;
          staff_signature: boolean;
          supervisor_signature: boolean;
          next_date: string | null;
          linked_document_id: string | null;
          cara_assist_used: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["supervisions"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["supervisions"]["Insert"]>;
        Relationships: [];
      };

      documents: {
        Row: {
          id: string;
          home_id: string;
          title: string;
          category: string;
          description: string | null;
          file_url: string;
          file_name: string;
          file_size: number;
          mime_type: string | null;
          version: number;
          previous_version_id: string | null;
          requires_read_sign: boolean;
          linked_child_id: string | null;
          linked_staff_id: string | null;
          linked_incident_id: string | null;
          expiry_date: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["documents"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
        Relationships: [];
      };

      document_read_receipts: {
        Row: {
          id: string;
          document_id: string;
          staff_id: string;
          read_at: string;
          signed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["document_read_receipts"]["Row"], "id" | "read_at"> & { id?: string; read_at?: string };
        Update: Partial<Database["public"]["Tables"]["document_read_receipts"]["Insert"]>;
        Relationships: [];
      };

      expenses: {
        Row: {
          id: string;
          home_id: string;
          submitted_by: string;
          category: string;
          description: string;
          amount: number;
          receipt_url: string | null;
          date: string;
          status: string;
          approved_by: string | null;
          approved_at: string | null;
          linked_child_id: string | null;
          payment_method: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["expenses"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
        Relationships: [];
      };

      care_forms: {
        Row: {
          id: string;
          home_id: string;
          title: string;
          form_type: string;
          status: string;
          linked_child_id: string | null;
          linked_staff_id: string | null;
          linked_incident_id: string | null;
          linked_shift_id: string | null;
          linked_task_id: string | null;
          description: string;
          body: Json;
          submitted_at: string | null;
          submitted_by: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          approved_at: string | null;
          approved_by: string | null;
          due_date: string | null;
          priority: string;
          tags: string[];
          cara_assist_used: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["care_forms"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["care_forms"]["Insert"]>;
        Relationships: [];
      };

      qa_audits: {
        Row: {
          id: string;
          home_id: string;
          title: string;
          category: string;
          date: string | null;
          completed_by: string | null;
          score: number | null;
          max_score: number | null;
          status: string;
          findings: string;
          actions: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["qa_audits"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["qa_audits"]["Insert"]>;
        Relationships: [];
      };

      // The plan staff read while a child is escalating. The ten clinical
      // sections are arrays of objects (behaviours, triggers, de-escalation
      // stages, strategies, rewards, boundaries, safety plan, professional
      // input, restrictive interventions, review history) — jsonb, defaulting
      // to [] so an unfilled section reads as empty rather than null.
      behaviour_support_plans: {
        Row: {
          id: string;
          home_id: string;
          child_id: string;
          created_date: string | null;
          created_by: string | null;
          review_date: string | null;
          last_reviewed: string | null;
          status: string;
          diagnosis: string[];
          primary_behaviours: Json;
          known_triggers: Json;
          early_warnings: string[];
          de_escalation: Json;
          positive_strategies: Json;
          rewards: Json;
          boundaries: Json;
          safety_plan: Json;
          communication_needs: string;
          sensory_considerations: string;
          child_views: string;
          parent_views: string;
          professional_input: Json;
          staff_guidance: string[];
          restrictive_interventions: Json;
          review_history: Json;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["behaviour_support_plans"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["behaviour_support_plans"]["Insert"]>;
        Relationships: [];
      };

      maintenance_items: {
        Row: {
          id: string;
          home_id: string;
          title: string;
          category: string;
          priority: string;
          status: string;
          due_date: string | null;
          assigned_to: string | null;
          notes: string;
          recurring: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["maintenance_items"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["maintenance_items"]["Insert"]>;
        Relationships: [];
      };

      missing_episodes: {
        Row: {
          id: string;
          home_id: string;
          reference: string;
          child_id: string;
          date_missing: string;
          time_missing: string | null;
          date_returned: string | null;
          time_returned: string | null;
          duration_hours: number | null;
          risk_level: string;
          location_last_seen: string;
          return_location: string | null;
          reported_to_police: boolean;
          police_reference: string | null;
          reported_to_la: boolean;
          la_notified_at: string | null;
          return_interview_completed: boolean;
          return_interview_by: string | null;
          return_interview_date: string | null;
          return_interview_notes: string | null;
          contextual_safeguarding_risk: boolean | null;
          linked_incident_id: string | null;
          pattern_notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["missing_episodes"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["missing_episodes"]["Insert"]>;
        Relationships: [];
      };

      chronology_entries: {
        Row: {
          id: string;
          home_id: string;
          child_id: string;
          date: string;
          time: string | null;
          category: string;
          title: string;
          description: string;
          significance: string;
          recorded_by: string;
          linked_incident_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["chronology_entries"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["chronology_entries"]["Insert"]>;
        Relationships: [];
      };

      buildings: {
        Row: {
          id: string;
          home_id: string;
          name: string;
          type: string;
          address: string | null;
          areas: string[];
          gas_cert_expiry: string | null;
          electrical_cert_expiry: string | null;
          fire_risk_assessment_date: string | null;
          epc_rating: string | null;
          last_full_inspection: string | null;
          next_inspection_due: string | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["buildings"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["buildings"]["Insert"]>;
        Relationships: [];
      };

      building_checks: {
        Row: {
          id: string;
          home_id: string;
          building_id: string;
          area: string;
          check_type: string;
          check_date: string;
          due_date: string | null;
          responsible_person: string | null;
          status: string;
          result: string | null;
          risk_level: string | null;
          notes: string | null;
          action_required: string | null;
          action_due: string | null;
          manager_oversight: boolean;
          linked_maintenance_id: string | null;
          evidence_urls: string[];
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["building_checks"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["building_checks"]["Insert"]>;
        Relationships: [];
      };

      vehicles: {
        Row: {
          id: string;
          home_id: string;
          registration: string;
          make: string;
          model: string;
          colour: string | null;
          year: number | null;
          seats: number;
          mot_expiry: string | null;
          insurance_expiry: string | null;
          tax_expiry: string | null;
          last_service: string | null;
          next_service_due: string | null;
          mileage: number;
          status: string;
          breakdown_cover: string | null;
          breakdown_ref: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["vehicles"]["Insert"]>;
        Relationships: [];
      };

      vehicle_checks: {
        Row: {
          id: string;
          home_id: string;
          vehicle_id: string;
          check_type: string;
          check_date: string;
          driver: string | null;
          tyres: string | null;
          lights: string | null;
          brakes: string | null;
          mirrors: string | null;
          fluids: string | null;
          wipers: string | null;
          cleanliness: string | null;
          mileage_start: number | null;
          mileage_end: number | null;
          fuel_level: string | null;
          overall_result: string;
          defects: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["vehicle_checks"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["vehicle_checks"]["Insert"]>;
        Relationships: [];
      };

      notifications: {
        Row: {
          id: string;
          home_id: string;
          recipient_id: string;
          title: string;
          body: string;
          type: string;
          priority: string;
          read: boolean;
          read_at: string | null;
          action_url: string | null;
          entity_type: string | null;
          entity_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };

      audit_log: {
        Row: {
          id: string;
          home_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          changes: Json | null;
          performed_by: string | null;
          performed_at: string;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["audit_log"]["Row"], "id" | "performed_at"> & { id?: string };
        Update: never; // audit log is immutable
        Relationships: [];
      };

      cara_interactions: {
        Row: {
          id: string;
          home_id: string;
          staff_id: string;
          mode: string;
          style: string;
          page_context: string | null;
          record_type: string | null;
          prompt_tokens: number | null;
          completion_tokens: number | null;
          response_accepted: boolean | null;
          response_edited: boolean | null;
          linked_entity_id: string | null;
          linked_entity_type: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["cara_interactions"]["Row"], "id" | "created_at"> & { id?: string };
        Update: never;
        Relationships: [];
      };

      time_saved_entries: {
        Row: {
          id: string;
          home_id: string;
          staff_id: string;
          action_type: string;
          minutes_saved: number;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["time_saved_entries"]["Row"], "id" | "created_at"> & { id?: string };
        Update: never;
        Relationships: [];
      };

      // ── Care Events Pipeline ─────────────────────────────────────────────────

      care_events: {
        Row: {
          id: string;
          home_id: string;
          staff_id: string;
          child_ids: string[];
          shift_id: string | null;
          category: string;
          status: string;
          title: string;
          body: string;
          evidence_prompts_completed: boolean;
          routing_preview: Json;
          routes_completed: number;
          routes_failed: number;
          requires_manager_review: boolean;
          requires_reg40_triage: boolean;
          contributes_to_reg45: boolean;
          contributes_to_annex_a: boolean;
          manager_review_by: string | null;
          manager_review_at: string | null;
          manager_review_notes: string | null;
          verified_at: string | null;
          verified_by: string | null;
          locked_at: string | null;
          locked_by: string | null;
          returned_at: string | null;
          returned_by: string | null;
          return_reason: string | null;
          version: number;
          previous_version_id: string | null;
          amendment_reason: string | null;
          amended_at: string | null;
          amended_by: string | null;
          cara_suggested_category: string | null;
          cara_suggested_routes: Json | null;
          cara_suggested_summary: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["care_events"]["Row"]> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["care_events"]["Insert"]>;
        Relationships: [];
      };

      care_event_routes: {
        Row: {
          id: string;
          care_event_id: string;
          home_id: string;
          route_type: string;
          status: string;
          linked_record_id: string | null;
          linked_record_type: string | null;
          error_message: string | null;
          retry_count: number;
          last_attempted_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["care_event_routes"]["Row"]> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["care_event_routes"]["Insert"]>;
        Relationships: [];
      };

      care_event_jobs: {
        Row: {
          id: string;
          care_event_id: string;
          home_id: string;
          job_type: string;
          status: string;
          payload: Json | null;
          result: Json | null;
          error_message: string | null;
          attempts: number;
          max_attempts: number;
          run_after: string;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["care_event_jobs"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["care_event_jobs"]["Insert"]>;
        Relationships: [];
      };

      care_event_audit_log: {
        Row: {
          id: string;
          care_event_id: string;
          home_id: string;
          action: string;
          actor_id: string | null;
          detail: Json | null;
          performed_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["care_event_audit_log"]["Row"], "id" | "performed_at"> & { id?: string };
        Update: never;
        Relationships: [];
      };

      reg45_evidence_queue: {
        Row: {
          id: string;
          home_id: string;
          care_event_id: string;
          suggested_section: string | null;
          suggested_text: string;
          status: string;
          manager_decision: string | null;
          manager_notes: string | null;
          manager_id: string | null;
          decided_at: string | null;
          approved_text: string | null;
          source_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reg45_evidence_queue"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["reg45_evidence_queue"]["Insert"]>;
        Relationships: [];
      };

      annex_a_evidence_queue: {
        Row: {
          id: string;
          home_id: string;
          care_event_id: string;
          annex_a_section: string;
          suggested_text: string;
          status: string;
          manager_decision: string | null;
          manager_notes: string | null;
          manager_id: string | null;
          decided_at: string | null;
          approved_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["annex_a_evidence_queue"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["annex_a_evidence_queue"]["Insert"]>;
        Relationships: [];
      };

      child_daily_summaries: {
        Row: {
          id: string;
          home_id: string;
          child_id: string;
          summary_date: string;
          care_event_ids: string[];
          mood_overall: string | null;
          sleep_quality: string | null;
          food_intake: string | null;
          key_events: string;
          positives: string;
          concerns: string;
          staff_notes: string;
          education_attended: boolean | null;
          medication_administered: boolean | null;
          review_required: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["child_daily_summaries"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["child_daily_summaries"]["Insert"]>;
        Relationships: [];
      };

      management_oversight_tasks: {
        Row: {
          id: string;
          care_event_id: string;
          home_id: string;
          child_ids: string[];
          category: string;
          priority: string;
          title: string;
          summary: string;
          status: string;
          assigned_to: string | null;
          due_date: string | null;
          completed_at: string | null;
          completed_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["management_oversight_tasks"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["management_oversight_tasks"]["Insert"]>;
        Relationships: [];
      };

      reg40_tasks: {
        Row: {
          id: string;
          care_event_id: string;
          home_id: string;
          category: string;
          severity: string;
          title: string;
          description: string;
          status: string;
          triage_decision: string | null;
          triage_notes: string | null;
          triaged_by: string | null;
          triaged_at: string | null;
          notification_sent: boolean;
          notification_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reg40_tasks"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["reg40_tasks"]["Insert"]>;
        Relationships: [];
      };

      filing_cabinet_items: {
        Row: {
          id: string;
          care_event_id: string;
          home_id: string;
          child_ids: string[];
          category: string;
          title: string;
          summary: string;
          file_date: string;
          status: string;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["filing_cabinet_items"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["filing_cabinet_items"]["Insert"]>;
        Relationships: [];
      };

      saved_time_metrics: {
        Row: {
          id: string;
          care_event_id: string;
          home_id: string;
          staff_id: string;
          routes_count: number;
          estimated_minutes_saved: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["saved_time_metrics"]["Row"], "id" | "created_at"> & { id?: string };
        Update: never;
        Relationships: [];
      };

      vacancies: {
        Row: {
          id: string;
          home_id: string;
          title: string;
          role_code: string;
          employment_type: string;
          contract_type: string;
          salary_min: number | null;
          salary_max: number | null;
          hours: number | null;
          shift_pattern: string | null;
          reports_to: string | null;
          safeguarding_statement: string;
          status: string;
          approval_status: string;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["vacancies"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["vacancies"]["Insert"]>;
        Relationships: [];
      };

      candidate_profiles: {
        Row: {
          id: string;
          home_id: string;
          vacancy_id: string | null;
          first_name: string;
          last_name: string;
          preferred_name: string | null;
          email: string;
          phone: string | null;
          dob: string | null;
          current_address: string | null;
          source: string | null;
          current_stage: string;
          compliance_status: string;
          risk_level: string;
          shortlisted: boolean;
          appointed: boolean;
          assigned_manager_id: string | null;
          cv_url: string | null;
          application_form_url: string | null;
          cover_letter_url: string | null;
          adjustments_requested: boolean;
          adjustments_notes: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["candidate_profiles"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["candidate_profiles"]["Insert"]>;
        Relationships: [];
      };

      candidate_checks: {
        Row: {
          id: string;
          candidate_id: string;
          check_type: string;
          status: string;
          required: boolean;
          owner_id: string | null;
          due_date: string | null;
          requested_at: string | null;
          received_at: string | null;
          verified_at: string | null;
          verified_by: string | null;
          concern_flag: boolean;
          concern_summary: string | null;
          override_used: boolean;
          override_reason: string | null;
          overridden_by: string | null;
          overridden_at: string | null;
          certificate_number: string | null;
          document_type: string | null;
          document_expiry: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["candidate_checks"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["candidate_checks"]["Insert"]>;
        Relationships: [];
      };

      candidate_references: {
        Row: {
          id: string;
          candidate_id: string;
          referee_name: string;
          referee_role: string | null;
          organisation_name: string | null;
          email: string | null;
          phone: string | null;
          relationship_to_candidate: string | null;
          is_most_recent_employer: boolean;
          requested_at: string | null;
          chased_at: string | null;
          received_at: string | null;
          structured_response: Json | null;
          verbal_verification_completed: boolean;
          verbal_verified_by: string | null;
          verbal_verified_at: string | null;
          discrepancy_flag: boolean;
          discrepancy_notes: string | null;
          reliability_rating: number | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["candidate_references"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["candidate_references"]["Insert"]>;
        Relationships: [];
      };

      generic_records: {
        Row: {
          id: string;
          home_id: string;
          record_type: string;
          data: Json;
          child_id: string | null;
          staff_id: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["generic_records"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["generic_records"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_sources: {
        Row: {
          id: string;
          home_id: string | null;
          child_id: string | null;
          staff_id: string | null;
          linked_record_id: string | null;
          linked_record_type: string | null;
          source_type: string | null;
          title: string | null;
          summary: string | null;
          content: string | null;
          extracted_text: string | null;
          source_date: string | null;
          category: string | null;
          tags: Json | null;
          confidentiality_level: string | null;
          approval_status: string | null;
          is_sensitive: boolean | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_sources"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_sources"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_artifacts: {
        Row: {
          id: string;
          home_id: string | null;
          artifact_type: string | null;
          title: string | null;
          status: string | null;
          child_id: string | null;
          staff_id: string | null;
          incident_id: string | null;
          linked_record_id: string | null;
          linked_record_type: string | null;
          framework: string | null;
          tone: string | null;
          creative_mode: string | null;
          generated_content: string | null;
          structured_content: Json | null;
          plain_text_content: string | null;
          quality_score: number | null;
          evidence_confidence_score: number | null;
          safeguarding_level: string | null;
          regulation_relevance: Json | null;
          created_by: string | null;
          reviewed_by: string | null;
          approved_by: string | null;
          committed_by: string | null;
          rejected_by: string | null;
          created_at: string;
          submitted_for_review_at: string | null;
          reviewed_at: string | null;
          approved_at: string | null;
          committed_at: string | null;
          rejected_at: string | null;
          archived_at: string | null;
          version_number: number | null;
          filing_cabinet_path: string | null;
          official_record_id: string | null;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_artifacts"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_artifacts"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_artifact_sources: {
        Row: {
          id: string;
          artifact_id: string | null;
          source_id: string | null;
          relevance_reason: string | null;
          confidence_level: string | null;
          confidence_score: number | null;
          source_strength: string | null;
          is_primary_evidence: boolean | null;
          is_child_voice: boolean | null;
          is_contradicted: boolean | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_artifact_sources"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_artifact_sources"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_artifact_versions: {
        Row: {
          id: string;
          artifact_id: string | null;
          version_number: number | null;
          title: string | null;
          content: string | null;
          structured_content: Json | null;
          change_summary: string | null;
          changed_by: string | null;
          changed_at: string | null;
          previous_version_id: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_artifact_versions"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_artifact_versions"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_artifact_reviews: {
        Row: {
          id: string;
          artifact_id: string | null;
          reviewer_id: string | null;
          review_status: string | null;
          review_comment: string | null;
          requested_changes: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_artifact_reviews"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_artifact_reviews"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_artifact_actions: {
        Row: {
          id: string;
          artifact_id: string | null;
          task_id: string | null;
          action_title: string | null;
          action_description: string | null;
          assigned_to: string | null;
          due_date: string | null;
          priority: string | null;
          status: string | null;
          escalation_level: string | null;
          created_by: string | null;
          created_at: string;
          completed_at: string | null;
          reviewed_at: string | null;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_artifact_actions"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_artifact_actions"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_audit_log: {
        Row: {
          id: string;
          home_id: string | null;
          actor_id: string | null;
          action_type: string | null;
          artifact_id: string | null;
          source_ids: Json | null;
          prompt_summary: string | null;
          model_provider: string | null;
          model_name: string | null;
          request_metadata: Json | null;
          response_metadata: Json | null;
          before_state: Json | null;
          after_state: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_audit_log"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_audit_log"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_care_graph_nodes: {
        Row: {
          id: string;
          home_id: string | null;
          node_type: string | null;
          linked_record_id: string | null;
          linked_record_type: string | null;
          label: string | null;
          summary: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_care_graph_nodes"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_care_graph_nodes"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_care_graph_edges: {
        Row: {
          id: string;
          from_node_id: string | null;
          to_node_id: string | null;
          relationship_type: string | null;
          strength: number | null;
          evidence_source_id: string | null;
          confidence_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_care_graph_edges"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_care_graph_edges"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_evidence_assessments: {
        Row: {
          id: string;
          source_id: string | null;
          relevance_score: number | null;
          recency_score: number | null;
          reliability_score: number | null;
          approval_score: number | null;
          corroboration_score: number | null;
          child_voice_score: number | null;
          contradiction_score: number | null;
          overall_confidence_score: number | null;
          evidence_level: string | null;
          assessment_notes: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_evidence_assessments"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_evidence_assessments"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_gaps: {
        Row: {
          id: string;
          home_id: string | null;
          child_id: string | null;
          staff_id: string | null;
          gap_type: string | null;
          severity: string | null;
          title: string | null;
          description: string | null;
          recommended_action: string | null;
          linked_record_id: string | null;
          linked_record_type: string | null;
          status: string | null;
          assigned_to: string | null;
          due_date: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_gaps"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_gaps"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_contradictions: {
        Row: {
          id: string;
          home_id: string | null;
          child_id: string | null;
          source_a_id: string | null;
          source_b_id: string | null;
          contradiction_type: string | null;
          description: string | null;
          severity: string | null;
          recommended_review_action: string | null;
          status: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_contradictions"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_contradictions"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_safeguarding_patterns: {
        Row: {
          id: string;
          home_id: string | null;
          child_id: string | null;
          pattern_type: string | null;
          risk_level: string | null;
          title: string | null;
          description: string | null;
          indicators: Json | null;
          evidence_source_ids: Json | null;
          recommended_actions: Json | null;
          status: string | null;
          created_at: string;
          reviewed_at: string | null;
          resolved_at: string | null;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_safeguarding_patterns"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_safeguarding_patterns"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_home_dynamics: {
        Row: {
          id: string;
          home_id: string | null;
          snapshot_date: string | null;
          summary: string | null;
          emotional_climate: string | null;
          incident_count: number | null;
          missing_episode_count: number | null;
          restraint_count: number | null;
          complaint_count: number | null;
          staff_absence_count: number | null;
          agency_staff_count: number | null;
          education_concerns_count: number | null;
          safeguarding_alerts_count: number | null;
          overdue_actions_count: number | null;
          risk_level: string | null;
          recommended_manager_focus: string | null;
          data: Json | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_home_dynamics"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_home_dynamics"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_early_warnings: {
        Row: {
          id: string;
          home_id: string | null;
          child_id: string | null;
          staff_id: string | null;
          warning_type: string | null;
          risk_level: string | null;
          title: string | null;
          description: string | null;
          indicators: Json | null;
          confidence_score: number | null;
          recommended_action: string | null;
          status: string | null;
          created_at: string;
          reviewed_at: string | null;
          resolved_at: string | null;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_early_warnings"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_early_warnings"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_formulations: {
        Row: {
          id: string;
          home_id: string | null;
          child_id: string | null;
          title: string | null;
          presenting_behaviour: string | null;
          possible_unmet_need: string | null;
          trauma_link: string | null;
          attachment_considerations: string | null;
          triggers: Json | null;
          protective_factors: Json | null;
          relational_strengths: Json | null;
          staff_response_patterns: Json | null;
          what_helps: string | null;
          what_escalates: string | null;
          therapeutic_hypothesis: string | null;
          recommended_intervention: string | null;
          review_date: string | null;
          evidence_source_ids: Json | null;
          created_by: string | null;
          approved_by: string | null;
          created_at: string;
          approved_at: string | null;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_formulations"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_formulations"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_decision_support: {
        Row: {
          id: string;
          home_id: string | null;
          decision_context: string | null;
          child_id: string | null;
          staff_id: string | null;
          known_facts: Json | null;
          unknowns: Json | null;
          risks: Json | null;
          options: Json | null;
          pros_cons: Json | null;
          child_impact: string | null;
          staff_impact: string | null;
          compliance_impact: string | null;
          recommended_next_steps: Json | null;
          evidence_needed: Json | null;
          decision_made_by: string | null;
          decision_recorded_at: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_decision_support"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_decision_support"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_quality_checks: {
        Row: {
          id: string;
          artifact_id: string | null;
          evidence_cited: boolean | null;
          child_voice_considered: boolean | null;
          risk_considered: boolean | null;
          safeguarding_considered: boolean | null;
          regulation_considered: boolean | null;
          actions_clear: boolean | null;
          owner_assigned: boolean | null;
          review_date_set: boolean | null;
          human_approval_complete: boolean | null;
          sensitive_language_reviewed: boolean | null;
          no_unsupported_claims: boolean | null;
          no_ai_style_filler: boolean | null;
          dignity_language_passed: boolean | null;
          overall_passed: boolean | null;
          issues: Json | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_quality_checks"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_quality_checks"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_profiles: {
        Row: {
          id: string;
          organisation_id: string | null;
          home_id: string | null;
          child_id: string | null;
          profile_version: number | null;
          profile_json: Json | null;
          evidence_refs: Json | null;
          risk_flags: string[] | null;
          strengths: string[] | null;
          needs: string[] | null;
          created_by: string | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_profiles"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_profiles"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_generations: {
        Row: {
          id: string;
          organisation_id: string | null;
          home_id: string | null;
          child_id: string | null;
          generation_type: string | null;
          title: string | null;
          brief: string | null;
          tone: string | null;
          audience: string | null;
          status: string | null;
          output_json: Json | null;
          safety_json: Json | null;
          model: string | null;
          created_by: string | null;
          approved_by: string | null;
          approved_at: string | null;
          committed_by: string | null;
          committed_at: string | null;
          created_at: string;
          updated_at: string;
          profile_json: Json | null;
          error: string | null;
          rejected_reason: string | null;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_generations"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_generations"]["Insert"]>;
        Relationships: [];
      };
      cara_studio_commit_links: {
        Row: {
          id: string;
          organisation_id: string | null;
          home_id: string | null;
          generation_id: string | null;
          target_type: string | null;
          target_id: string | null;
          committed_by: string | null;
          committed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_studio_commit_links"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_studio_commit_links"]["Insert"]>;
        Relationships: [];
      };
      child_reports: {
        Row: {
          id: string;
          organisation_id: string;
          home_id: string;
          child_id: string;
          report_type: string;
          audience: string;
          title: string;
          status: string;
          version: number;
          parent_report_id: string | null;
          date_range_start: string;
          date_range_end: string;
          overall_summary: string | null;
          overall_confidence_score: number | null;
          risk_tier: string;
          child_voice_included: boolean;
          evidence_gap_count: number;
          agent_run_id: string | null;
          requested_by: string;
          generated_at: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          approved_by: string | null;
          approved_at: string | null;
          rejection_reason: string | null;
          locked_by: string | null;
          locked_at: string | null;
          filed_document_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["child_reports"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["child_reports"]["Insert"]>;
        Relationships: [];
      };
      child_report_sections: {
        Row: {
          id: string;
          report_id: string;
          section_key: string;
          title: string;
          order: number;
          content: string | null;
          structured_content: Json;
          evidence_status: string;
          confidence_score: number | null;
          evidence_count: number;
          child_voice_present: boolean;
          manager_note: string | null;
          manager_edited: boolean;
          last_edited_by: string | null;
          last_edited_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["child_report_sections"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["child_report_sections"]["Insert"]>;
        Relationships: [];
      };
      child_report_evidence: {
        Row: {
          id: string;
          section_id: string;
          report_id: string;
          source_table: string;
          source_record_id: string;
          source_date: string;
          excerpt: string | null;
          reasoning: string | null;
          relevance_score: number | null;
          is_child_voice: boolean;
          is_primary: boolean;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["child_report_evidence"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["child_report_evidence"]["Insert"]>;
        Relationships: [];
      };
      child_report_actions: {
        Row: {
          id: string;
          report_id: string;
          section_key: string | null;
          action_title: string;
          action_description: string | null;
          assigned_to: string | null;
          assigned_role: string | null;
          due_date: string | null;
          priority: string;
          status: string;
          linked_task_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["child_report_actions"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["child_report_actions"]["Insert"]>;
        Relationships: [];
      };
      regulation45_evidence_items: {
        Row: {
          id: string;
          organisation_id: string;
          home_id: string;
          child_id: string | null;
          month: string;
          year: number;
          category: string;
          title: string;
          description: string | null;
          source_table: string;
          source_record_id: string;
          source_date: string;
          quality_score: number | null;
          is_child_voice: boolean;
          is_safeguarding: boolean;
          is_risk_related: boolean;
          agent_run_id: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          status: string;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["regulation45_evidence_items"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["regulation45_evidence_items"]["Insert"]>;
        Relationships: [];
      };
      cara_agent_runs: {
        Row: {
          id: string;
          organisation_id: string;
          home_id: string;
          agent_id: string;
          status: string;
          triggered_by: string;
          trigger_type: string;
          input_params: Json;
          output_summary: string | null;
          output_data: Json | null;
          error_message: string | null;
          tokens_used: number | null;
          duration_ms: number | null;
          parent_run_id: string | null;
          child_id: string | null;
          report_id: string | null;
          risk_tier: string;
          requires_approval: boolean;
          approved_by: string | null;
          approved_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_agent_runs"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_agent_runs"]["Insert"]>;
        Relationships: [];
      };
      cara_audit_events: {
        Row: {
          id: string;
          organisation_id: string;
          home_id: string;
          event_type: string;
          agent_id: string | null;
          agent_run_id: string | null;
          report_id: string | null;
          actor_id: string;
          actor_role: string;
          action: string;
          target_type: string | null;
          target_id: string | null;
          details: Json;
          risk_tier: string | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cara_audit_events"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cara_audit_events"]["Insert"]>;
        Relationships: [];
      };
      therapeutic_profiles: {
        Row: {
          id: string;
          home_id: string | null;
          child_id: string | null;
          status: string | null;
          version: number | null;
          pre_placement_history: string | null;
          known_trauma_themes: Json | null;
          attachment_presentation: string | null;
          emotional_regulation_needs: Json | null;
          known_triggers: Json | null;
          known_soothing_strategies: Json | null;
          relational_strengths: Json | null;
          staff_relationships: Json | null;
          family_contact_themes: Json | null;
          education_themes: Json | null;
          identity_culture_belonging: Json | null;
          communication_style: string | null;
          neurodiversity_considerations: Json | null;
          risk_themes: Json | null;
          protective_factors: Json | null;
          current_presentation: string | null;
          progress_over_time: Json | null;
          child_voice_entries: Json | null;
          what_staff_need_to_remember: Json | null;
          what_helps: Json | null;
          what_does_not_help: Json | null;
          current_therapeutic_priorities: Json | null;
          approved_by: string | null;
          approved_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["therapeutic_profiles"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["therapeutic_profiles"]["Insert"]>;
        Relationships: [];
      };
      practice_workflow_triggers: {
        Row: {
          id: string;
          home_id: string | null;
          trigger_event: string | null;
          source_table: string | null;
          source_id: string | null;
          child_id: string | null;
          suggestions: Json | null;
          status: string | null;
          actioned_by: string | null;
          actioned_at: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["practice_workflow_triggers"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["practice_workflow_triggers"]["Insert"]>;
        Relationships: [];
      };
      practice_intelligence_scans: {
        Row: {
          id: string;
          home_id: string | null;
          scan_type: string | null;
          scan_date: string | null;
          status: string | null;
          home_dynamics_summary: Json | null;
          child_summaries: Json | null;
          risk_patterns: Json | null;
          practice_drift_alerts: Json | null;
          training_need_alerts: Json | null;
          oversight_prompts: Json | null;
          suggested_plan_updates: Json | null;
          suggested_keywork: Json | null;
          suggested_reflective: Json | null;
          relationship_mapping: Json | null;
          rota_impact_analysis: Json | null;
          staff_consistency: Json | null;
          repeated_triggers: Json | null;
          therapeutic_patterns: Json | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["practice_intelligence_scans"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["practice_intelligence_scans"]["Insert"]>;
        Relationships: [];
      };
      generated_sessions: {
        Row: {
          id: string;
          home_id: string | null;
          child_id: string | null;
          session_type: string | null;
          title: string | null;
          framework: string | null;
          tone: string | null;
          status: string | null;
          content: Json | null;
          evidence_links: Json | null;
          quality_score: number | null;
          scheduled_date: string | null;
          delivered_at: string | null;
          delivered_by: string | null;
          recording_notes: string | null;
          follow_up_actions: Json | null;
          plan_update_suggestions: Json | null;
          approved_by: string | null;
          approved_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["generated_sessions"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["generated_sessions"]["Insert"]>;
        Relationships: [];
      };
      learning_resources: {
        Row: {
          id: string;
          home_id: string | null;
          resource_type: string | null;
          title: string | null;
          description: string | null;
          target_audience: string | null;
          format: string | null;
          content: Json | null;
          preferences: Json | null;
          tags: Json | null;
          framework: string | null;
          reading_level: string | null;
          communication_needs: Json | null;
          neurodiversity_adaptations: Json | null;
          status: string | null;
          use_count: number | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["learning_resources"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["learning_resources"]["Insert"]>;
        Relationships: [];
      };
      framework_mappings: {
        Row: {
          id: string;
          home_id: string | null;
          artifact_id: string | null;
          artifact_type: string | null;
          framework: string | null;
          regulation: string | null;
          quality_standard: string | null;
          sccif_theme: string | null;
          evidence_text: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["framework_mappings"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["framework_mappings"]["Insert"]>;
        Relationships: [];
      };
      management_oversight_drafts: {
        Row: {
          id: string;
          home_id: string | null;
          oversight_type: string | null;
          record_id: string | null;
          record_type: string | null;
          child_id: string | null;
          status: string | null;
          content: Json | null;
          evidence_links: Json | null;
          regulatory_refs: Json | null;
          quality_score: number | null;
          approved_by: string | null;
          approved_at: string | null;
          committed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["management_oversight_drafts"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["management_oversight_drafts"]["Insert"]>;
        Relationships: [];
      };
      hr_staff_profiles: {
        Row: {
          staff_id: string;
          home_id: string | null;
          employment_type: string | null;
          start_date: string | null;
          end_date: string | null;
          contract_hours: number | null;
          contract_type: string | null;
          approved_for_unsupervised: boolean | null;
          approved_at: string | null;
          approved_by: string | null;
          approval_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["hr_staff_profiles"]["Row"], "created_at">> & { staff_id: string };
        Update: Partial<Database["public"]["Tables"]["hr_staff_profiles"]["Insert"]>;
        Relationships: [];
      };
      hr_safer_recruitment: {
        Row: {
          id: string;
          staff_id: string | null;
          home_id: string | null;
          application_form_complete: boolean | null;
          employment_history_full: boolean | null;
          gaps_explored: boolean | null;
          gaps_explanation: string | null;
          identity_check_status: string | null;
          right_to_work_status: string | null;
          enhanced_dbs_status: string | null;
          enhanced_dbs_number: string | null;
          enhanced_dbs_issued: string | null;
          enhanced_dbs_renewal_due: string | null;
          barred_list_check_status: string | null;
          barred_list_complete_at: string | null;
          references_received_count: number | null;
          references_verified_count: number | null;
          interview_notes_present: boolean | null;
          values_based_interview_done: boolean | null;
          qualification_check_done: boolean | null;
          health_declaration_complete: boolean | null;
          recruitment_risk_assessment: string | null;
          induction_plan_present: boolean | null;
          manager_sign_off: boolean | null;
          manager_signed_off_by: string | null;
          manager_signed_off_at: string | null;
          senior_risk_acceptance: boolean | null;
          senior_risk_acceptance_text: string | null;
          senior_risk_acceptance_by: string | null;
          senior_risk_acceptance_at: string | null;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["hr_safer_recruitment"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["hr_safer_recruitment"]["Insert"]>;
        Relationships: [];
      };
      hr_cases: {
        Row: {
          id: string;
          staff_id: string | null;
          home_id: string | null;
          case_type: string | null;
          case_owner: string | null;
          concern_summary: string | null;
          risk_level: string | null;
          safeguarding_status: string | null;
          child_impact_status: string | null;
          status: string | null;
          opened_at: string | null;
          closed_at: string | null;
          closure_summary: string | null;
          learning_actions: Json | null;
          policy_links: Json | null;
          regulation_links: Json | null;
          rationale_for_closure: string | null;
          ri_oversight_required: boolean | null;
          ri_oversight_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["hr_cases"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["hr_cases"]["Insert"]>;
        Relationships: [];
      };
      hr_case_chronology: {
        Row: {
          id: string;
          case_id: string | null;
          occurred_at: string | null;
          entry_type: string | null;
          summary: string | null;
          significance: string | null;
          recorded_by: string | null;
          source_action_id: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["hr_case_chronology"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["hr_case_chronology"]["Insert"]>;
        Relationships: [{ foreignKeyName: "hr_case_chronology_case_id_fkey"; columns: ["case_id"]; isOneToOne: false; referencedRelation: "hr_cases"; referencedColumns: ["id"] }];
      };
      hr_letters: {
        Row: {
          id: string;
          case_id: string | null;
          staff_id: string | null;
          letter_type: string | null;
          status: string | null;
          draft_body: string | null;
          approved_body: string | null;
          approved_by: string | null;
          approved_at: string | null;
          sent_at: string | null;
          guardian_review_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["hr_letters"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["hr_letters"]["Insert"]>;
        Relationships: [];
      };
      hr_process_guardian_reviews: {
        Row: {
          id: string;
          case_id: string | null;
          staff_id: string | null;
          home_id: string | null;
          draft_subject: string | null;
          draft_action_type: string | null;
          draft_body: string | null;
          status: string | null;
          fairness_score: number | null;
          fairness_judgement: string | null;
          acas_alignment: Json | null;
          safeguarding_alignment: Json | null;
          discrimination_risk: Json | null;
          proportionality: Json | null;
          rights_check: Json | null;
          evidence_quality: Json | null;
          wording_risk: Json | null;
          prejudgment_signals: Json | null;
          flags: Json | null;
          suggested_safer_wording: string | null;
          suggested_actions: Json | null;
          regulatory_links: Json | null;
          rejection_reason: string | null;
          rewrite_instructions: string | null;
          approved_by: string | null;
          approved_at: string | null;
          rejected_by: string | null;
          rejected_at: string | null;
          aria_confidence: number | null;
          llm_used: boolean | null;
          engine_version: string | null;
          generated_at: string | null;
          created_at: string;
          updated_at: string;
          cara_confidence: number | null;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["hr_process_guardian_reviews"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["hr_process_guardian_reviews"]["Insert"]>;
        Relationships: [];
      };
      hr_process_guardian_audit_log: {
        Row: {
          id: string;
          review_id: string | null;
          actor_user_id: string | null;
          actor_role: string | null;
          event_type: string | null;
          event_detail: Json | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["hr_process_guardian_audit_log"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["hr_process_guardian_audit_log"]["Insert"]>;
        Relationships: [];
      };
      hr_audit_log: {
        Row: {
          id: string;
          entity_type: string | null;
          entity_id: string | null;
          actor_user_id: string | null;
          actor_role: string | null;
          event_type: string | null;
          event_detail: Json | null;
          ip_address: string | null;
          created_at: string;
          outcome: string | null;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["hr_audit_log"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["hr_audit_log"]["Insert"]>;
        Relationships: [];
      };
      hr_case_actions: {
        Row: {
          id: string;
          case_id: string | null;
          action_type: string | null;
          title: string | null;
          detail: string | null;
          performed_by: string | null;
          performed_at: string | null;
          attachments: Json | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["hr_case_actions"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["hr_case_actions"]["Insert"]>;
        Relationships: [{ foreignKeyName: "hr_case_actions_case_id_fkey"; columns: ["case_id"]; isOneToOne: false; referencedRelation: "hr_cases"; referencedColumns: ["id"] }];
      };
      cs_key_work_sessions: {
        Row: {
          id: string;
          home_id: string | null;
          child_id: string | null;
          key_worker_id: string | null;
          session_type: string | null;
          therapeutic_framework: string | null;
          status: string | null;
          planned_date: string | null;
          completed_date: string | null;
          duration_minutes: number | null;
          location: string | null;
          topics_covered: Json;
          child_voice: string | null;
          child_mood: number | null;
          child_engagement: number | null;
          outcomes: Json;
          actions: Json;
          next_session_topics: Json;
          safeguarding_concerns: string | null;
          positive_observations: Json;
          attachments_count: number | null;
          signed_off_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cs_key_work_sessions"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cs_key_work_sessions"]["Insert"]>;
        Relationships: [];
      };
      cs_behaviour_entries: {
        Row: {
          id: string;
          home_id: string | null;
          child_id: string | null;
          date: string | null;
          time: string | null;
          category: string | null;
          description: string | null;
          antecedent: string | null;
          behaviour: string | null;
          consequence: string | null;
          de_escalation_used: Json;
          de_escalation_effective: boolean | null;
          physical_intervention: boolean | null;
          pi_technique: string | null;
          pi_duration_minutes: number | null;
          pi_staff_involved: Json;
          pi_injuries_child: boolean | null;
          pi_injuries_staff: boolean | null;
          pi_debrief_completed: boolean | null;
          pi_debrief_date: string | null;
          outcome: string | null;
          recorded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cs_behaviour_entries"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cs_behaviour_entries"]["Insert"]>;
        Relationships: [];
      };
      cs_risk_assessments: {
        Row: {
          id: string;
          home_id: string | null;
          child_id: string | null;
          category: string | null;
          title: string | null;
          description: string | null;
          likelihood: number | null;
          impact: number | null;
          inherent_risk_score: number | null;
          current_risk_level: string | null;
          residual_risk_level: string | null;
          mitigations: Json;
          triggers: Json;
          protective_factors: Json;
          status: string | null;
          assessor_id: string | null;
          reviewer_id: string | null;
          review_date: string | null;
          next_review_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cs_risk_assessments"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cs_risk_assessments"]["Insert"]>;
        Relationships: [];
      };
      cs_lac_reviews: {
        Row: {
          id: string;
          home_id: string | null;
          child_id: string | null;
          child_name: string | null;
          review_type: string | null;
          review_date: string | null;
          status: string | null;
          next_review_due: string | null;
          iro_name: string | null;
          child_participation: string | null;
          child_views_recorded: boolean | null;
          parent_attended: boolean | null;
          social_worker_attended: boolean | null;
          key_worker_attended: boolean | null;
          outcome: string | null;
          recommendations: Json;
          actions_agreed: Json;
          placement_stability_discussed: boolean | null;
          permanence_plan_reviewed: boolean | null;
          health_reviewed: boolean | null;
          education_reviewed: boolean | null;
          within_timescale: boolean | null;
          notes: string | null;
          chaired_by: string | null;
          attendees: Json;
          outcomes: Json;
          actions: Json;
          child_participated: boolean | null;
          plan_changes: Json;
          next_review_date: string | null;
          minutes_recorded: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cs_lac_reviews"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cs_lac_reviews"]["Insert"]>;
        Relationships: [];
      };
      cs_restraint_records: {
        Row: {
          id: string;
          home_id: string | null;
          child_id: string | null;
          child_name: string | null;
          incident_date: string | null;
          incident_time: string | null;
          restraint_type: string | null;
          technique_used: string | null;
          duration_minutes: number | null;
          staff_involved: Json;
          antecedent: string | null;
          behaviour_description: string | null;
          de_escalation_attempted: Json;
          outcome: string | null;
          injuries_child: Json;
          injuries_staff: Json;
          body_map_completed: boolean | null;
          child_views_obtained: boolean | null;
          child_views: string | null;
          debrief_completed: boolean | null;
          debrief_date: string | null;
          debrief_notes: string | null;
          manager_reviewed: boolean | null;
          manager_review_date: string | null;
          manager_review_notes: string | null;
          ofsted_notified: boolean | null;
          parent_carer_notified: boolean | null;
          social_worker_notified: boolean | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cs_restraint_records"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cs_restraint_records"]["Insert"]>;
        Relationships: [];
      };
      cs_restraint_debriefs: {
        Row: {
          id: string;
          home_id: string | null;
          debrief_type: string | null;
          restraint_type: string | null;
          debrief_outcome: string | null;
          child_emotional_state: string | null;
          debrief_date: string | null;
          child_name: string | null;
          child_id: string | null;
          staff_involved: string | null;
          child_debrief_completed: boolean | null;
          staff_debrief_completed: boolean | null;
          medical_check_done: boolean | null;
          body_map_completed: boolean | null;
          ofsted_notified: boolean | null;
          social_worker_notified: boolean | null;
          parent_notified: boolean | null;
          witness_statements_taken: boolean | null;
          cctv_reviewed: boolean | null;
          proportionate_response: boolean | null;
          learning_documented: boolean | null;
          plan_updated: boolean | null;
          issues_found: Json;
          actions_taken: Json;
          debriefed_by: string | null;
          restraint_duration_minutes: number | null;
          next_review_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["cs_restraint_debriefs"]["Row"], "id" | "created_at">> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["cs_restraint_debriefs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      [key: string]: never;
    };
    Functions: {
      get_my_home_id: { Args: Record<never, never>; Returns: string };
      get_my_role: { Args: Record<never, never>; Returns: string };
      is_manager: { Args: Record<never, never>; Returns: boolean };
      set_updated_at: { Args: Record<never, never>; Returns: unknown };
    };
    Enums: {
      system_role: "registered_manager" | "responsible_individual" | "deputy_manager" | "team_leader" | "residential_care_worker" | "bank_staff" | "admin";
      employment_type: "permanent" | "part_time" | "bank" | "agency" | "volunteer";
      task_priority: "low" | "medium" | "high" | "urgent";
      task_status: "not_started" | "in_progress" | "blocked" | "completed" | "cancelled";
      incident_type: string;
      incident_severity: "low" | "medium" | "high" | "critical";
      yp_status: "current" | "planned" | "ended" | "emergency";
      care_event_status: "draft" | "submitted" | "routing" | "routed" | "manager_review_required" | "returned" | "verified" | "locked" | "routing_failed";
      care_event_category: "general" | "behaviour" | "health" | "medication" | "education" | "family_contact" | "professional_contact" | "safeguarding" | "missing_episode" | "physical_intervention" | "restraint" | "complaint" | "activity" | "wellbeing" | "sleep" | "food" | "finance" | "other";
      route_type: "daily_log" | "child_daily_summary" | "incident" | "missing_episode" | "physical_intervention" | "health_record" | "medication_record" | "education_record" | "family_contact_record" | "professional_contact_record" | "complaint_record" | "safeguarding_record" | "risk_assessment_task" | "behaviour_plan_task" | "followup_task" | "management_oversight" | "reg40_triage" | "reg44_evidence" | "reg45_evidence" | "annex_a_evidence" | "filing_cabinet" | "saved_time";
      route_status: "pending" | "completed" | "failed" | "skipped" | "retry_required";
      job_status: "queued" | "processing" | "completed" | "failed" | "cancelled";
    };
  };
}
