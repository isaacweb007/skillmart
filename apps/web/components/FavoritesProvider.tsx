"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface Ctx {
  ids: Set<string>;
  signedIn: boolean;
  /** 세션 확인 전에는 false — 이걸 안 보면 로그인한 사람도 첫 프레임에 "로그인하세요"를 본다 */
  ready: boolean;
  toggle: (skillId: string) => Promise<void>;
}

const FavoritesContext = createContext<Ctx>({
  ids: new Set(),
  signedIn: false,
  ready: false,
  toggle: async () => {},
});

export function useFavorites() {
  return useContext(FavoritesContext);
}

export default function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async (uid: string | null) => {
    setUserId(uid);
    if (!uid) {
      setIds(new Set());
      return;
    }
    const { data } = await supabaseBrowser.from("user_favorites").select("skill_id");
    setIds(new Set((data ?? []).map((r) => r.skill_id as string)));
  }, []);

  useEffect(() => {
    supabaseBrowser.auth
      .getSession()
      .then(({ data }) => load(data.session?.user.id ?? null))
      .finally(() => setReady(true));
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_e, session) =>
      void load(session?.user.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const toggle = useCallback(
    async (skillId: string) => {
      if (!userId) return;
      const had = ids.has(skillId);
      // 낙관적 갱신 — 실패 시 되돌린다
      setIds((prev) => {
        const next = new Set(prev);
        if (had) next.delete(skillId);
        else next.add(skillId);
        return next;
      });
      const { error } = had
        ? await supabaseBrowser
            .from("user_favorites")
            .delete()
            .eq("user_id", userId)
            .eq("skill_id", skillId)
        : await supabaseBrowser
            .from("user_favorites")
            .insert({ user_id: userId, skill_id: skillId });
      if (error) {
        setIds((prev) => {
          const next = new Set(prev);
          if (had) next.add(skillId);
          else next.delete(skillId);
          return next;
        });
      }
    },
    [ids, userId],
  );

  return (
    <FavoritesContext.Provider value={{ ids, signedIn: !!userId, ready, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}
