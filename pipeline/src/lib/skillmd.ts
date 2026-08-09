import { createHash } from "node:crypto";
import { parse as parseYaml } from "yaml";

export interface SkillMeta {
  name: string;
  description: string;
}

export function parseSkillMd(raw: string): SkillMeta | null {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  try {
    const fm = parseYaml(m[1]) as Record<string, unknown> | null;
    const name = typeof fm?.name === "string" ? fm.name.trim() : "";
    const description = typeof fm?.description === "string" ? fm.description.trim() : "";
    if (name && description) return { name, description };
  } catch {
    // 깨진 YAML은 무효 스킬로 취급
  }
  return null;
}

export function contentHash(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function makeSlug(name: string, repoFullName: string, taken: Set<string>): string {
  const base =
    name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-+|-+$/g, "") || "skill";
  if (!taken.has(base)) return base;
  const owner = repoFullName.split("/")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const prefixed = `${owner}-${base}`;
  if (!taken.has(prefixed)) return prefixed;
  let i = 2;
  while (taken.has(`${prefixed}-${i}`)) i++;
  return `${prefixed}-${i}`;
}
