/** ChatGPT 명령어 — "클로드스킬 배우기" 폴더의 chatgpt-명령어.json·맞춤지침.txt를 정규화한 것.
 *
 *  두 묶음이다:
 *  ① 사고·글쓰기 37개 — /이름은 외우기 쉬우라고 붙인 라벨이고 ChatGPT가 알아듣는 건 설명이다.
 *     ChatGPT 설정의 '맞춤 지침'에 전체를 한 번 넣어두면 그 뒤로는 /truth처럼 이름만 쳐도 먹는다.
 *     붙여넣을 전문은 buildCustomInstructions()가 이 데이터에서 조립한다 — 원본은 하나다.
 *  ② 공부 명령어 4개 — Cheat Sheet → Blueprint → Flashcards → Mind Map 순서로 한 주제를 끝낸다.
 *
 *  출처(사이트에 크레딧 표기): ①: 신영선 "챗GPT 아스트라 치트키 코드"(2026-09-19)
 *  https://yeongseon.kr/archive/3d8d86104de2804d9aeee10695f613bb.html
 *  ②: 게으른빌더 "ChatGPT 최고의 트릭 4개 명령어"(2026-08-20)
 *  https://www.youtube.com/shorts/Jf7c9evXccY
 */
export const GPT_CATS = ["judge", "write", "analyze", "execute", "self"] as const;
export type GptCat = (typeof GPT_CATS)[number];

export interface GptCmd {
  cmd: string;
  cat: GptCat;
  ko: string;
  vi: string;
  en: string;
}

export const GPT_CMDS: GptCmd[] = [
  // ───── 사고·판단 강제
  { cmd: "/truth", cat: "judge", ko: "듣기 좋은 말 끄고 진짜 판단만", vi: "Tắt lời dễ nghe, chỉ đưa phán đoán thật", en: "Drop the flattery, give me your real judgment only" },
  { cmd: "/devil", cat: "judge", ko: "내 주장을 반대 입장에서 공격", vi: "Tấn công lập luận của tôi từ phía đối lập", en: "Attack my argument from the opposing side" },
  { cmd: "/odds", cat: "judge", ko: "성공 확률을 숫자로 추정 + 근거", vi: "Ước tính xác suất thành công bằng con số + căn cứ", en: "Estimate the odds of success as a number, with reasons" },
  { cmd: "/premortem", cat: "judge", ko: "이 계획이 망했다고 가정하고 원인 역추적", vi: "Giả định kế hoạch này đã thất bại và truy ngược nguyên nhân", en: "Assume this plan failed and trace back the causes" },
  { cmd: "/blindspot", cat: "judge", ko: "내가 놓치고 있는 변수만 나열", vi: "Chỉ liệt kê những biến số tôi đang bỏ sót", en: "List only the variables I'm missing" },
  { cmd: "/steelman", cat: "judge", ko: "반대 의견을 가장 강한 형태로 재구성", vi: "Dựng lại ý kiến phản đối ở dạng mạnh nhất", en: "Rebuild the opposing view in its strongest form" },
  { cmd: "/tradeoff", cat: "judge", ko: "선택지별 얻는 것과 잃는 것 표로", vi: "Bảng được–mất cho từng lựa chọn", en: "Table of what each option gains and loses" },
  { cmd: "/second-order", cat: "judge", ko: "이 결정의 2차·3차 파급효과까지", vi: "Cả hệ quả bậc 2, bậc 3 của quyết định này", en: "Include the second- and third-order effects of this decision" },
  { cmd: "/simulate", cat: "judge", ko: "5년 뒤 시나리오 비교", vi: "So sánh các kịch bản sau 5 năm", en: "Compare scenarios five years out" },
  { cmd: "/cost", cat: "judge", ko: "실행에 드는 돈·시간·인력 추산", vi: "Ước tính tiền, thời gian, nhân lực để thực hiện", en: "Estimate the money, time and people needed to execute" },
  // ───── 글쓰기·편집
  { cmd: "/human", cat: "write", ko: "AI 티 제거, 사람 문장으로", vi: "Xóa dấu vết AI, viết như người thật", en: "Remove the AI tells, write like a human" },
  { cmd: "/no fluff", cat: "write", ko: "길이 반으로, 군더더기 제거", vi: "Cắt còn một nửa, bỏ phần thừa", en: "Half the length, cut the filler" },
  { cmd: "/hook", cat: "write", ko: "첫 문장 후보 10개", vi: "10 phương án cho câu mở đầu", en: "Ten candidate opening lines" },
  { cmd: "/tone", cat: "write", ko: "지정한 톤으로 전면 리라이팅", vi: "Viết lại toàn bộ theo giọng điệu chỉ định", en: "Rewrite everything in the tone I specify" },
  { cmd: "/cut", cat: "write", ko: "의미 유지하고 30%만 삭제", vi: "Giữ nguyên ý, xóa đúng 30%", en: "Keep the meaning, delete 30%" },
  { cmd: "/simplify", cat: "write", ko: "중학생도 이해하는 수준으로", vi: "Đơn giản đến mức học sinh cấp hai cũng hiểu", en: "Simple enough for a middle schooler" },
  { cmd: "/punch", cat: "write", ko: "문장 짧게 끊고 리듬 살리기", vi: "Ngắt câu ngắn, tạo nhịp điệu", en: "Short sentences, bring back the rhythm" },
  { cmd: "/title", cat: "write", ko: "제목 후보 20개 + 각각의 노림수", vi: "20 phương án tiêu đề + ý đồ của từng cái", en: "Twenty title options, each with its angle" },
  { cmd: "/cta", cat: "write", ko: "행동 유도 문구 버전별로", vi: "Các phiên bản câu kêu gọi hành động", en: "Call-to-action copy, in versions" },
  // ───── 분석·해독
  { cmd: "/decode", cat: "analyze", ko: "계약서·약관에서 불리한 조항만", vi: "Chỉ các điều khoản bất lợi trong hợp đồng, điều khoản", en: "Only the clauses that work against me in this contract" },
  { cmd: "/gap", cat: "analyze", ko: "이 문서에서 빠진 항목 체크", vi: "Kiểm tra các mục còn thiếu trong tài liệu này", en: "Check what's missing from this document" },
  { cmd: "/red", cat: "analyze", ko: "이 제안서의 약점을 심사위원 입장에서", vi: "Điểm yếu của đề xuất này dưới góc nhìn giám khảo", en: "This proposal's weaknesses, as a judge would see them" },
  { cmd: "/source", cat: "analyze", ko: "주장별로 근거 강도 표시", vi: "Đánh dấu độ mạnh của căn cứ cho từng luận điểm", en: "Rate the strength of evidence for each claim" },
  { cmd: "/compare", cat: "analyze", ko: "두 대상 기준별 비교표", vi: "Bảng so sánh hai đối tượng theo từng tiêu chí", en: "Criteria-by-criteria comparison table of the two" },
  { cmd: "/eli5", cat: "analyze", ko: "전문 용어 다 풀어서 설명", vi: "Giải thích bằng cách diễn giải hết thuật ngữ", en: "Explain with all the jargon unpacked" },
  // ───── 실행·구조화
  { cmd: "/step", cat: "execute", ko: "결론 전에 근거를 단계별로 먼저", vi: "Trình bày căn cứ theo từng bước trước khi kết luận", en: "Reasons step by step before the conclusion" },
  { cmd: "/checklist", cat: "execute", ko: "실행 체크리스트로 변환", vi: "Chuyển thành checklist thực hiện", en: "Turn it into an action checklist" },
  { cmd: "/table", cat: "execute", ko: "답변을 표 형식으로", vi: "Trả lời ở dạng bảng", en: "Answer in a table" },
  { cmd: "/owner", cat: "execute", ko: "할 일마다 담당자·기한 붙여서", vi: "Gắn người phụ trách và hạn chót cho từng việc", en: "Attach an owner and deadline to every task" },
  { cmd: "/mvp", cat: "execute", ko: "최소 버전으로 잘라내기", vi: "Cắt xuống phiên bản tối thiểu", en: "Cut it down to the minimum version" },
  { cmd: "/scope", cat: "execute", ko: "이번 범위와 다음 범위 분리", vi: "Tách phạm vi lần này và lần sau", en: "Separate this round's scope from the next" },
  { cmd: "/rewrite-brief", cat: "execute", ko: "내 요청을 더 좋은 프롬프트로 다시 써줘", vi: "Viết lại yêu cầu của tôi thành prompt tốt hơn", en: "Rewrite my request as a better prompt" },
  // ───── 자기 이해
  { cmd: "/shrink", cat: "self", ko: "이 선택을 반복하는 이유 분석", vi: "Phân tích vì sao tôi lặp lại lựa chọn này", en: "Analyze why I keep making this choice" },
  { cmd: "/pattern", cat: "self", ko: "대화 기록에서 반복되는 패턴 추출", vi: "Rút ra các khuôn mẫu lặp lại trong lịch sử trò chuyện", en: "Extract the repeating patterns in our chat history" },
  { cmd: "/rewire", cat: "self", ko: "하루 루틴 설계", vi: "Thiết kế lịch trình một ngày", en: "Design my daily routine" },
  { cmd: "/block", cat: "self", ko: "실행을 막는 진짜 원인", vi: "Nguyên nhân thật sự cản trở việc thực hiện", en: "The real cause blocking me from acting" },
  { cmd: "/mirror", cat: "self", ko: "내 말투·사고방식을 요약해서 되돌려주기", vi: "Tóm tắt giọng văn và lối tư duy của tôi rồi phản chiếu lại", en: "Summarize my voice and thinking back to me" },
];

/** 맞춤 지침 서문 — ChatGPT 설정 > 맞춤 지침에 들어갈 첫 단락 */
const PREAMBLE = {
  ko: "내가 /로 시작하는 말을 쓰면 아래 뜻으로 알아듣고 바로 실행해라. 뜻을 되묻지 말고, 명령이 없는 평범한 질문은 평소대로 답해라. 여러 개를 붙여 쓰면(/truth /no fluff) 적힌 순서대로 적용해라.",
  vi: "Khi tôi gõ từ bắt đầu bằng /, hãy hiểu theo nghĩa bên dưới và thực hiện ngay. Đừng hỏi lại nghĩa; câu hỏi bình thường không có lệnh thì trả lời như thường. Nếu tôi ghép nhiều lệnh (/truth /no fluff), áp dụng theo đúng thứ tự.",
  en: "When I type something starting with /, read it as defined below and act immediately. Don't ask what it means; answer ordinary questions normally. If I chain several (/truth /no fluff), apply them in the order written.",
} as const;

export const GPT_CAT_LABEL_KEYS: Record<GptCat, string> = {
  judge: "judge", write: "write", analyze: "analyze", execute: "execute", self: "self",
};

/** 설정에 붙여넣을 전문을 데이터에서 조립한다 — 표와 붙여넣기 블록이 어긋날 수 없다 */
export function buildCustomInstructions(locale: "ko" | "vi" | "en", catLabel: (cat: GptCat) => string): string {
  const parts = [PREAMBLE[locale], ""];
  for (const cat of GPT_CATS) {
    parts.push(`[${catLabel(cat)}]`);
    for (const c of GPT_CMDS.filter((x) => x.cat === cat)) parts.push(`${c.cmd} = ${c[locale]}`);
    parts.push("");
  }
  return parts.join("\n").trim();
}

/** 공부 명령어 4종 — 순서대로 쓰면 한 주제가 끝난다 */
export interface StudyCmd {
  cmd: string;
  ko: { name: string; desc: string; example: string; tip: string };
  vi: { name: string; desc: string; example: string; tip: string };
  en: { name: string; desc: string; example: string; tip: string };
}

export const STUDY_CMDS: StudyCmd[] = [
  {
    cmd: "Cheat Sheet:",
    ko: { name: "치트 시트", desc: "주제 하나를 한 페이지로 압축한다. 핵심 개념, 중요 공식, 용어 정의를 목록으로 정리해준다. 시험 전날처럼 빨리 훑어야 할 때 첫 번째로 쓴다.", example: "Cheat Sheet: 지도학습 분류. 대학교 1학년 수준. 금요일 시험 대비", tip: "수준(중학생/대학교 1학년)과 목적(시험 대비/면접 준비)을 같이 적으면 눈높이가 맞는다." },
    vi: { name: "Cheat Sheet", desc: "Nén một chủ đề vào một trang: khái niệm cốt lõi, công thức quan trọng, định nghĩa thuật ngữ thành danh sách. Dùng đầu tiên khi cần lướt nhanh, như đêm trước kỳ thi.", example: "Cheat Sheet: phân loại học có giám sát. Trình độ năm nhất đại học. Ôn thi thứ Sáu", tip: "Ghi kèm trình độ (cấp hai/năm nhất) và mục đích (ôn thi/phỏng vấn) thì nội dung sẽ đúng tầm." },
    en: { name: "Cheat sheet", desc: "Compresses one topic onto one page — key concepts, important formulas and term definitions as lists. Use it first when you need a fast sweep, like the night before an exam.", example: "Cheat Sheet: supervised classification. College freshman level. For Friday's exam", tip: "Add your level (middle school/college freshman) and goal (exam/interview prep) and it meets you at eye level." },
  },
  {
    cmd: "Blueprint:",
    ko: { name: "블루프린트", desc: "주제를 뜯어서 무엇을 어떤 순서로 배워야 하는지, 개념끼리 어떻게 연결되는지 한 장으로 보여준다. 초급에서 고급까지 단계가 나온다.", example: "Blueprint: 지도학습 분류", tip: "치트 시트로 훑은 뒤에 쓰면, 방금 본 조각들이 어디에 붙는 건지 자리가 잡힌다." },
    vi: { name: "Blueprint", desc: "Mổ xẻ chủ đề thành một trang: học gì theo thứ tự nào, các khái niệm nối với nhau ra sao, từ sơ cấp đến nâng cao.", example: "Blueprint: phân loại học có giám sát", tip: "Dùng sau Cheat Sheet — những mảnh vừa lướt qua sẽ tìm được chỗ của mình." },
    en: { name: "Blueprint", desc: "Takes the topic apart and shows, on one page, what to learn in what order and how the concepts connect — beginner through advanced.", example: "Blueprint: supervised classification", tip: "Use it after the cheat sheet, and the pieces you just skimmed snap into place." },
  },
  {
    cmd: "Flashcards:",
    ko: { name: "플래시카드", desc: "주제를 앞면 질문·뒷면 답 형태의 카드 덱으로 만든다. 장수를 정할 수 있고, 만든 뒤 바로 퀴즈를 풀 수 있다.", example: "Flashcards: 지도학습 분류, 20장", tip: "카드가 나온 뒤 \"한 장씩 퀴즈로 내주세요. 내 답을 먼저 받고 채점해 주세요\"라고 이어서 치면 실제로 외워진다. 읽기만 하면 안 남는다." },
    vi: { name: "Flashcards", desc: "Biến chủ đề thành bộ thẻ mặt trước câu hỏi, mặt sau đáp án. Chọn được số thẻ và có thể làm quiz ngay sau khi tạo.", example: "Flashcards: phân loại học có giám sát, 20 thẻ", tip: "Sau khi có thẻ, gõ tiếp \"Ra quiz từng thẻ một. Nhận câu trả lời của tôi trước rồi chấm điểm\" — như vậy mới nhớ thật. Chỉ đọc thì không đọng lại." },
    en: { name: "Flashcards", desc: "Turns the topic into a deck — question on the front, answer on the back. You pick the count, and you can quiz yourself right after.", example: "Flashcards: supervised classification, 20 cards", tip: "Once the cards appear, follow with \"Quiz me one card at a time. Take my answer first, then grade it\" — that's when it actually sticks. Reading alone doesn't." },
  },
  {
    cmd: "Mind Map:",
    ko: { name: "마인드맵", desc: "가운데 주제에서 갈래가 뻗고 그 아래 항목이 붙는 계층 구조로 그려준다. 전체가 한눈에 들어와 마무리 정리에 좋다.", example: "Mind Map: 지도학습 분류", tip: "공부를 끝낸 뒤 백지에 직접 그려보고 나온 것과 비교하면 빠진 부분이 드러난다." },
    vi: { name: "Mind map", desc: "Vẽ cấu trúc phân nhánh từ chủ đề ở giữa, các mục bám theo từng nhánh. Nhìn một phát thấy toàn cục — hợp để tổng kết.", example: "Mind Map: phân loại học có giám sát", tip: "Học xong, tự vẽ lại trên giấy trắng rồi so với bản AI vẽ — chỗ hổng sẽ lộ ra." },
    en: { name: "Mind map", desc: "Draws a hierarchy branching out from the central topic. The whole picture in one glance — great for wrapping up.", example: "Mind Map: supervised classification", tip: "After studying, draw it yourself on blank paper and compare — the gaps reveal themselves." },
  },
];

export const GPT_SOURCES = {
  think: { title: "챗GPT 아스트라 치트키 코드", author: "신영선", url: "https://yeongseon.kr/archive/3d8d86104de2804d9aeee10695f613bb.html", date: "2026-09-19" },
  study: { title: "ChatGPT 최고의 트릭 4개 명령어", author: "게으른빌더", url: "https://www.youtube.com/shorts/Jf7c9evXccY", date: "2026-08-20" },
} as const;
