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

const buildRuntime = () => ({
  supabase: {},
  adminReadRepo: {
    listUserActivity: vi.fn().mockImplementation(
      async () =>
        ({ rows: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } })
    ),
    listRoles: vi.fn().mockImplementation(
      async () =>
        ({ rows: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } })
    ),
    listLeads: vi.fn().mockImplementation(
      async () =>
        ({ rows: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } })
    ),
  },
  kbRepo: {
    getCategoryById: vi.fn().mockResolvedValue({ id: "category" }),
    swapCategorySortOrder: vi.fn().mockResolvedValue(undefined),
  },
});

beforeEach(() => {
  vi.resetAllMocks();
  requireAuthenticatedUserMock.mockResolvedValue({ id: "admin-1" } as never);
  requireAdminRoleMock.mockResolvedValue(undefined as never);
});

describe("admin api stress", () => {
  test("handles concurrent burst across list endpoints", async () => {
    const runtime = buildRuntime();
    createRuntimeMock.mockResolvedValue(runtime as never);

    const burst = 120;
    const tasks: Array<Promise<Response>> = [];

    for (let index = 0; index < burst; index += 1) {
      tasks.push(getUserActivity(new Request(`http://localhost/api/admin/user-activity?page=${index + 1}&pageSize=2000`)));
      tasks.push(getRoles(new Request(`http://localhost/api/admin/roles?page=${index + 1}&pageSize=2000`)));
      tasks.push(getLeads(new Request(`http://localhost/api/admin/leads?page=${index + 1}&pageSize=2000`)));
    }

    const responses = await Promise.all(tasks);
    responses.forEach((response) => expect(response.status).toBe(200));

    expect(runtime.adminReadRepo.listUserActivity).toHaveBeenCalledTimes(burst);
    expect(runtime.adminReadRepo.listRoles).toHaveBeenCalledTimes(burst);
    expect(runtime.adminReadRepo.listLeads).toHaveBeenCalledTimes(burst);
  });

  test("handles concurrent reorder requests", async () => {
    const runtime = buildRuntime();
    createRuntimeMock.mockResolvedValue(runtime as never);

    const first = "11111111-1111-4111-8111-111111111111";
    const second = "22222222-2222-4222-8222-222222222222";
    const burst = 150;

    const responses = await Promise.all(
      Array.from({ length: burst }, () =>
        reorderCategories(
          new Request("http://localhost/api/admin/content/categories/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoryId: first, swapWithCategoryId: second }),
          })
        )
      )
    );

    responses.forEach((response) => expect(response.status).toBe(200));
    expect(runtime.kbRepo.swapCategorySortOrder).toHaveBeenCalledTimes(burst);
  });

  test("gracefully rejects invalid reorder payload flood", async () => {
    const runtime = buildRuntime();
    createRuntimeMock.mockResolvedValue(runtime as never);

    const burst = 80;

    const responses = await Promise.all(
      Array.from({ length: burst }, () =>
        reorderCategories(
          new Request("http://localhost/api/admin/content/categories/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoryId: "bad-id", swapWithCategoryId: "also-bad" }),
          })
        )
      )
    );

    responses.forEach((response) => expect(response.status).toBe(400));
    expect(runtime.kbRepo.swapCategorySortOrder).not.toHaveBeenCalled();
  });
});
