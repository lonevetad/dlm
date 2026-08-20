import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DLM_TEST_DATA_DIR
  ? path.resolve(process.env.DLM_TEST_DATA_DIR)
  : path.resolve(process.cwd(), "data");

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readJson<T = Record<string, unknown>>(
  fileName: string,
  fallback: T,
): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(fileName: string, payload: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
}
