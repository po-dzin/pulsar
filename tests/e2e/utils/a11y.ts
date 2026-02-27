import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

export const expectNoCriticalA11yViolations = async (page: Page, include?: string[]) => {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]);

  if (include && include.length > 0) {
    for (const selector of include) {
      builder = builder.include(selector);
    }
  }

  const result = await builder.analyze();
  const critical = result.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious"
  );

  expect(
    critical,
    critical
      .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`)
      .join("\n")
  ).toEqual([]);
};
