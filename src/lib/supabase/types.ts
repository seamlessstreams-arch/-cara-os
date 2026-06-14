/**
 * Supabase Database type definitions
 *
 * Manually maintained to match migrations 001–002.
 * When Supabase CLI is connected: replace with `supabase gen types typescript`
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  // Required by @supabase/supabase-js ≥2.100 for proper overload resolution
  PostgrestVersion: "12";
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
        Insert: Omit<Database["public"]["Tables"]["staff_members"]["Row"], "full_name" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["staff_members"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["young_people"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["young_people"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["tasks"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["incidents"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["incidents"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["shifts"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["shifts"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["leave_requests"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["leave_requests"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["medications"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["medications"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["medication_administrations"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["medication_administrations"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["daily_log_entries"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["daily_log_entries"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["handovers"]["Row"], "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["handovers"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["training_records"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["training_records"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["supervisions"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["supervisions"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["documents"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };

      document_read_receipts: {
        Row: {
          id: string;
          document_id: string;
          staff_id: string;
          read_at: string;
          signed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["document_read_receipts"]["Row"], "id" | "read_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["document_read_receipts"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["expenses"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["care_forms"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["care_forms"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["qa_audits"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["qa_audits"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["maintenance_items"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["maintenance_items"]["Insert"]>;
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
          contextual_safeguarding_risk: boolean;
          linked_incident_id: string | null;
          pattern_notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["missing_episodes"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["missing_episodes"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["chronology_entries"]["Row"], "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["chronology_entries"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["buildings"]["Row"], "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["buildings"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["building_checks"]["Row"], "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["building_checks"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["vehicles"]["Row"], "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["vehicles"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["vehicle_checks"]["Row"], "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["vehicle_checks"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["cara_interactions"]["Row"], "created_at"> & { id?: string };
        Update: never;
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
        Insert: Omit<Database["public"]["Tables"]["time_saved_entries"]["Row"], "created_at"> & { id?: string };
        Update: never;
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
        Insert: Omit<Database["public"]["Tables"]["care_events"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["care_events"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["care_event_routes"]["Row"], "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["care_event_routes"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["care_event_jobs"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["care_event_jobs"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["reg45_evidence_queue"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["reg45_evidence_queue"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["annex_a_evidence_queue"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["annex_a_evidence_queue"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["child_daily_summaries"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["child_daily_summaries"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["management_oversight_tasks"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["management_oversight_tasks"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["reg40_tasks"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["reg40_tasks"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["filing_cabinet_items"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["filing_cabinet_items"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["saved_time_metrics"]["Row"], "created_at"> & { id?: string };
        Update: never;
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
        Insert: Omit<Database["public"]["Tables"]["vacancies"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["vacancies"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["candidate_profiles"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["candidate_profiles"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["candidate_checks"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["candidate_checks"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["candidate_references"]["Row"], "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["candidate_references"]["Insert"]>;
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
