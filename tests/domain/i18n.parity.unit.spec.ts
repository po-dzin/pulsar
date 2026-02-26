import { describe, expect, test } from "vitest";
import ru from "@/i18n/ru.json";
import en from "@/i18n/en.json";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const collectPaths = (value: JsonValue, prefix = ""): string[] => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, next]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return collectPaths(next as JsonValue, path);
  });
};

const getByPath = (value: JsonValue, path: string): JsonValue | undefined => {
  const segments = path.split(".");
  let current: JsonValue = value;
  for (const segment of segments) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, JsonValue>)[segment];
  }
  return current;
};

describe("i18n parity", () => {
  test("RU and EN dictionaries have identical key paths", () => {
    const ruPaths = new Set(collectPaths(ru as JsonValue));
    const enPaths = new Set(collectPaths(en as JsonValue));

    expect([...ruPaths].sort()).toEqual([...enPaths].sort());
  });

  test("all translated leaf strings are non-empty", () => {
    const paths = collectPaths(ru as JsonValue);
    for (const path of paths) {
      const ruValue = getByPath(ru as JsonValue, path);
      const enValue = getByPath(en as JsonValue, path);

      if (typeof ruValue === "string") {
        expect(ruValue.trim().length, `ru.${path} should not be empty`).toBeGreaterThan(0);
      }
      if (typeof enValue === "string") {
        expect(enValue.trim().length, `en.${path} should not be empty`).toBeGreaterThan(0);
      }
    }
  });
});
