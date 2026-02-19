import type {
  ConsultationLeadInput,
  ConsultationLeadRow,
  LeadStatus,
  LeadsRepositoryPort,
} from "@/application/ports/repositories";
import type { SupabaseClient } from "@supabase/supabase-js";

type ConsultationLeadDbRow = {
  id: string;
  user_id: string;
  name: string;
  contact: string;
  message: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
};

const mapLead = (row: ConsultationLeadDbRow): ConsultationLeadRow => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  contact: row.contact,
  message: row.message,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class SupabaseLeadsRepository implements LeadsRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async createLead(input: ConsultationLeadInput): Promise<ConsultationLeadRow> {
    const { data, error } = await this.supabase
      .from("consultation_leads")
      .insert({
        user_id: input.userId,
        name: input.name,
        contact: input.contact,
        message: input.message,
        status: "new",
      })
      .select("*")
      .single();

    if (error || !data) {
      throw error ?? new Error("Failed to create lead");
    }

    return mapLead(data);
  }

  async listLeads(): Promise<ConsultationLeadRow[]> {
    const { data, error } = await this.supabase.from("consultation_leads").select("*").order("created_at", { ascending: false });
    if (error) {
      throw error;
    }

    return ((data ?? []) as ConsultationLeadDbRow[]).map(mapLead);
  }

  async updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
    const { error } = await this.supabase
      .from("consultation_leads")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw error;
    }
  }
}
