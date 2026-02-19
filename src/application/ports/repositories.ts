import type {
  Locale,
  PsychoAnswers,
  PsychoQuestionKey,
  PsychoScore,
  TestType,
} from "@/domain/psychosomatic/model";

export type LeadStatus = "new" | "in_progress" | "done" | "archived";
export type AdminRole = "admin" | "editor";

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
};

export type KbArticleRow = {
  id: string;
  categoryId: string;
  slug: string;
  titleRu: string;
  titleEn: string;
  excerptRu: string;
  excerptEn: string;
  mdPathRu: string;
  mdPathEn: string;
  isPublished: boolean;
  publishedAt: string | null;
};

export type SaveDraftPayload = {
  userId: string;
  sessionId: string;
  testType: TestType;
  questionKey: PsychoQuestionKey;
  answerKey: string;
  score: number;
  consentAcceptedAt?: string;
};

export type SaveResultPayload = {
  userId: string;
  sessionId: string;
  testType: TestType;
  answers: PsychoAnswers;
  score: PsychoScore;
};

export interface DiagnosticsRepositoryPort {
  ensureSession(userId: string, sessionId: string, testType: TestType, consentAcceptedAt?: string): Promise<void>;
  saveDraftAnswer(payload: SaveDraftPayload): Promise<void>;
  saveCompletedResult(payload: SaveResultPayload): Promise<void>;
  listResultsByUser(userId: string, testType: TestType): Promise<TestResultRow[]>;
  listAllResults(): Promise<TestResultRow[]>;
}

export interface LeadsRepositoryPort {
  createLead(input: ConsultationLeadInput): Promise<ConsultationLeadRow>;
  listLeads(): Promise<ConsultationLeadRow[]>;
  updateLeadStatus(id: string, status: LeadStatus): Promise<void>;
}

export interface KbRepositoryPort {
  listCategories(): Promise<KbCategoryRow[]>;
  listArticles(): Promise<KbArticleRow[]>;
  listAllArticles(): Promise<KbArticleRow[]>;
  getArticleBySlug(slug: string): Promise<KbArticleRow | null>;
  upsertArticleMeta(article: KbArticleRow): Promise<void>;
  setArticlePublishState(id: string, isPublished: boolean): Promise<void>;
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
