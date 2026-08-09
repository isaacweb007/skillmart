export interface SkillListItem {
  id: string;
  slug: string;
  category: string;
  difficulty: string | null;
  ai_score: number | null;
  stars: number;
  is_official: boolean;
  created_at: string;
  rank_score: number;
  name: string;
  one_liner: string;
}
