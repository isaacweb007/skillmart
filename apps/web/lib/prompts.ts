/** 설치 없이 바로 쓰는 프롬프트 40개.
 *
 *  UI 문자열이 아니라 콘텐츠 데이터라 messages JSON이 아니라 여기 둔다(항목이 40×3 언어).
 *  각 항목은 붙여넣을 문장 하나와, "매번 안 쓰려면" 이어질 코너 하나를 갖는다 —
 *  범용 요령을 스킬로 잇는 것이 이 페이지가 우리 사이트에 기여하는 방식이다.
 *  정식 슬래시 명령어가 아니다(Claude에 그런 기능은 없다). cmd는 이름표일 뿐이다.
 */
export interface PromptItem {
  cmd: string;
  category: string;
  ko: { label: string; example: string };
  vi: { label: string; example: string };
  en: { label: string; example: string };
}

export const PROMPTS: PromptItem[] = [
  {
    cmd: "eli5", category: "education",
    ko: { label: "아주 쉽게 설명", example: "블록체인이 뭔지 초등학생도 이해하게 아주 쉽게 설명해줘" },
    vi: { label: "Giải thích siêu đơn giản", example: "Giải thích blockchain đơn giản như cho học sinh tiểu học" },
    en: { label: "Explain it simply", example: "Explain blockchain simply enough for a ten-year-old" },
  },
  {
    cmd: "tldr", category: "docs-office",
    ko: { label: "3줄 요약", example: "아래 글을 핵심만 3줄로 요약해줘:" },
    vi: { label: "Tóm tắt 3 dòng", example: "Tóm tắt bài dưới đây trong 3 dòng, chỉ ý chính:" },
    en: { label: "Three-line summary", example: "Summarize the text below in three lines, key points only:" },
  },
  {
    cmd: "steelman", category: "content-writing",
    ko: { label: "가장 설득력 있게 보강", example: "'주 4일 근무제 도입' 주장을 가장 설득력 있게 보강해서 정리해줘" },
    vi: { label: "Củng cố lập luận", example: "Trình bày lập luận 'tuần làm việc 4 ngày' theo cách thuyết phục nhất" },
    en: { label: "Strongest version of the argument", example: "Make the strongest possible case for a four-day work week" },
  },
  {
    cmd: "devil", category: "content-writing",
    ko: { label: "반대편에서 반박", example: "'재택근무가 무조건 좋다'는 내 주장을 반대편 입장에서 날카롭게 반박해줘" },
    vi: { label: "Phản biện phía đối lập", example: "Phản biện thật sắc lập luận 'làm việc từ xa luôn tốt hơn'" },
    en: { label: "Argue the other side", example: "Push back hard on my claim that remote work is always better" },
  },
  {
    cmd: "pros-cons", category: "data-analytics",
    ko: { label: "장단점 표", example: "아이폰과 갤럭시의 장점과 단점을 한눈에 보이는 표로 정리해줘" },
    vi: { label: "Bảng ưu và nhược", example: "Lập bảng ưu nhược điểm của iPhone và Galaxy" },
    en: { label: "Pros and cons table", example: "Lay out the pros and cons of iPhone vs Galaxy in one table" },
  },
  {
    cmd: "stepbystep", category: "automation-workflow",
    ko: { label: "순서대로 단계별", example: "유튜브 채널 개설하는 법을 순서대로 단계별로 알려줘" },
    vi: { label: "Từng bước theo thứ tự", example: "Hướng dẫn mở kênh YouTube theo từng bước" },
    en: { label: "Step by step", example: "Walk me through starting a YouTube channel, step by step" },
  },
  {
    cmd: "checklist", category: "automation-workflow",
    ko: { label: "빠뜨림 없는 체크리스트", example: "해외여행 준비물을 빠뜨리기 쉬운 것까지 체크리스트로 정리해줘" },
    vi: { label: "Checklist không bỏ sót", example: "Lập checklist đồ cần mang khi đi nước ngoài, kể cả thứ dễ quên" },
    en: { label: "Checklist with nothing missed", example: "Make a packing checklist for an overseas trip, including easy-to-forget items" },
  },
  {
    cmd: "template", category: "docs-office",
    ko: { label: "바로 채워 쓰는 양식", example: "사업 제안 이메일 양식을 바로 채워 쓸 수 있게 만들어줘" },
    vi: { label: "Mẫu điền sẵn", example: "Tạo mẫu email đề xuất hợp tác để mình điền vào" },
    en: { label: "Fill-in-the-blank template", example: "Give me a business proposal email template I can fill in" },
  },
  {
    cmd: "examples", category: "education",
    ko: { label: "구체적 예시 3개", example: "마케팅에서 '후킹'이 뭔지 구체적인 예시 3개로 알려줘" },
    vi: { label: "Ba ví dụ cụ thể", example: "Cho mình 3 ví dụ cụ thể về 'hook' trong marketing" },
    en: { label: "Three concrete examples", example: "Give me three concrete examples of a 'hook' in marketing" },
  },
  {
    cmd: "analogy", category: "education",
    ko: { label: "일상 비유로", example: "금리 인상이 경제에 주는 영향을 일상적인 비유로 설명해줘" },
    vi: { label: "Ví von đời thường", example: "Giải thích tác động của việc tăng lãi suất bằng ví von đời thường" },
    en: { label: "Everyday analogy", example: "Explain how a rate hike affects the economy using an everyday analogy" },
  },
  {
    cmd: "critique", category: "dev-coding",
    ko: { label: "약점 솔직히 진단", example: "아래 내용의 약점을 솔직하게 진단해줘:" },
    vi: { label: "Chỉ ra điểm yếu thẳng thắn", example: "Chỉ ra thẳng những điểm yếu của nội dung dưới đây:" },
    en: { label: "Honest weak-point review", example: "Tell me honestly where the following is weak:" },
  },
  {
    cmd: "improve", category: "content-writing",
    ko: { label: "더 좋게 개선", example: "이 인스타 캡션을 더 끌리게 구체적으로 개선해줘:" },
    vi: { label: "Cải thiện cụ thể", example: "Làm caption Instagram này hấp dẫn hơn, sửa cụ thể giúp mình:" },
    en: { label: "Make it better, concretely", example: "Make this Instagram caption more compelling, with specific edits:" },
  },
  {
    cmd: "shorter", category: "content-writing",
    ko: { label: "의미 그대로 짧게", example: "아래 문단을 의미는 그대로 두고 분량만 확 줄여줘:" },
    vi: { label: "Ngắn lại, giữ nguyên ý", example: "Rút ngắn đoạn dưới đây nhưng giữ nguyên ý:" },
    en: { label: "Much shorter, same meaning", example: "Cut the length of this passage sharply without losing meaning:" },
  },
  {
    cmd: "expand", category: "content-writing",
    ko: { label: "메모를 풍성한 글로", example: "'운동의 중요성' 이 메모를 살 붙여 풍성한 글로 늘려줘" },
    vi: { label: "Mở rộng ghi chú thành bài", example: "Mở rộng ghi chú 'tầm quan trọng của việc tập luyện' thành bài viết đầy đủ" },
    en: { label: "Turn a note into a full piece", example: "Expand this note on 'why exercise matters' into a full piece" },
  },
  {
    cmd: "simplify", category: "docs-office",
    ko: { label: "전문용어를 쉬운 말로", example: "아래 계약서 조항을 전문용어 없이 쉽게 풀어줘:" },
    vi: { label: "Bỏ thuật ngữ, nói dễ hiểu", example: "Diễn giải điều khoản hợp đồng dưới đây bằng lời dễ hiểu:" },
    en: { label: "Plain words, no jargon", example: "Rewrite this contract clause in plain language:" },
  },
  {
    cmd: "tone", category: "marketing-seo",
    ko: { label: "말투 바꾸기", example: "이 환불 안내 문자를 친근한 말투로 바꿔줘:" },
    vi: { label: "Đổi giọng điệu", example: "Viết lại tin nhắn hoàn tiền này theo giọng thân thiện:" },
    en: { label: "Change the tone", example: "Rewrite this refund notice in a friendlier tone:" },
  },
  {
    cmd: "brainstorm", category: "marketing-seo",
    ko: { label: "아이디어 10개", example: "카페 인스타 콘텐츠 주제 아이디어를 10개 쏟아내줘" },
    vi: { label: "Mười ý tưởng", example: "Cho mình 10 ý tưởng nội dung Instagram cho quán cà phê" },
    en: { label: "Ten ideas fast", example: "Throw out ten content ideas for a cafe's Instagram" },
  },
  {
    cmd: "outline", category: "docs-office",
    ko: { label: "목차부터 짜기", example: "신입사원 교육 자료의 뼈대(목차)를 먼저 짜줘" },
    vi: { label: "Dựng mục lục trước", example: "Dựng khung mục lục cho tài liệu đào tạo nhân viên mới" },
    en: { label: "Outline first", example: "Draft the outline for onboarding training material first" },
  },
  {
    cmd: "counterexample", category: "data-analytics",
    ko: { label: "반례 찾기", example: "'비싼 게 항상 좋다'는 논리가 안 맞는 반례를 찾아줘" },
    vi: { label: "Tìm phản ví dụ", example: "Tìm phản ví dụ cho lập luận 'đắt thì luôn tốt'" },
    en: { label: "Find a counterexample", example: "Find counterexamples to the claim that pricier always means better" },
  },
  {
    cmd: "assumptions", category: "data-analytics",
    ko: { label: "숨은 전제 짚기", example: "'가격만 낮추면 잘 팔린다'에서 내가 놓친 숨은 전제를 짚어줘" },
    vi: { label: "Chỉ ra giả định ẩn", example: "Chỉ ra giả định ẩn trong câu 'giảm giá là sẽ bán được'" },
    en: { label: "Surface hidden assumptions", example: "Point out the hidden assumptions in 'just cut the price and it sells'" },
  },
  {
    cmd: "questions", category: "education",
    ko: { label: "더 고민할 질문", example: "창업 아이템을 검토 중인데, 내가 더 고민해야 할 질문을 던져줘" },
    vi: { label: "Câu hỏi cần nghĩ thêm", example: "Mình đang xem xét ý tưởng khởi nghiệp — hỏi mình những câu cần nghĩ thêm" },
    en: { label: "Questions I should be asking", example: "I'm evaluating a startup idea — ask me the questions I should be asking" },
  },
  {
    cmd: "compare", category: "data-analytics",
    ko: { label: "기준별 비교표", example: "노션·옵시디언·에버노트를 기준별 비교표로 만들어줘" },
    vi: { label: "Bảng so sánh theo tiêu chí", example: "Lập bảng so sánh Notion, Obsidian và Evernote theo từng tiêu chí" },
    en: { label: "Comparison table by criteria", example: "Compare Notion, Obsidian and Evernote in a table by criteria" },
  },
  {
    cmd: "risks", category: "security-review",
    ko: { label: "위험요소와 대비책", example: "첫 오프라인 행사 개최의 위험요소와 대비책을 짚어줘" },
    vi: { label: "Rủi ro và cách phòng", example: "Chỉ ra rủi ro và cách phòng khi tổ chức sự kiện offline đầu tiên" },
    en: { label: "Risks and mitigations", example: "Lay out the risks and mitigations for running my first offline event" },
  },
  {
    cmd: "persona", category: "marketing-seo",
    ko: { label: "전문가 입장에서", example: "10년차 마케터라면 이 문구를 어떻게 볼지 그 입장에서 답해줘:" },
    vi: { label: "Trả lời như chuyên gia", example: "Trả lời như một marketer 10 năm kinh nghiệm về câu chữ này:" },
    en: { label: "Answer as an expert", example: "Answer as a marketer with ten years' experience would about this copy:" },
  },
  {
    cmd: "5whys", category: "data-analytics",
    ko: { label: "왜를 5번 파기", example: "매출이 계속 떨어진다 — '왜?'를 5번 파고들어 근본 원인을 찾아줘" },
    vi: { label: "Hỏi 'tại sao' năm lần", example: "Doanh thu giảm liên tục — hỏi 'tại sao' 5 lần để tìm nguyên nhân gốc" },
    en: { label: "Five whys", example: "Revenue keeps falling — ask 'why' five times to find the root cause" },
  },
  {
    cmd: "rewrite-formal", category: "docs-office",
    ko: { label: "격식 있는 문체로", example: "이 메일을 격식 있고 정중한 문체로 바꿔줘:" },
    vi: { label: "Chuyển sang văn phong lịch sự", example: "Viết lại email này theo văn phong lịch sự, trang trọng:" },
    en: { label: "Formal register", example: "Rewrite this email in a formal, courteous register:" },
  },
  {
    cmd: "factcheck", category: "security-review",
    ko: { label: "사실 확인 필요 부분", example: "아래 글에서 사실 확인이 필요한 부분을 표시해줘:" },
    vi: { label: "Chỗ cần kiểm chứng", example: "Đánh dấu những chỗ cần kiểm chứng trong bài dưới đây:" },
    en: { label: "Flag what needs checking", example: "Mark the claims in this text that need fact-checking:" },
  },
  {
    cmd: "next-steps", category: "automation-workflow",
    ko: { label: "지금 할 행동 우선순위", example: "블로그를 시작하려는데, 지금 당장 할 행동을 우선순위로 정리해줘" },
    vi: { label: "Việc cần làm ngay, theo thứ tự", example: "Mình muốn bắt đầu viết blog — sắp xếp việc cần làm ngay theo thứ tự ưu tiên" },
    en: { label: "What to do right now, in order", example: "I want to start a blog — put the immediate actions in priority order" },
  },
  {
    cmd: "rephrase", category: "content-writing",
    ko: { label: "자연스럽게 다시 쓰기", example: "이 문장이 어색해. 자연스럽게 다시 써줘:" },
    vi: { label: "Viết lại cho tự nhiên", example: "Câu này nghe không tự nhiên, viết lại giúp mình:" },
    en: { label: "Rewrite it naturally", example: "This sentence reads awkwardly — rewrite it naturally:" },
  },
  {
    cmd: "summary-bullets", category: "docs-office",
    ko: { label: "핵심 불릿 정리", example: "아래 회의 내용을 핵심 불릿으로 정리해줘:" },
    vi: { label: "Gạch đầu dòng ý chính", example: "Tóm nội dung họp dưới đây thành các gạch đầu dòng:" },
    en: { label: "Key bullets", example: "Turn these meeting notes into key bullet points:" },
  },
  {
    cmd: "blueprint", category: "automation-workflow",
    ko: { label: "실행 가능한 계획으로", example: "온라인 강의를 런칭하고 싶어. 바로 실행 가능한 계획으로 짜줘" },
    vi: { label: "Kế hoạch làm được ngay", example: "Mình muốn ra mắt khóa học online — lập kế hoạch thực thi được ngay" },
    en: { label: "Turn it into a real plan", example: "I want to launch an online course — turn it into an executable plan" },
  },
  {
    cmd: "hooks", category: "marketing-seo",
    ko: { label: "읽게 만드는 첫 문장", example: "다이어트 콘텐츠의 첫 문장을 무조건 읽게 만들도록 5개 뽑아줘" },
    vi: { label: "Câu mở đầu gây tò mò", example: "Cho mình 5 câu mở đầu khiến người ta phải đọc tiếp về nội dung giảm cân" },
    en: { label: "Openers that get read", example: "Give me five opening lines that force people to keep reading about dieting" },
  },
  {
    cmd: "ghost", category: "content-writing",
    ko: { label: "사람이 쓴 듯 자연스럽게", example: "이 블로그 글을 AI 티 안 나게 사람이 쓴 듯 자연스럽게 다듬어줘:" },
    vi: { label: "Tự nhiên như người viết", example: "Chỉnh bài blog này cho tự nhiên như người viết, đừng để lộ giọng AI:" },
    en: { label: "Sound human, not AI", example: "Polish this blog post so it reads like a person wrote it, not an AI:" },
  },
  {
    cmd: "proofread", category: "docs-office",
    ko: { label: "맞춤법·오타만 교정", example: "아래 글의 맞춤법·오타·문법만 바로잡고 내용은 그대로 둬:" },
    vi: { label: "Chỉ sửa lỗi chính tả", example: "Chỉ sửa chính tả và ngữ pháp trong bài dưới đây, giữ nguyên nội dung:" },
    en: { label: "Fix typos only", example: "Fix only the spelling, typos and grammar below — leave the content as is:" },
  },
  {
    cmd: "tweet", category: "marketing-seo",
    ko: { label: "짧은 한 문장으로", example: "우리 신제품 출시 소식을 임팩트 있는 짧은 한 문장으로 써줘" },
    vi: { label: "Một câu thật đắt", example: "Viết tin ra mắt sản phẩm mới thành một câu thật đắt" },
    en: { label: "One punchy line", example: "Write our product launch as one punchy sentence" },
  },
  {
    cmd: "score", category: "content-writing",
    ko: { label: "10점 만점 채점", example: "아래 내용을 10점 만점으로 채점하고 이유를 설명해줘:" },
    vi: { label: "Cho điểm trên 10", example: "Cho điểm nội dung dưới đây trên thang 10 và giải thích lý do:" },
    en: { label: "Score it out of ten", example: "Score the following out of ten and explain the score:" },
  },
  {
    cmd: "audience", category: "content-writing",
    ko: { label: "독자 눈높이에 맞게", example: "이 설명을 70대 부모님도 이해하시게 다시 써줘:" },
    vi: { label: "Vừa tầm người đọc", example: "Viết lại phần này để bố mẹ ngoài 70 cũng hiểu:" },
    en: { label: "Match the reader", example: "Rewrite this so my 70-year-old parents would understand it:" },
  },
  {
    cmd: "story", category: "content-writing",
    ko: { label: "이야기·사례로 풀기", example: "복리의 힘을 이야기와 사례로 풀어서 설명해줘" },
    vi: { label: "Kể bằng câu chuyện", example: "Giải thích sức mạnh của lãi kép bằng câu chuyện và ví dụ thật" },
    en: { label: "Tell it as a story", example: "Explain compound interest through a story and real examples" },
  },
  {
    cmd: "flashcards", category: "education",
    ko: { label: "질문-답 카드", example: "한국사 조선 전기 핵심 내용을 질문-답 카드로 만들어줘" },
    vi: { label: "Thẻ hỏi - đáp", example: "Biến nội dung này thành thẻ hỏi - đáp để mình học:" },
    en: { label: "Question-and-answer cards", example: "Turn this material into question-and-answer flashcards:" },
  },
  {
    cmd: "negotiate", category: "marketing-seo",
    ko: { label: "협상·설득 멘트", example: "연봉 인상을 요청하려는데, 협상에 쓸 멘트를 짜줘" },
    vi: { label: "Câu nói để thương lượng", example: "Mình muốn xin tăng lương — soạn giúp mình cách nói khi thương lượng" },
    en: { label: "Lines for negotiating", example: "I want to ask for a raise — script what I should say" },
  },
];
