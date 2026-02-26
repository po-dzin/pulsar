import type {
  AdminLeadRowV2,
  AdminLeadsQuery,
  AdminPagedResponse,
  AdminRoleRowV2,
  AdminRolesQuery,
  AdminReadRepositoryPort,
  AdminSortDir,
  AdminUserActivityDetails,
  AdminUserActivityQuery,
  AdminUserActivityRow,
  ConsultationLeadRow,
  LeadsRepositoryPort,
  ProfilesRepositoryPort,
  TestResultRow,
  AdminRolesRepositoryPort,
  UserProfile,
} from "@/application/ports/repositories";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TestType } from "@/domain/psychosomatic/model";

type DiagnosticsResultDbRow = {
  id: string;
  user_id: string;
  session_id: string;
  test_type: string;
  overall_pct: number;
  level: string;
  zones_json: unknown;
  flags_json: unknown;
  recommendations_json: unknown;
  created_at: string;
};

type ConsultationLeadDbRow = {
  id: string;
  user_id: string;
  name: string;
  contact: string;
  message: string;
  status: "new" | "in_progress" | "done" | "archived";
  created_at: string;
  updated_at: string;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const clampPageSize = (value?: number): number => {
  if (!value || Number.isNaN(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(Math.trunc(value), 1), MAX_PAGE_SIZE);
};

const clampPage = (value?: number): number => {
  if (!value || Number.isNaN(value)) return DEFAULT_PAGE;
  return Math.max(Math.trunc(value), 1);
};

const normalizeSortDir = (sortDir?: AdminSortDir): AdminSortDir => (sortDir === "asc" ? "asc" : "desc");

const paginate = <T>(rows: T[], page: number, pageSize: number): AdminPagedResponse<T> => {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const normalizedPage = Math.min(page, totalPages);
  const offset = (normalizedPage - 1) * pageSize;

  return {
    rows: rows.slice(offset, offset + pageSize),
    meta: {
      page: normalizedPage,
      pageSize,
      total,
      totalPages,
    },
  };
};

const mapResult = (row: DiagnosticsResultDbRow): TestResultRow => ({
  id: row.id,
  userId: row.user_id,
  sessionId: row.session_id,
  testType: row.test_type as TestType,
  overallPct: row.overall_pct,
  level: row.level,
  zones: row.zones_json,
  riskFlags: row.flags_json,
  recommendations: row.recommendations_json,
  createdAt: row.created_at,
});

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

const compareText = (a: string | null, b: string | null, sortDir: AdminSortDir): number => {
  const left = (a ?? "").toLowerCase();
  const right = (b ?? "").toLowerCase();
  return sortDir === "asc" ? left.localeCompare(right) : right.localeCompare(left);
};

const compareNumber = (a: number, b: number, sortDir: AdminSortDir): number =>
  sortDir === "asc" ? a - b : b - a;

const compareDate = (a: string | null, b: string | null, sortDir: AdminSortDir): number => {
  const left = a ? new Date(a).getTime() : 0;
  const right = b ? new Date(b).getTime() : 0;
  return compareNumber(left, right, sortDir);
};

export class SupabaseAdminReadRepository implements AdminReadRepositoryPort {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly profilesRepo: ProfilesRepositoryPort,
    private readonly leadsRepo: LeadsRepositoryPort,
    private readonly adminRolesRepo: AdminRolesRepositoryPort
  ) {}

  async listUserActivity(query?: AdminUserActivityQuery): Promise<AdminPagedResponse<AdminUserActivityRow>> {
    const page = clampPage(query?.page);
    const pageSize = clampPageSize(query?.pageSize);
    const sortBy = query?.sortBy ?? "createdAt";
    const sortDir = normalizeSortDir(query?.sortDir);

    const profiles = await this.profilesRepo.listProfiles({ search: query?.search });
    if (profiles.length === 0) {
      return {
        rows: [],
        meta: { page: 1, pageSize, total: 0, totalPages: 1 },
      };
    }

    const userIds = profiles.map((item) => item.id);

    const [testsData, leadsData] = await Promise.all([
      this.supabase
        .from("test_results")
        .select("id,user_id,session_id,test_type,overall_pct,level,zones_json,flags_json,recommendations_json,created_at")
        .in("user_id", userIds)
        .order("created_at", { ascending: false }),
      this.supabase
        .from("consultation_leads")
        .select("id,user_id,name,contact,message,status,created_at,updated_at")
        .in("user_id", userIds)
        .order("created_at", { ascending: false }),
    ]);

    if (testsData.error) {
      throw testsData.error;
    }
    if (leadsData.error) {
      throw leadsData.error;
    }

    const testsByUser = new Map<string, TestResultRow[]>();
    for (const row of (testsData.data ?? []) as DiagnosticsResultDbRow[]) {
      const mapped = mapResult(row);
      const current = testsByUser.get(mapped.userId) ?? [];
      current.push(mapped);
      testsByUser.set(mapped.userId, current);
    }

    const leadsByUser = new Map<string, ConsultationLeadRow[]>();
    for (const row of (leadsData.data ?? []) as ConsultationLeadDbRow[]) {
      const mapped = mapLead(row);
      const current = leadsByUser.get(mapped.userId) ?? [];
      current.push(mapped);
      leadsByUser.set(mapped.userId, current);
    }

    const rows: AdminUserActivityRow[] = profiles.map((profile) => {
      const tests = testsByUser.get(profile.id) ?? [];
      const leads = leadsByUser.get(profile.id) ?? [];
      const lastTestAt = tests[0]?.createdAt ?? null;
      const lastLeadAt = leads[0]?.createdAt ?? null;
      const lastActivityAt = [profile.createdAt, lastTestAt, lastLeadAt].filter(Boolean).sort().at(-1) ?? profile.createdAt;

      return {
        userId: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        locale: profile.locale,
        createdAt: profile.createdAt,
        testsCount: tests.length,
        lastTestAt,
        leadsCount: leads.length,
        lastLeadAt,
        lastActivityAt,
      };
    });

    rows.sort((a, b) => {
      if (sortBy === "testsCount") {
        return compareNumber(a.testsCount, b.testsCount, sortDir);
      }
      if (sortBy === "leadsCount") {
        return compareNumber(a.leadsCount, b.leadsCount, sortDir);
      }
      if (sortBy === "lastActivityAt") {
        return compareDate(a.lastActivityAt, b.lastActivityAt, sortDir);
      }
      return compareDate(a.createdAt, b.createdAt, sortDir);
    });

    return paginate(rows, page, pageSize);
  }

  async getUserActivityDetails(
    userId: string,
    options?: { testsLimit?: number; leadsLimit?: number }
  ): Promise<AdminUserActivityDetails> {
    const testsLimit = Math.min(Math.max(options?.testsLimit ?? 5, 1), 20);
    const leadsLimit = Math.min(Math.max(options?.leadsLimit ?? 5, 1), 20);

    const [testsData, leadsData] = await Promise.all([
      this.supabase
        .from("test_results")
        .select("id,user_id,session_id,test_type,overall_pct,level,zones_json,flags_json,recommendations_json,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(0, testsLimit - 1),
      this.supabase
        .from("consultation_leads")
        .select("id,user_id,name,contact,message,status,created_at,updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(0, leadsLimit - 1),
    ]);

    if (testsData.error) {
      throw testsData.error;
    }
    if (leadsData.error) {
      throw leadsData.error;
    }

    return {
      tests: ((testsData.data ?? []) as DiagnosticsResultDbRow[]).map(mapResult),
      leads: ((leadsData.data ?? []) as ConsultationLeadDbRow[]).map(mapLead),
    };
  }

  async listRoles(query?: AdminRolesQuery): Promise<AdminPagedResponse<AdminRoleRowV2>> {
    const page = clampPage(query?.page);
    const pageSize = clampPageSize(query?.pageSize);
    const sortBy = query?.sortBy ?? "createdAt";
    const sortDir = normalizeSortDir(query?.sortDir);

    const [profiles, roles] = await Promise.all([
      this.profilesRepo.listProfiles({ search: query?.search }),
      this.adminRolesRepo.listRoles(),
    ]);

    const adminAssignedAtByUserId = new Map(roles.map((item) => [item.userId, item.createdAt]));

    const rows: AdminRoleRowV2[] = profiles.map((profile: UserProfile) => {
      const assignedAt = adminAssignedAtByUserId.get(profile.id) ?? null;
      return {
        userId: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        role: assignedAt ? "admin" : "user",
        assignedAt,
        createdAt: profile.createdAt,
      };
    });

    rows.sort((a, b) => {
      if (sortBy === "fullName") return compareText(a.fullName, b.fullName, sortDir);
      if (sortBy === "email") return compareText(a.email, b.email, sortDir);
      if (sortBy === "role") return compareText(a.role, b.role, sortDir);
      if (sortBy === "assignedAt") return compareDate(a.assignedAt, b.assignedAt, sortDir);
      return compareDate(a.createdAt, b.createdAt, sortDir);
    });

    return paginate(rows, page, pageSize);
  }

  async listLeads(query?: AdminLeadsQuery): Promise<AdminPagedResponse<AdminLeadRowV2>> {
    const page = clampPage(query?.page);
    const pageSize = clampPageSize(query?.pageSize);
    const offset = (page - 1) * pageSize;
    const status = query?.status && query.status !== "all" ? query.status : undefined;

    const [total, leads] = await Promise.all([
      this.leadsRepo.countLeads({ search: query?.search, status }),
      this.leadsRepo.listLeads({
        search: query?.search,
        status,
        sortBy: query?.sortBy,
        sortDir: normalizeSortDir(query?.sortDir),
        offset,
        limit: pageSize,
      }),
    ]);

    return {
      rows: leads,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }
}
