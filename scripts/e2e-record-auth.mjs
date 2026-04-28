import { chromium } from "@playwright/test";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import process from "node:process";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";
const outputPath = process.argv[2] || "tests/e2e/.auth/user.json";
const channel = process.env.E2E_AUTH_RECORD_CHANNEL || "chrome";

const ensureDir = async (path) => {
  const dir = path.split("/").slice(0, -1).join("/");
  if (dir) {
    await mkdir(dir, { recursive: true });
  }
};

const waitForEnter = async () => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await rl.question("После входа в аккаунт нажми Enter в этом терминале...");
  rl.close();
};

const main = async () => {
  await ensureDir(outputPath);
  const userDataDir = await mkdtemp(join(tmpdir(), "pulsar-e2e-auth-"));

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel,
    ignoreDefaultArgs: ["--enable-automation"],
    args: ["--disable-blink-features=AutomationControlled"],
    viewport: { width: 1366, height: 900 },
  });

  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(`${baseURL}/?lang=en`, { waitUntil: "domcontentloaded" });

  process.stdout.write(`\nОткрыл ${baseURL}\n`);
  process.stdout.write("1) Нажми \"Sign in / Войти\"\n");
  process.stdout.write("2) Пройди Google OAuth\n");
  process.stdout.write(`3) Вернись в терминал, чтобы сохранить state в ${outputPath}\n\n`);

  await waitForEnter();
  await context.storageState({ path: outputPath });
  await context.close();

  process.stdout.write(`Готово. Сессия сохранена: ${outputPath}\n`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
