export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_actions: {
        Row: {
          id: string
          admin_id: string
          action_type: string
          target_type: string | null
          target_id: string | null
          details: Json
          metadata: Json
          created_at: string | null
        }
        Insert: {
          id?: string
          admin_id: string
          action_type: string
          target_type?: string | null
          target_id?: string | null
          details?: Json
          metadata?: Json
          created_at?: string | null
        }
        Update: {
          id?: string
          admin_id?: string
          action_type?: string
          target_type?: string | null
          target_id?: string | null
          details?: Json
          metadata?: Json
          created_at?: string | null
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          id: string
          assignment_id: string | null
          student_id: string | null
          student_name: string | null
          student_email: string | null
          submission_text: string | null
          file_urls: string[] | null
          status: string | null
          submitted_at: string | null
          is_late: boolean | null
          late_days: number | null
          final_score: number | null
          ai_suggested_score: number | null
          graded_by: string | null
          graded_at: string | null
          lecturer_feedback: string | null
          ai_feedback: string | null
          ai_grading_data: Json | null
          plagiarism_score: number | null
          plagiarism_report: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          assignment_id?: string | null
          student_id?: string | null
          student_name?: string | null
          student_email?: string | null
          submission_text?: string | null
          file_urls?: string[] | null
          status?: string | null
          submitted_at?: string | null
          is_late?: boolean | null
          late_days?: number | null
          final_score?: number | null
          ai_suggested_score?: number | null
          graded_by?: string | null
          graded_at?: string | null
          lecturer_feedback?: string | null
          ai_feedback?: string | null
          ai_grading_data?: Json | null
          plagiarism_score?: number | null
          plagiarism_report?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string | null
          student_id?: string | null
          student_name?: string | null
          student_email?: string | null
          submission_text?: string | null
          file_urls?: string[] | null
          status?: string | null
          submitted_at?: string | null
          is_late?: boolean | null
          late_days?: number | null
          final_score?: number | null
          ai_suggested_score?: number | null
          graded_by?: string | null
          graded_at?: string | null
          lecturer_feedback?: string | null
          ai_feedback?: string | null
          ai_grading_data?: Json | null
          plagiarism_score?: number | null
          plagiarism_report?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      assignments: {
        Row: {
          id: string
          course_id: string | null
          created_by: string | null
          title: string
          description: string
          instructions: string | null
          assignment_type: Database['public']['Enums']['assignment_type'] | null
          max_score: number | null
          allocated_marks: number | null
          deadline: string
          late_submission_allowed: boolean | null
          late_penalty_percentage: number | null
          allowed_file_types: string[] | null
          max_file_size_mb: number | null
          submission_cost: number | null
          ai_grading_enabled: boolean | null
          ai_grading_rubric: string | null
          plagiarism_check_enabled: boolean | null
          grading_rubric: Json | null
          is_published: boolean | null
          is_standalone: boolean | null
          access_code: string | null
          display_course_title: string | null
          display_course_code: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          course_id?: string | null
          created_by?: string | null
          title: string
          description: string
          instructions?: string | null
          assignment_type?: Database['public']['Enums']['assignment_type'] | null
          max_score?: number | null
          allocated_marks?: number | null
          deadline: string
          late_submission_allowed?: boolean | null
          late_penalty_percentage?: number | null
          allowed_file_types?: string[] | null
          max_file_size_mb?: number | null
          submission_cost?: number | null
          ai_grading_enabled?: boolean | null
          ai_grading_rubric?: string | null
          plagiarism_check_enabled?: boolean | null
          grading_rubric?: Json | null
          is_published?: boolean | null
          is_standalone?: boolean | null
          access_code?: string | null
          display_course_title?: string | null
          display_course_code?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          course_id?: string | null
          created_by?: string | null
          title?: string
          description?: string
          instructions?: string | null
          assignment_type?: Database['public']['Enums']['assignment_type'] | null
          max_score?: number | null
          allocated_marks?: number | null
          deadline?: string
          late_submission_allowed?: boolean | null
          late_penalty_percentage?: number | null
          allowed_file_types?: string[] | null
          max_file_size_mb?: number | null
          submission_cost?: number | null
          ai_grading_enabled?: boolean | null
          ai_grading_rubric?: string | null
          plagiarism_check_enabled?: boolean | null
          grading_rubric?: Json | null
          is_published?: boolean | null
          is_standalone?: boolean | null
          access_code?: string | null
          display_course_title?: string | null
          display_course_code?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      ca_records: {
        Row: {
          id: string
          course_id: string | null
          student_id: string | null
          assignment_scores: Json | null
          test_scores: Json | null
          total_ca_score: number | null
          max_possible_score: number | null
          percentage: number | null
          computed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          course_id?: string | null
          student_id?: string | null
          assignment_scores?: Json | null
          test_scores?: Json | null
          total_ca_score?: number | null
          max_possible_score?: number | null
          percentage?: number | null
          computed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          course_id?: string | null
          student_id?: string | null
          assignment_scores?: Json | null
          test_scores?: Json | null
          total_ca_score?: number | null
          max_possible_score?: number | null
          percentage?: number | null
          computed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          id: string
          course_id: string | null
          student_id: string | null
          enrollment_status: string | null
          enrolled_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          course_id?: string | null
          student_id?: string | null
          enrollment_status?: string | null
          enrolled_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          course_id?: string | null
          student_id?: string | null
          enrollment_status?: string | null
          enrolled_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      course_lecturers: {
        Row: {
          id: string
          course_id: string | null
          lecturer_id: string | null
          is_primary: boolean | null
          assigned_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          course_id?: string | null
          lecturer_id?: string | null
          is_primary?: boolean | null
          assigned_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          course_id?: string | null
          lecturer_id?: string | null
          is_primary?: boolean | null
          assigned_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          institution_id: string | null
          course_code: string
          course_title: string
          description: string | null
          credit_units: number | null
          semester: number | null
          level: number | null
          session: string | null
          faculty: string | null
          department: string | null
          created_by: string | null
          enrollment_code: string | null
          attendance_marks: number | null
          total_ca_marks: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          institution_id?: string | null
          course_code: string
          course_title: string
          description?: string | null
          credit_units?: number | null
          semester?: number | null
          level?: number | null
          session?: string | null
          faculty?: string | null
          department?: string | null
          created_by?: string | null
          enrollment_code?: string | null
          attendance_marks?: number | null
          total_ca_marks?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          institution_id?: string | null
          course_code?: string
          course_title?: string
          description?: string | null
          credit_units?: number | null
          semester?: number | null
          level?: number | null
          session?: string | null
          faculty?: string | null
          department?: string | null
          created_by?: string | null
          enrollment_code?: string | null
          attendance_marks?: number | null
          total_ca_marks?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      institutions: {
        Row: {
          id: string
          code: string
          name: string
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          email: string | null
          phone: string | null
          logo_url: string | null
          subscription_plan: string | null
          subscription_expires_at: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          email?: string | null
          phone?: string | null
          logo_url?: string | null
          subscription_plan?: string | null
          subscription_expires_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          email?: string | null
          phone?: string | null
          logo_url?: string | null
          subscription_plan?: string | null
          subscription_expires_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lecturer_earnings: {
        Row: {
          id: string
          lecturer_id: string | null
          source_type: string | null
          source_id: string | null
          amount: number
          revenue_share_percentage: number | null
          transaction_id: string | null
          earned_at: string | null
          withdrawn: boolean | null
          withdrawn_at: string | null
        }
        Insert: {
          id?: string
          lecturer_id?: string | null
          source_type?: string | null
          source_id?: string | null
          amount: number
          revenue_share_percentage?: number | null
          transaction_id?: string | null
          earned_at?: string | null
          withdrawn?: boolean | null
          withdrawn_at?: string | null
        }
        Update: {
          id?: string
          lecturer_id?: string | null
          source_type?: string | null
          source_id?: string | null
          amount?: number
          revenue_share_percentage?: number | null
          transaction_id?: string | null
          earned_at?: string | null
          withdrawn?: boolean | null
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: Database['public']['Enums']['notification_type']
          title: string
          message: string
          link: string | null
          metadata: Json | null
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: Database['public']['Enums']['notification_type']
          title: string
          message: string
          link?: string | null
          metadata?: Json | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: Database['public']['Enums']['notification_type']
          title?: string
          message?: string
          link?: string | null
          metadata?: Json | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      partner_earnings: {
        Row: {
          id: string
          partner_id: string
          referral_id: string | null
          source_type: string
          source_id: string
          student_id: string | null
          submission_id: string | null
          source_amount: number
          commission_rate: number
          amount: number
          lecturer_amount: number
          transaction_id: string | null
          status: string | null
          withdrawal_id: string | null
          withdrawn_at: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          referral_id?: string | null
          source_type: string
          source_id: string
          student_id?: string | null
          submission_id?: string | null
          source_amount: number
          commission_rate: number
          amount: number
          lecturer_amount: number
          transaction_id?: string | null
          status?: string | null
          withdrawal_id?: string | null
          withdrawn_at?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          referral_id?: string | null
          source_type?: string
          source_id?: string
          student_id?: string | null
          submission_id?: string | null
          source_amount?: number
          commission_rate?: number
          amount?: number
          lecturer_amount?: number
          transaction_id?: string | null
          status?: string | null
          withdrawal_id?: string | null
          withdrawn_at?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      partner_withdrawals: {
        Row: {
          id: string
          partner_id: string
          amount: number
          bank_name: string
          account_number: string
          account_name: string
          status: string | null
          request_notes: string | null
          review_notes: string | null
          rejection_reason: string | null
          payment_reference: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          paid_at: string | null
          paid_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          amount: number
          bank_name: string
          account_number: string
          account_name: string
          status?: string | null
          request_notes?: string | null
          review_notes?: string | null
          rejection_reason?: string | null
          payment_reference?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          paid_at?: string | null
          paid_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          amount?: number
          bank_name?: string
          account_number?: string
          account_name?: string
          status?: string | null
          request_notes?: string | null
          review_notes?: string | null
          rejection_reason?: string | null
          payment_reference?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          paid_at?: string | null
          paid_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          id: string
          user_id: string
          partner_code: string
          business_name: string | null
          phone_number: string | null
          bank_name: string | null
          account_number: string | null
          account_name: string | null
          commission_rate: number
          total_referrals: number | null
          active_referrals: number | null
          total_earnings: number | null
          total_withdrawn: number | null
          pending_earnings: number | null
          last_payout_at: string | null
          status: string | null
          notes: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          partner_code: string
          business_name?: string | null
          phone_number?: string | null
          bank_name?: string | null
          account_number?: string | null
          account_name?: string | null
          commission_rate?: number
          total_referrals?: number | null
          active_referrals?: number | null
          total_earnings?: number | null
          total_withdrawn?: number | null
          pending_earnings?: number | null
          last_payout_at?: string | null
          status?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          partner_code?: string
          business_name?: string | null
          phone_number?: string | null
          bank_name?: string | null
          account_number?: string | null
          account_name?: string | null
          commission_rate?: number
          total_referrals?: number | null
          active_referrals?: number | null
          total_earnings?: number | null
          total_withdrawn?: number | null
          pending_earnings?: number | null
          last_payout_at?: string | null
          status?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          institution_id: string | null
          role: Database['public']['Enums']['user_role']
          first_name: string
          last_name: string
          title: string | null
          phone: string | null
          avatar_url: string | null
          faculty: string | null
          department: string | null
          level: number | null
          matric_number: string | null
          staff_id: string | null
          referred_by_partner: string | null
          is_active: boolean | null
          email_verified: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          institution_id?: string | null
          role?: Database['public']['Enums']['user_role']
          first_name: string
          last_name: string
          title?: string | null
          phone?: string | null
          avatar_url?: string | null
          faculty?: string | null
          department?: string | null
          level?: number | null
          matric_number?: string | null
          staff_id?: string | null
          referred_by_partner?: string | null
          is_active?: boolean | null
          email_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          institution_id?: string | null
          role?: Database['public']['Enums']['user_role']
          first_name?: string
          last_name?: string
          title?: string | null
          phone?: string | null
          avatar_url?: string | null
          faculty?: string | null
          department?: string | null
          level?: number | null
          matric_number?: string | null
          staff_id?: string | null
          referred_by_partner?: string | null
          is_active?: boolean | null
          email_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      question_options: {
        Row: {
          id: string
          question_id: string | null
          option_text: string
          option_image_url: string | null
          is_correct: boolean | null
          order_index: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          question_id?: string | null
          option_text: string
          option_image_url?: string | null
          is_correct?: boolean | null
          order_index?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          question_id?: string | null
          option_text?: string
          option_image_url?: string | null
          is_correct?: boolean | null
          order_index?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          test_id: string | null
          question_type: Database['public']['Enums']['question_type']
          question_text: string
          question_image_url: string | null
          marks: number | null
          order_index: number | null
          explanation: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          test_id?: string | null
          question_type: Database['public']['Enums']['question_type']
          question_text: string
          question_image_url?: string | null
          marks?: number | null
          order_index?: number | null
          explanation?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          test_id?: string | null
          question_type?: Database['public']['Enums']['question_type']
          question_text?: string
          question_image_url?: string | null
          marks?: number | null
          order_index?: number | null
          explanation?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          partner_id: string
          referred_lecturer_id: string
          referral_code: string
          status: string | null
          total_revenue: number | null
          partner_earnings: number | null
          total_submissions: number | null
          first_submission_at: string | null
          last_submission_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          referred_lecturer_id: string
          referral_code: string
          status?: string | null
          total_revenue?: number | null
          partner_earnings?: number | null
          total_submissions?: number | null
          first_submission_at?: string | null
          last_submission_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          referred_lecturer_id?: string
          referral_code?: string
          status?: string | null
          total_revenue?: number | null
          partner_earnings?: number | null
          total_submissions?: number | null
          first_submission_at?: string | null
          last_submission_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          id: string
          user_id: string
          transaction_id: string | null
          amount: number
          reason: string
          status: string
          refund_type: string
          processed_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          transaction_id?: string | null
          amount: number
          reason: string
          status?: string
          refund_type: string
          processed_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          transaction_id?: string | null
          amount?: number
          reason?: string
          status?: string
          refund_type?: string
          processed_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      student_answers: {
        Row: {
          id: string
          attempt_id: string | null
          question_id: string | null
          selected_option_ids: string[] | null
          answer_text: string | null
          is_correct: boolean | null
          marks_awarded: number | null
          ai_feedback: string | null
          ai_feedback_data: Json | null
          answered_at: string | null
        }
        Insert: {
          id?: string
          attempt_id?: string | null
          question_id?: string | null
          selected_option_ids?: string[] | null
          answer_text?: string | null
          is_correct?: boolean | null
          marks_awarded?: number | null
          ai_feedback?: string | null
          ai_feedback_data?: Json | null
          answered_at?: string | null
        }
        Update: {
          id?: string
          attempt_id?: string | null
          question_id?: string | null
          selected_option_ids?: string[] | null
          answer_text?: string | null
          is_correct?: boolean | null
          marks_awarded?: number | null
          ai_feedback?: string | null
          ai_feedback_data?: Json | null
          answered_at?: string | null
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          id: string
          test_id: string | null
          student_id: string | null
          attempt_number: number | null
          started_at: string | null
          submitted_at: string | null
          time_taken_minutes: number | null
          status: string | null
          score: number | null
          total_score: number | null
          percentage: number | null
          passed: boolean | null
          answers: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          test_id?: string | null
          student_id?: string | null
          attempt_number?: number | null
          started_at?: string | null
          submitted_at?: string | null
          time_taken_minutes?: number | null
          status?: string | null
          score?: number | null
          total_score?: number | null
          percentage?: number | null
          passed?: boolean | null
          answers?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          test_id?: string | null
          student_id?: string | null
          attempt_number?: number | null
          started_at?: string | null
          submitted_at?: string | null
          time_taken_minutes?: number | null
          status?: string | null
          score?: number | null
          total_score?: number | null
          percentage?: number | null
          passed?: boolean | null
          answers?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tests: {
        Row: {
          id: string
          course_id: string | null
          created_by: string | null
          title: string
          description: string | null
          instructions: string | null
          test_type: Database['public']['Enums']['test_type'] | null
          total_marks: number | null
          allocated_marks: number | null
          duration_minutes: number
          start_time: string
          end_time: string
          pass_mark: number | null
          max_attempts: number | null
          shuffle_questions: boolean | null
          shuffle_options: boolean | null
          show_results_immediately: boolean | null
          allow_review: boolean | null
          access_cost: number | null
          is_published: boolean | null
          is_standalone: boolean | null
          access_code: string | null
          display_course_title: string | null
          display_course_code: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          course_id?: string | null
          created_by?: string | null
          title: string
          description?: string | null
          instructions?: string | null
          test_type?: Database['public']['Enums']['test_type'] | null
          total_marks?: number | null
          allocated_marks?: number | null
          duration_minutes: number
          start_time: string
          end_time: string
          pass_mark?: number | null
          max_attempts?: number | null
          shuffle_questions?: boolean | null
          shuffle_options?: boolean | null
          show_results_immediately?: boolean | null
          allow_review?: boolean | null
          access_cost?: number | null
          is_published?: boolean | null
          is_standalone?: boolean | null
          access_code?: string | null
          display_course_title?: string | null
          display_course_code?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          course_id?: string | null
          created_by?: string | null
          title?: string
          description?: string | null
          instructions?: string | null
          test_type?: Database['public']['Enums']['test_type'] | null
          total_marks?: number | null
          allocated_marks?: number | null
          duration_minutes?: number
          start_time?: string
          end_time?: string
          pass_mark?: number | null
          max_attempts?: number | null
          shuffle_questions?: boolean | null
          shuffle_options?: boolean | null
          show_results_immediately?: boolean | null
          allow_review?: boolean | null
          access_cost?: number | null
          is_published?: boolean | null
          is_standalone?: boolean | null
          access_code?: string | null
          display_course_title?: string | null
          display_course_code?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          wallet_id: string | null
          type: Database['public']['Enums']['transaction_type']
          purpose: Database['public']['Enums']['transaction_purpose']
          amount: number
          balance_before: number
          balance_after: number
          description: string | null
          reference: string | null
          status: string | null
          lecturer_id: string | null
          partner_id: string | null
          partner_amount: number | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          wallet_id?: string | null
          type: Database['public']['Enums']['transaction_type']
          purpose: Database['public']['Enums']['transaction_purpose']
          amount: number
          balance_before: number
          balance_after: number
          description?: string | null
          reference?: string | null
          status?: string | null
          lecturer_id?: string | null
          partner_id?: string | null
          partner_amount?: number | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          wallet_id?: string | null
          type?: Database['public']['Enums']['transaction_type']
          purpose?: Database['public']['Enums']['transaction_purpose']
          amount?: number
          balance_before?: number
          balance_after?: number
          description?: string | null
          reference?: string | null
          status?: string | null
          lecturer_id?: string | null
          partner_id?: string | null
          partner_amount?: number | null
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          id: string
          user_id: string | null
          balance: number | null
          total_funded: number | null
          total_spent: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          balance?: number | null
          total_funded?: number | null
          total_spent?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          balance?: number | null
          total_funded?: number | null
          total_spent?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          id: string
          lecturer_id: string
          amount: number
          bank_name: string
          account_number: string
          account_name: string
          status: string | null
          request_notes: string | null
          review_notes: string | null
          payment_reference: string | null
          payment_proof_url: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          paid_at: string | null
          paid_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          lecturer_id: string
          amount: number
          bank_name: string
          account_number: string
          account_name: string
          status?: string | null
          request_notes?: string | null
          review_notes?: string | null
          payment_reference?: string | null
          payment_proof_url?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          paid_at?: string | null
          paid_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          lecturer_id?: string
          amount?: number
          bank_name?: string
          account_number?: string
          account_name?: string
          status?: string | null
          request_notes?: string | null
          review_notes?: string | null
          payment_reference?: string | null
          payment_proof_url?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          paid_at?: string | null
          paid_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      course_ca_summary: {
        Row: {
          course_id: string | null
          course_code: string | null
          course_title: string | null
          total_ca_marks: number | null
          attendance_marks: number | null
          available_for_assessments: number | null
          assignments_total: number | null
          tests_total: number | null
          total_allocated: number | null
          remaining_marks: number | null
        }
        Relationships: []
      }
      profiles_with_email: {
        Row: {
          id: string | null
          email: string | null
          institution_id: string | null
          role: Database['public']['Enums']['user_role'] | null
          first_name: string | null
          last_name: string | null
          title: string | null
          phone: string | null
          avatar_url: string | null
          faculty: string | null
          department: string | null
          level: number | null
          matric_number: string | null
          staff_id: string | null
          is_active: boolean | null
          email_verified: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: {
      assignment_type: 'essay' | 'report' | 'project' | 'case_study' | 'general'
      notification_type:
        | 'assignment_created'
        | 'assignment_deadline_reminder'
        | 'assignment_graded'
        | 'test_created'
        | 'test_starting_soon'
        | 'test_result_available'
        | 'payment_successful'
        | 'payment_failed'
        | 'course_enrollment'
        | 'general'
      question_type: 'mcq' | 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
      test_type: 'quiz' | 'test' | 'exam' | 'practice'
      transaction_purpose:
        | 'funding'
        | 'assignment_payment'
        | 'test_payment'
        | 'refund'
        | 'withdrawal'
      transaction_type: 'credit' | 'debit'
      user_role: 'student' | 'lecturer' | 'admin' | 'super_admin' | 'partner'
    }
    CompositeTypes: Record<string, never>
  }
}