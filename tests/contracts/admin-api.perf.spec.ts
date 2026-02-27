import { beforeEach, describe, expect, test, vi } from "vitest";
import { parseClampedInt } from "@/app/api/admin/_utils/query";

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

const createRuntimeMock = vi.mocked(createRuntime);
const requireAuthenticatedUserMock = vi.mocked(requireAuthenticatedUser);
const requireAdminRoleMock = vi.mocked(requireAdminRole);

const buildRuntime = () => ({
  supabase: {},
  adminReadRepo: {
    listUserActivity: vi.fn().mockResolvedValue({ rows: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } }),
  },
});

beforeEach(() => {
  vi.resetAllMocks();
  requireAuthenticatedUserMock.mockResolvedValue({ id: "admin-1" } as never);
  requireAdminRoleMock.mockResolvedValue(undefined as never);
});

describe("admin api performance", () => {
  test("parseClampedInt handles large input volume within budget", () => {
    const iterations = 1_000_000;
    const startedAt = performance.now();
    let checksum = 0;

    for (let index = 0; index < iterations; index += 1) {
      const raw = index % 7 === 0 ? null : String((index % 20_000) - 10_000);
      checksum += parseClampedInt(raw, { fallback: 20, min: 1, max: 100 });
    }

    const durationMs = performance.now() - startedAt;

    expect(checksum).toBeGreaterThan(0);
    expect(durationMs).toBeLessThan(2_500);
  });

  test("user-activity route sustains repeated calls", async () => {
    const runtime = buildRuntime();
    createRuntimeMock.mockResolvedValue(runtime as never);

    const iterations = 1_000;
    const startedAt = performance.now();

    for (let index = 0; index < iterations; index += 1) {
      const page = (index % 100) + 1;
      const pageSize = (index % 120) + 1;
      const response = await getUserActivity(
        new Request(`http://localhost/api/admin/user-activity?page=${page}&pageSize=${pageSize}&sortBy=lastActivityAt&sortDir=desc`)
      );
      expect(response.status).toBe(200);
    }

    const durationMs = performance.now() - startedAt;
    expect(runtime.adminReadRepo.listUserActivity).toHaveBeenCalledTimes(iterations);
    expect(durationMs).toBeLessThan(6_000);
  });
});
