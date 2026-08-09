import { zipSync } from "fflate";
import { getSkillSource } from "@/lib/db";

/** ponytail: 응답 4MB 상한(Vercel 함수 제한 4.5MB)을 넘으면 GitHub 폴더로 넘긴다.
 *  실측 490건 중 압축 후 초과 0건(최대 canvas-design 5.55MB→2.72MB).
 *  더 큰 스킬이 늘면 Supabase Storage 사전 생성으로 올린다. */
const MAX_ZIP_BYTES = 4 * 1024 * 1024;
const MAX_RAW_BYTES = 12 * 1024 * 1024;
const MAX_FILES = 400;

interface TreeEntry {
  path: string;
  type: string;
  size?: number;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const src = await getSkillSource(slug);
  if (!src) return new Response("Not found", { status: 404 });

  const dir = src.path.slice(0, src.path.lastIndexOf("/") + 1);
  const githubFolder = `https://github.com/${src.repo_full_name}/tree/HEAD/${dir.slice(0, -1)}`;

  const treeRes = await fetch(
    `https://api.github.com/repos/${src.repo_full_name}/git/trees/HEAD?recursive=1`,
    { headers: { Accept: "application/vnd.github+json" }, next: { revalidate: 3600 } },
  );
  if (!treeRes.ok) return Response.redirect(githubFolder, 302);
  const tree = (await treeRes.json()) as { tree?: TreeEntry[] };
  const files = (tree.tree ?? []).filter((t) => t.type === "blob" && t.path.startsWith(dir));

  const rawBytes = files.reduce((a, f) => a + (f.size ?? 0), 0);
  if (files.length === 0 || files.length > MAX_FILES || rawBytes > MAX_RAW_BYTES) {
    return Response.redirect(githubFolder, 302);
  }

  const entries: Record<string, Uint8Array> = {};
  await Promise.all(
    files.map(async (f) => {
      const res = await fetch(
        `https://raw.githubusercontent.com/${src.repo_full_name}/HEAD/${f.path}`,
        { next: { revalidate: 3600 } },
      );
      if (!res.ok) throw new Error(`raw fetch 실패: ${f.path} ${res.status}`);
      // ZIP 루트는 스킬 폴더 하나 — Claude 앱 업로드 규격
      entries[`${slug}/${f.path.slice(dir.length)}`] = new Uint8Array(await res.arrayBuffer());
    }),
  );

  const zip = zipSync(entries, { level: 6 });
  if (zip.byteLength > MAX_ZIP_BYTES) return Response.redirect(githubFolder, 302);

  return new Response(zip as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}.zip"`,
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
