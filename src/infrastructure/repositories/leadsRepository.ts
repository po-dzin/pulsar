import type {
  AdminLeadSortBy,
  AdminSortDir,
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

  async listLeads(options?: {
    search?: string;
    status?: LeadStatus;
    sortBy?: AdminLeadSortBy;
    sortDir?: AdminSortDir;
    offset?: number;
    limit?: number;
  }): Promise<ConsultationLeadRow[]> {
    const sortBy = options?.sortBy ?? "createdAt";
    const sortDir = options?.sortDir ?? "desc";
    const dbSortColumn =
      sortBy === "updatedAt"
        ? "updated_at"
        : sortBy === "name"
          ? "name"
          : sortBy === "status"
            ? "status"
            : "created_at";

    let query = this.supabase
      .from("consultation_leads")
      .select("*")
      .order(dbSortColumn, { ascending: sortDir === "asc" });

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.search?.trim()) {
      const escaped = options.search.trim().replace(/[%_]/g, "");
      query = query.or(`name.ilike.%${escaped}%,contact.ilike.%${escaped}%,message.ilike.%${escaped}%`);
    }

    if (typeof options?.offset === "number" && typeof options?.limit === "number") {
      query = query.range(options.offset, options.offset + options.limit - 1);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return ((data ?? []) as ConsultationLeadDbRow[]).map(mapLead);
  }

  async countLeads(options?: { search?: string; status?: LeadStatus }): Promise<number> {
    let query = this.supabase
      .from("consultation_leads")
      .select("id", { count: "exact", head: true });

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.search?.trim()) {
      const escaped = options.search.trim().replace(/[%_]/g, "");
      query = query.or(`name.ilike.%${escaped}%,contact.ilike.%${escaped}%,message.ilike.%${escaped}%`);
    }

    const { count, error } = await query;
    if (error) {
      throw error;
    }
    return count ?? 0;
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
