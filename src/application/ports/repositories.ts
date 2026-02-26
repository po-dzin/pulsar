import type {
  Locale,
  TestType,
} from "@/domain/psychosomatic/model";

export type LeadStatus = "new" | "in_progress" | "done" | "archived";
export type AdminRole = "admin";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string | null;
  locale: Locale;
  createdAt: string;
};

export type TestResultRow = {
  id: string;
  userId: string;
  sessionId: string;
  testType: TestType;
  overallPct: number;
  level: string;
  zones: unknown;
  riskFlags: unknown;
  recommendations: unknown;
  createdAt: string;
};

export type ConsultationLeadInput = {
  userId: string;
  name: string;
  contact: string;
  message: string;
};

export type ConsultationLeadRow = {
  id: string;
  userId: string;
  name: string;
  contact: string;
  message: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
};

export type KbCategoryRow = {
  id: string;
  slug: string;
  titleRu: string;
  titleEn: string;
  sortOrder: number;
  isArchived: boolean;
  updatedAt: string | null;
};

export type KbArticleRow = {
  id: string;
  categoryId: string;
  slug: string;
  titleRu: string;
  titleEn: string;
  excerptRu: string;
  excerptEn: string;
  contentRu: string;
  contentEn: string;
  isPublished: boolean;
  publishedAt: string | null;
  isArchived: boolean;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

export type KbCategoryInput = {
  slug: string;
  titleRu: string;
  titleEn: string;
  sortOrder?: number;
};

export type KbCategoryUpdate = Partial<KbCategoryInput> & {
  isArchived?: boolean;
};

export type KbArticleInput = {
  categoryId: string;
  slug: string;
  titleRu: string;
  titleEn: string;
  excerptRu: string;
  excerptEn: string;
  contentRu: string;
  contentEn: string;
  isPublished?: boolean;
};

export type KbArticleUpdate = Partial<KbArticleInput> & {
  isArchived?: boolean;
};

export type SerializedTestScore = {
  overallPct: number;
  level: string;
  zones: unknown;
  riskFlags: unknown;
  recommendations: unknown;
};

export type SaveDraftPayload = {
  userId: string;
  sessionId: string;
  testType: TestType;
  questionKey: string;
  answerKey: string;
  score: number;
  consentAcceptedAt?: string;
};

export type SaveResultPayload = {
  userId: string;
  sessionId: string;
  testType: TestType;
  answers: Record<string, string>;
  score: SerializedTestScore;
};

export interface DiagnosticsRepositoryPort {
  ensureSession(userId: string, sessionId: string, testType: TestType, consentAcceptedAt?: string): Promise<void>;
  saveDraftAnswer(payload: SaveDraftPayload): Promise<void>;
  saveCompletedResult(payload: SaveResultPayload): Promise<void>;
  listResultsByUser(userId: string, testType?: TestType): Promise<TestResultRow[]>;
  listAllResults(): Promise<TestResultRow[]>;
}

export interface LeadsRepositoryPort {
  createLead(input: ConsultationLeadInput): Promise<ConsultationLeadRow>;
  listLeads(): Promise<ConsultationLeadRow[]>;
  updateLeadStatus(id: string, status: LeadStatus): Promise<void>;
}

export interface KbRepositoryPort {
  listCategories(includeArchived?: boolean): Promise<KbCategoryRow[]>;
  getCategoryById(id: string): Promise<KbCategoryRow | null>;
  createCategory(input: KbCategoryInput): Promise<KbCategoryRow>;
  updateCategory(id: string, updates: KbCategoryUpdate): Promise<KbCategoryRow>;
  archiveCategory(id: string): Promise<void>;
  listArticles(options?: { includeArchived?: boolean; includeDrafts?: boolean; categoryId?: string }): Promise<KbArticleRow[]>;
  listAllArticles(): Promise<KbArticleRow[]>;
  getArticleById(id: string): Promise<KbArticleRow | null>;
  getArticleBySlug(slug: string): Promise<KbArticleRow | null>;
  createArticle(input: KbArticleInput, actorUserId: string): Promise<KbArticleRow>;
  updateArticle(id: string, updates: KbArticleUpdate, actorUserId: string): Promise<KbArticleRow>;
  archiveArticle(id: string, actorUserId: string): Promise<void>;
}

export interface ProfilesRepositoryPort {
  listProfiles(): Promise<UserProfile[]>;
  getProfileById(userId: string): Promise<UserProfile | null>;
  getProfileByEmail(email: string): Promise<UserProfile | null>;
  upsertProfile(profile: Omit<UserProfile, "createdAt">): Promise<void>;
}

export interface WaitlistRepositoryPort {
  addSecondTestWaitlist(userId: string, email: string, locale: Locale): Promise<void>;
}

export type AdminRoleRow = {
  userId: string;
  role: AdminRole;
  createdAt: string;
};

export interface AdminRolesRepositoryPort {
  listRoles(): Promise<AdminRoleRow[]>;
  upsertRole(userId: string, role: AdminRole): Promise<void>;
  removeRole(userId: string, role?: AdminRole): Promise<void>;
}
