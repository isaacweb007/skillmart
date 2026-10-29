import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CategoryIcon from "@/components/CategoryIcon";
import Chip from "@/components/Chip";
import SearchBar from "@/components/SearchBar";
import SkillCard from "@/components/SkillCard";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, DIFFICULTIES } from "@/lib/categories";
import { categoryCounts, countVisibleSkills, PAGE_SIZE, searchSkills } from "@/lib/db";
import { pageAlternates } from "@/lib/site";

export const revalidate = 3600;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  const raw = await searchParams;
  const t = await getTranslations({ locale });
  const category = first(raw.category);
  // 코너만 지정된 변형만 독립 페이지로 색인한다.
  // 다른 파라미터가 섞이면 /skills로 통합해 무한 조합이 색인되는 것을 막는다.
  const cornerOnly =
    category !== undefined &&
    (CATEGORIES as readonly string[]).includes(category) &&
    !first(raw.q) &&
    !first(raw.difficulty) &&
    !first(raw.sort) &&
    !first(raw.page);

  if (cornerOnly) {
    const corner = t(`categories.${category}`);
    const total = await countVisibleSkills(locale, category);
    return {
      title: { absolute: t("seo.cornerTitle", { corner, count: total }) },
      description: t("seo.cornerDesc", { corner, count: total }),
      alternates: pageAlternates(locale, `/skills?category=${category}`),
    };
  }

  // "바로 쓰기 좋은 스킬" = 난이도만 beginner로 지정된 변형. 코너와 같은 취급으로 색인한다.
  const difficulty = first(raw.difficulty);
  const easyOnly =
    difficulty === "beginner" && !category && !first(raw.q) && !first(raw.sort) && !first(raw.page);
  if (easyOnly) {
    const total = await countVisibleSkills(locale, undefined, difficulty);
    return {
      title: { absolute: t("seo.easyTitle", { count: total }) },
      description: t("seo.easyDesc", { count: total }),
      alternates: pageAlternates(locale, "/skills?difficulty=beginner"),
    };
  }

  const total = await countVisibleSkills(locale);
  return {
    title: { absolute: t("seo.listTitle", { count: total }) },
    description: t("seo.listDesc", { count: total }),
    alternates: pageAlternates(locale, "/skills"),
  };
}

type Search = { q?: string; category?: string; difficulty?: string; sort?: string; page?: string };

function qs(base: Search, patch: Partial<Search>): string {
  const merged: Record<string, string | undefined> = { ...base, ...patch };
  const params = new URLSearchParams();
  for (const key of ["q", "category", "difficulty", "sort", "page"]) {
    const v = merged[key];
    if (v) params.set(key, v);
  }
  const s = params.toString();
  return s ? `/skills?${s}` : "/skills";
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** 처음·현재±1·끝, 사이가 벌어지면 "…". [1,"…",41,42,43,"…",85] 꼴 */
function pageItems(page: number, lastPage: number): (number | "…")[] {
  const want = new Set([1, page - 1, page, page + 1, lastPage]);
  const nums = [...want].filter((n) => n >= 1 && n <= lastPage).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i] - nums[i - 1] > 1) out.push("…");
    out.push(nums[i]);
  }
  return out;
}

export default async function SkillsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const raw = await searchParams;
  const sp: Search = {
    q: first(raw.q),
    category: first(raw.category),
    difficulty: first(raw.difficulty),
    sort: first(raw.sort),
    page: first(raw.page),
  };
  const t = await getTranslations();
  const sort = sp.sort === "new" ? "new" : sp.sort === "trending" ? "trending" : "rank";
  const pageNum = Number(sp.page);
  const page = Number.isInteger(pageNum) && pageNum > 0 ? pageNum : 1;
  const [{ items, total }, counts] = await Promise.all([
    searchSkills({
      locale,
      q: sp.q,
      category: sp.category,
      difficulty: sp.difficulty,
      sort,
      page,
    }),
    categoryCounts(locale),
  ]);
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base: Search = { ...sp, sort, page: undefined };

  if (total > 0 && page > lastPage) {
    redirect(`/${locale}${qs(base, { page: lastPage > 1 ? String(lastPage) : undefined })}`);
  }

  return (
    <div className="py-8">
      <h1 className="mb-4 font-display text-2xl font-semibold">
        {sp.category && (CATEGORIES as readonly string[]).includes(sp.category)
          ? t(`categories.${sp.category}`)
          : sp.difficulty === "beginner" && !sp.category
            ? t("list.easyTitle")
            : t("list.title")}
      </h1>
      <div className="mb-5 max-w-xl">
        <SearchBar locale={locale} defaultValue={sp.q ?? ""} />
      </div>

      {/* 모바일은 가로 스크롤, sm 이상은 전부 펼친다 — 13개 코너가 화면 밖에 숨지 않게 */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        <Link href={qs(base, { category: undefined })} aria-current={!sp.category ? "true" : undefined}>
          <Chip active={!sp.category}>{t("list.all")}</Chip>
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={qs(base, { category: c })} aria-current={sp.category === c ? "true" : undefined}>
            <Chip active={sp.category === c}>
              <CategoryIcon category={c} className="h-3.5 w-3.5" />
              {t(`categories.${c}`)}
              <span className={sp.category === c ? "opacity-70" : "text-ink-tertiary"}>
                {counts[c] ?? 0}
              </span>
            </Chip>
          </Link>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
        <Link href={qs(base, { difficulty: undefined })} aria-current={!sp.difficulty ? "true" : undefined}>
          <Chip active={!sp.difficulty}>{t("list.allLevels")}</Chip>
        </Link>
        {DIFFICULTIES.map((d) => (
          <Link key={d} href={qs(base, { difficulty: d })} aria-current={sp.difficulty === d ? "true" : undefined}>
            <Chip active={sp.difficulty === d}>{t(`difficulty.${d}`)}</Chip>
          </Link>
        ))}
        <span className="mx-2 text-line" aria-hidden="true">|</span>
        <Link href={qs(base, { sort: "rank" })} aria-current={sort === "rank" ? "true" : undefined}>
          <Chip active={sort === "rank"}>{t("list.sortRank")}</Chip>
        </Link>
        <Link href={qs(base, { sort: "new" })} aria-current={sort === "new" ? "true" : undefined}>
          <Chip active={sort === "new"}>{t("list.sortNew")}</Chip>
        </Link>
        <Link href={qs(base, { sort: "trending" })} aria-current={sort === "trending" ? "true" : undefined}>
          <Chip active={sort === "trending"}>{t("list.sortTrending")}</Chip>
        </Link>
        <span className="ml-auto text-ink-soft">{t("list.resultCount", { count: total })}</span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
          {t("list.empty")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((s) => (
            <SkillCard key={s.id} skill={s} />
          ))}
        </div>
      )}

      {lastPage > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-1.5 text-sm" aria-label={t("list.title")}>
          {page > 1 && (
            <Link
              className="rounded-md border border-line px-3 py-1.5 text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
              href={qs(base, { page: page - 1 > 1 ? String(page - 1) : undefined })}
            >
              ← {t("list.prev")}
            </Link>
          )}
          {/* 85페이지를 이전/다음으로만 걷게 하지 않는다: 처음·현재±1·끝 + 줄임표 */}
          {pageItems(page, lastPage).map((it, i) =>
            it === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-ink-tertiary" aria-hidden="true">…</span>
            ) : (
              <Link
                key={it}
                href={qs(base, { page: it > 1 ? String(it) : undefined })}
                aria-current={it === page ? "page" : undefined}
                className={`rounded-md border px-3 py-1.5 transition-colors ${
                  it === page
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-line text-ink-soft hover:border-line-strong hover:text-ink"
                }`}
              >
                {it}
              </Link>
            ),
          )}
          {page < lastPage && (
            <Link
              className="rounded-md border border-line px-3 py-1.5 text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
              href={qs(base, { page: String(page + 1) })}
            >
              {t("list.next")} →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
