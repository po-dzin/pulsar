import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/infrastructure/repositories/factory/createRuntime", () => ({
  createRuntime: vi.fn(),
}));

vi.mock("@/infrastructure/supabase/authz", () => ({
  requireAuthenticatedUser: vi.fn(),
  requireAdminRole: vi.fn(),
}));

import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import { requireAdminRole, requireAuthenticatedUser } from "@/infrastructure/supabase/authz";
import { GET as getUserActivity } from "@/app/api/admin/user-activity/route";
import { GET as getRoles } from "@/app/api/admin/roles/route";
import { GET as getLeads } from "@/app/api/admin/leads/route";
import { POST as reorderCategories } from "@/app/api/admin/content/categories/reorder/route";

const createRuntimeMock = vi.mocked(createRuntime);
const requireAuthenticatedUserMock = vi.mocked(requireAuthenticatedUser);
const requireAdminRoleMock = vi.mocked(requireAdminRole);

type RuntimeShape = {
  supabase: unknown;
  adminReadRepo: {
    listUserActivity: ReturnType<typeof vi.fn>;
    listRoles: ReturnType<typeof vi.fn>;
    listLeads: ReturnType<typeof vi.fn>;
  };
  kbRepo: {
    getCategoryById: ReturnType<typeof vi.fn>;
    swapCategorySortOrder: ReturnType<typeof vi.fn>;
  };
};

const buildRuntime = (): RuntimeShape => ({
  supabase: {},
  adminReadRepo: {
    listUserActivity: vi.fn().mockResolvedValue({ rows: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } }),
    listRoles: vi.fn().mockResolvedValue({ rows: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } }),
    listLeads: vi.fn().mockResolvedValue({ rows: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } }),
  },
  kbRepo: {
    getCategoryById: vi.fn().mockResolvedValue({ id: "cat-1" }),
    swapCategorySortOrder: vi.fn().mockResolvedValue(undefined),
  },
});

beforeEach(() => {
  vi.resetAllMocks();
  requireAuthenticatedUserMock.mockResolvedValue({ id: "admin-1" } as never);
  requireAdminRoleMock.mockResolvedValue(undefined as never);
});

describe("admin api contracts", () => {
  test("clamps page and pageSize for user-activity", async () => {
    const runtime = buildRuntime();
    createRuntimeMock.mockResolvedValue(runtime as never);

    const response = await getUserActivity(
      new Request("http://localhost/api/admin/user-activity?page=-5&pageSize=9999&sortBy=testsCount&sortDir=desc")
    );

    expect(response.status).toBe(200);
    expect(runtime.adminReadRepo.listUserActivity).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 100, sortBy: "testsCount", sortDir: "desc" })
    );
  });

  test("clamps page and pageSize for roles", async () => {
    const runtime = buildRuntime();
    createRuntimeMock.mockResolvedValue(runtime as never);

    const response = await getRoles(new Request("http://localhost/api/admin/roles?page=0&pageSize=500"));

    expect(response.status).toBe(200);
    expect(runtime.adminReadRepo.listRoles).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 100 })
    );
  });

  test("clamps page and pageSize for leads", async () => {
    const runtime = buildRuntime();
    createRuntimeMock.mockResolvedValue(runtime as never);

    const response = await getLeads(new Request("http://localhost/api/admin/leads?page=123&pageSize=1000"));

    expect(response.status).toBe(200);
    expect(runtime.adminReadRepo.listLeads).toHaveBeenCalledWith(
      expect.objectContaining({ page: 123, pageSize: 100 })
    );
  });

  test("reorder endpoint swaps categories atomically", async () => {
    const runtime = buildRuntime();
    runtime.kbRepo.getCategoryById
      .mockResolvedValueOnce({ id: "cat-1" })
      .mockResolvedValueOnce({ id: "cat-2" });
    createRuntimeMock.mockResolvedValue(runtime as never);

    const response = await reorderCategories(
      new Request("http://localhost/api/admin/content/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: "11111111-1111-4111-8111-111111111111", swapWithCategoryId: "22222222-2222-4222-8222-222222222222" }),
      })
    );

    expect(response.status).toBe(200);
    expect(runtime.kbRepo.swapCategorySortOrder).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222"
    );
  });

  test("reorder endpoint returns 404 if category does not exist", async () => {
    const runtime = buildRuntime();
    runtime.kbRepo.getCategoryById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "cat-2" });
    createRuntimeMock.mockResolvedValue(runtime as never);

    const response = await reorderCategories(
      new Request("http://localhost/api/admin/content/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: "11111111-1111-4111-8111-111111111111", swapWithCategoryId: "22222222-2222-4222-8222-222222222222" }),
      })
    );

    expect(response.status).toBe(404);
    expect(runtime.kbRepo.swapCategorySortOrder).not.toHaveBeenCalled();
  });

  test("reorder endpoint returns 403 for non-admin", async () => {
    const runtime = buildRuntime();
    createRuntimeMock.mockResolvedValue(runtime as never);
    requireAdminRoleMock.mockRejectedValueOnce(new Error("Forbidden"));

    const response = await reorderCategories(
      new Request("http://localhost/api/admin/content/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: "11111111-1111-4111-8111-111111111111", swapWithCategoryId: "22222222-2222-4222-8222-222222222222" }),
      })
    );

    expect(response.status).toBe(403);
  });
});
