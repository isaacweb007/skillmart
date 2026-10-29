/** 배우기 트랙의 "읽고 따라 하는 글" — "클로드스킬 배우기" 폴더의 가이드.json을 정규화한 것.
 *  스킬도 프로그램도 아니고, 순서대로 따라 하면 되는 글이다. 항목을 추가하면 /learn에 바로 나온다.
 *  code 필드는 그대로 복사해 AI에 붙여넣는 프롬프트다 — [대괄호]만 자기 상황으로 바꾼다. */

export interface GuideStep {
  title: string;
  body: string;
  code?: string;
  note?: string;
}

export interface GuideLocale {
  name: string;
  oneLiner: string;
  desc: string;
  badges: [string, string][];
  steps: GuideStep[];
}

export interface Guide {
  slug: string;
  url: string;
  ko: GuideLocale;
  vi: GuideLocale;
  en: GuideLocale;
}

const DELEGATION_KO: GuideLocale = {
  name: "AI 위임 루프 — 에이전트 말고 매뉴얼을 만들어라",
  oneLiner: "일마다 에이전트를 만들지 말고, 일 하나에 SKILL.md 하나를 만든다",
  desc: "스킬을 왜·어떻게 쓰는지에 대한 글이다. 핵심 주장은 하나 — 일마다 전용 에이전트를 만들면 배선이 늘어 일이 조금만 바뀌어도 부서지고, 그걸 고치는 사람은 결국 나다. 대신 범용 AI 하나에 '글로 적힌 내 업무 지식'을 폴더로 쥐여주라는 것. 근거로 두 사례를 든다. 에이전트 인프라를 파는 Vercel이 자사 데이터팀에 전문가 에이전트 체인을 깔았다가 반응이 '형편없다'였고, 범용 AI 하나 + 자기 파일 폴더 + 평범한 도구로 바꾸자 내부 점수가 대략 두 배가 됐다. Anthropic 엔지니어들도 일마다 에이전트를 만드는 걸 멈췄다. 부족했던 건 지능이 아니라 적혀 있지 않은 업무 지식이었다는 이야기다.",
  badges: [["글쓴이", "낭만빌더 김스듴"], ["올린날", "2026-09-18"], ["분류", "에이전트 워크플로"], ["걸리는 시간", "첫 매뉴얼 30분"]],
  steps: [
    {
      title: "시작 전 — 내 도구가 파일을 쓸 수 있나",
      body: "여기서 많이 넘어진다. Claude Code처럼 파일을 읽고 쓰는 도구면 실제 폴더(~/playbooks/일이름)를 만들면 끝이고, 매뉴얼이 스스로 갱신되며 복리로 쌓인다. 브라우저 Claude·ChatGPT는 Project에 올린 파일을 AI가 다시 쓰지 못한다. 새 버전을 화면에 뱉어줄 뿐 저장·교체는 내 몫이다. 이때 예전 파일을 지우지 않고 두 번째로 추가하면, AI가 몇 주 전에 폐기한 지시를 따라가기 시작한다.",
      note: "Dropbox·Drive에서 올리면 링크가 아니라 복사본이 생긴다. 나중에 원본을 고쳐도 Project가 보는 건 안 바뀐다. 마스터는 딱 하나여야 한다.",
    },
    {
      title: "첫 일감 고르는 기준 세 가지",
      body: "① 주 1회 이상 한다 ② 나쁜 버전을 한눈에 알아본다 ③ 신입에게 설명하는 데 20분 안에 끝난다. 가장 복잡한 일이 아니라 가장 반복되는 일로 시작한다.",
    },
    {
      title: "레이어 1 · 프로세스 — 내 판단을 꺼내 적는다",
      body: "순서를 직접 타이핑하면 안 된다. AI에게 인터뷰를 시켜야 한다. 내가 절대 스스로 적지 않는 부분이야말로 결과물을 나답게 만드는 부분이기 때문이다. SKILL.md에 들어갈 일곱 가지 — 한 줄 목적, 언제 쓰는지(실제로 입에 담을 말로), 입력과 위치, 번호 붙은 순서, 결정마다의 규칙, 완료의 정의, 예전에 나를 태운 예외 사례.",
      code: "너는 내가 반복해서 하는 일을, 나 없이도 네가 돌릴 수 있는 매뉴얼으로 만들어 줄 거다.\n\n일은: [한 줄로 설명].\n\n먼저 나를 인터뷰해라. 한 번에 질문 하나만 하고 답을 기다려라. 최소 여덟 개의\n질문을 하고 내가 끝났다고 말하기 전까지 파일을 쓰지 마라. 이걸 전부 다뤄라:\n- 이 일을 시작하게 만드는 계기와 빈도\n- 입력들과 각각의 정확한 위치\n- 실제로 내가 하는 순서대로 한 단계들\n- 내가 내리는 모든 결정과 그 뒤의 규칙\n- 결과물이 만족해야 하는 톤이나 기준\n- 나쁜 버전이 어떻게 생겼는지\n\n너 없이 이 일을 돌릴 수 있겠다 싶으면, [job-name]이라는 폴더를 만들고 그 안에\nSKILL.md를 써라. 섹션은: 목적(한 줄), 언제 쓰는지, 입력, 순서(번호, 쉬운 말,\n전문용어 없이), 결정(X면 Y다), 완료의 정의, 예외 사례.\n\n그리고 파일 전체를 보여주고 두 가지를 물어라: 내가 뭘 잘못 뽑았는지, 내가\n알려주지 않은 게 뭔지.",
      note: "첫 버전은 80%쯤 맞다고 보면 된다. 짜증나는 질문이 보통 진짜 중요한 질문이다. 고치는 건 채팅이 아니라 파일에서.",
    },
    {
      title: "레이어 2 · 툴박스 — 매번 다시 짓지 않게",
      body: "이게 없으면 AI는 같은 스크립트·템플릿·포맷 규칙을 매번 처음부터 다시 짓는다. 넣을 것 — 기계적 단계를 하는 스크립트, 대괄호 자리표시자가 든 템플릿, 참조 데이터(고객 표기·가격·링크), 만족했던 완성본 예시, 규칙 파일(브랜드 보이스·금지 단어), 자주 쓰는 하위 프롬프트. 빼야 할 것 — 일회성 산출물, 비밀번호·키, 반쯤 된 초안. 첫날 신입에게 안 줄 것이면 폴더에도 안 넣는다.",
      code: "방금 만든 [스크립트 / 템플릿 / 이메일 / 체크리스트]를 봐라.\n\n내가 이걸 또 필요로 하게 되면, 다음을 전부 해라:\n1. [job-name]/files/에 설명적인 이름으로 저장해라. 예: numbers-pull.py,\n   update-template.md. 이름에 날짜나 버전 번호를 넣지 마라.\n2. 내 상황에 특화된 부분을 대괄호 자리표시자로 바꿔 재사용 가능하게 만들고\n   바로 아래에 채워진 예시 하나를 참조로 남겨라.\n3. SKILL.md를 업데이트해서 이게 필요한 단계가 파일을 이름으로 가리키게 하고,\n   언제 쓰고 언제 안 쓰는지도 적어라.\n4. [job-name]/files/INDEX.md에 한 줄 추가해라: 파일명, 용도, 오늘 날짜.\n\n일회성 산출물, 비밀번호나 API 키가 담긴 것, 내가 승인하지 않은 초안은\n저장하지 마라.\n\n그리고 전체 일을 처음부터 다시 돌리고, 어떤 저장된 파일을 썼고 무엇을\n백지에서 다시 지었는지 알려라. 다시 지은 것은 전부 툴박스 후보니, 다음에\n뭘 저장할지 말해라.",
      note: "툴박스는 두 번째 실행에서 진짜 채워진다. 뭐가 다시 지어졌는지 그때 보이기 때문이다. 폴더는 매달 검토해 용도 하나에 파일 하나만 남긴다 — 비슷한 파일이 둘이면 AI가 엉뚱한 걸 고른다.",
    },
    {
      title: "레이어 3 · 증명 — 90%짜리 결과를 끊는다",
      body: "거의 모두가 건너뛰는 레이어다. AI가 자기 초안을 읽고 '괜찮아 보인다'고 하는 건 아무 가치가 없다. 진짜 검증은 초록 바깥의 증거를 만든다 — 원본 파일까지 추적되는 숫자, 실제로 열리는 링크, 렌더 결과 스크린샷, 도는 테스트, 인용문과 대조한 주장, 단어 수, 참조 파일과 대조한 표기. 실패할 수 없는 검증은 검증이 아니다.",
      code: "[job-name]의 SKILL.md에 완료의 정의 섹션을 추가해라.\n\n이 일에 특화된 검증 항목 5~10개를 써라. 모든 항목은 네 자기 의견 바깥의\n증거로 확인 가능해야 한다: 원본 파일까지 추적되는 숫자, 로드되는 링크,\n렌더링 결과의 스크린샷, 도는 테스트, 인용문과 대조된 주장, 개수, 참조\n파일과 대조된 값. \"명확한\", \"전문적인\", \"고품질\" 같은 애매한 품질 단어는\n쓰지 마라.\n\n이제부터 이 일을 마칠 때마다, 내게 아무것도 보여주기 전에:\n1. 모든 검증 항목을 돌려라.\n2. 실패한 걸 고쳐라.\n3. 다시 돌려라.\n4. 항목마다 근거와 함께 한 줄짜리 통과/실패를 내놔라.\n5. 확인할 수 없는 것은 뭔지, 왜인지를 말해라. 통과한 걸로 가정하지 마라.\n\n첫 패스에서 두 개보다 많은 항목이 실패하면 멈추고, 결과물을 땜질하지 말고\n어느 프로세스 단계가 원인이었는지 말해라.",
      note: "좋은 검증 예 — '모든 수치가 뽑힌 데이터 파일에 존재할 것', '숫자 없는 형용사 금지', '200단어 이하', '고객 이름이 참조 파일 표기와 일치'. 나쁜 예 — '명확한', '전문적인', '고품질'.",
    },
    {
      title: "루프 — 채팅이 아니라 매뉴얼을 고친다",
      body: "AI가 틀렸을 때 채팅에서 고치고 넘어가면, 채팅이 닫히는 순간 교훈도 사라지고 다음 주에 같은 수정을 또 친다. 모든 수정을 폴더에 되돌려 넣는 습관이 루프다. 이 시스템이 쓸수록 좋아지고 에이전트가 쓸수록 나빠지는 이유가 이것이다. 고치기 전에 어느 레이어가 실패했는지부터 진단한다.",
      code: "그 결과물이 틀렸다. 이유는: [무엇이 어떻게 잘못됐는지 정확히].\n\n먼저 어느 레이어가 실패했는지 진단해라:\n- 프로세스: 단계가 빠졌거나 순서가 틀렸거나 결정 뒤의 규칙이 적히지 않았다\n- 툴박스: 이미 있는 걸 다시 지었거나, 저장된 파일이 낡았거나 틀렸다\n- 증명: 이걸 잡았을 검증이 존재하지 않는다\n\n어느 것이었고 왜인지 두 문장으로 말해라.\n\n그리고 그 레이어에 가장 작은 내구성 있는 수정을 해라. 매뉴얼 전체를 다시\n쓰지 마라. 같은 실수가 이제 두 번 일어났다면 부드러운 리마인더가 아니라\n그걸 막는 명시적 규칙을 추가해라.\n\n[job-name]/notes.md에 오늘 날짜, 무엇이 잘못됐는지, 무엇을 바꿨는지 한 줄을\n추가해라.\n\n그리고 같은 작업을 처음부터 다시 돌리고 수정 전과 후를 보여줘라. 고침이\n통했는지 내가 볼 수 있게.",
      note: "notes.md는 한 달에 한 번 읽는다. 같은 레이어에 기록이 반복되면 그 일이 진짜 어렵다는 뜻이고, 보통 그게 다음으로 제대로 자동화할 가치가 있는 일이다.",
    },
    {
      title: "다 만들어진 폴더 모양",
      body: "모든 일을 담은 큰 폴더 하나가 아니라, 일 하나당 폴더 하나다. 두 일이 자꾸 섞이면 문제는 각 SKILL.md 첫 줄이다.",
      code: "[job-name]/\n  SKILL.md              목적, 언제 쓰는지, 입력, 순서, 결정, 완료의 정의, 예외 사례\n  files/\n    INDEX.md            저장된 파일마다 한 줄: 이름, 용도, 날짜\n    numbers-pull.py     기계적 단계를 수행하는 스크립트\n    update-template.md  [자리표시자]가 든 템플릿\n    tone-rules.md       내 기준을, 내 말로\n  examples/\n    2026-09-08-good.md  만족했던 완성 작업\n  notes.md              수정 기록, 최신이 위로",
      note: "※ 네 프롬프트 모두 끝에 이 문장이 붙어 있다 — 파일을 못 쓰는 도구(브라우저 Claude·ChatGPT)를 위한 안전장치다: \"파일을 직접 쓸 수 없다면 쓴 척하지 마라. 전체 파일 내용을 채팅에 출력하고, 정확한 파일명과 폴더 안 위치를 알려주고, 업로드된 예전 복사본을 지우고 새걸로 교체하라고 나에게 상기시켜라.\"",
    },
    {
      title: "첫 30분",
      body: "가장 자주 하는 일을 고른다 → 프롬프트 1을 돌리고 인터뷰에 정직하게 답한다(15분) → 일을 한 번 돌리고 제대로 나온 걸 프롬프트 2로 저장 → 프롬프트 3으로 검증 항목 추가 → 두 번째로 돌린다.",
      note: "한 번으로 멈추면 안 된다. 두 번째 실행에서 설명이 얼마나 줄었는지가 보여야 체감이 온다.",
    },
  ],
};

const DELEGATION_VI: GuideLocale = {
  name: "Vòng lặp ủy quyền AI — đừng xây agent, hãy viết cẩm nang",
  oneLiner: "Đừng tạo agent cho từng việc; mỗi việc một file SKILL.md",
  desc: "Bài viết về vì sao và dùng skill thế nào. Luận điểm chỉ có một — xây agent riêng cho từng việc thì dây nhợ chằng chịt, việc đổi một chút là gãy, và người sửa rốt cuộc vẫn là bạn. Thay vào đó, đưa cho MỘT AI đa năng một thư mục chứa 'tri thức công việc của bạn viết thành chữ'. Hai dẫn chứng: Vercel — công ty bán hạ tầng agent — lắp chuỗi agent chuyên gia cho đội dữ liệu của chính mình và nhận phản hồi 'tệ hại'; đổi sang một AI đa năng + thư mục file + công cụ bình thường thì điểm nội bộ tăng khoảng gấp đôi. Kỹ sư Anthropic cũng ngừng tạo agent cho từng việc. Thứ còn thiếu không phải trí tuệ mà là tri thức công việc chưa được viết ra.",
  badges: [["Tác giả", "낭만빌더 김스듴"], ["Đăng ngày", "2026-09-18"], ["Phân loại", "Quy trình agent"], ["Thời gian", "Cẩm nang đầu tiên: 30 phút"]],
  steps: [
    {
      title: "Trước khi bắt đầu — công cụ của bạn có ghi được file không",
      body: "Nhiều người vấp ở đây. Nếu là công cụ đọc–ghi được file như Claude Code, chỉ cần tạo thư mục thật (~/playbooks/tên-việc) là xong — cẩm nang tự cập nhật và tích lũy như lãi kép. Claude trên trình duyệt và ChatGPT thì AI không ghi lại được file đã tải lên Project: nó chỉ in phiên bản mới ra màn hình, còn lưu và thay file là việc của bạn. Nếu bạn thêm bản mới mà không xóa bản cũ, AI sẽ bắt đầu làm theo chỉ dẫn đã bị loại bỏ từ mấy tuần trước.",
      note: "Tải từ Dropbox/Drive sẽ tạo bản sao chứ không phải liên kết. Sau này sửa bản gốc thì thứ Project nhìn thấy vẫn không đổi. Bản chính chỉ được có một.",
    },
    {
      title: "Ba tiêu chí chọn việc đầu tiên",
      body: "① Làm ít nhất mỗi tuần một lần ② Nhìn một phát là biết bản tệ ③ Giải thích cho người mới trong vòng 20 phút. Bắt đầu từ việc lặp lại nhiều nhất, không phải việc phức tạp nhất.",
    },
    {
      title: "Lớp 1 · Quy trình — moi phán đoán của bạn ra giấy",
      body: "Đừng tự gõ các bước. Hãy bắt AI phỏng vấn bạn — phần bạn không bao giờ tự viết ra mới chính là phần làm kết quả mang chất của bạn. Bảy thứ cần có trong SKILL.md: mục đích một dòng, khi nào dùng (bằng câu bạn thật sự nói), đầu vào và vị trí, các bước đánh số, quy tắc sau mỗi quyết định, định nghĩa hoàn thành, các ngoại lệ từng làm bạn khổ.",
      code: "Bạn sẽ biến việc tôi làm lặp đi lặp lại thành một cẩm nang mà bạn có thể tự chạy\nkhông cần tôi.\n\nViệc đó là: [mô tả một dòng].\n\nTrước hết hãy phỏng vấn tôi. Mỗi lần chỉ hỏi một câu và chờ tôi trả lời. Hỏi ít\nnhất tám câu và đừng ghi file trước khi tôi nói xong. Phải bao quát hết:\n- Điều gì khởi động việc này và tần suất\n- Các đầu vào và vị trí chính xác của từng cái\n- Các bước theo đúng thứ tự tôi thật sự làm\n- Mọi quyết định tôi đưa ra và quy tắc đằng sau\n- Giọng điệu hay tiêu chuẩn kết quả phải đạt\n- Bản tệ trông như thế nào\n\nKhi thấy có thể tự chạy việc này không cần tôi, hãy tạo thư mục tên [job-name]\nvà viết SKILL.md trong đó. Các mục: mục đích (một dòng), khi nào dùng, đầu vào,\ncác bước (đánh số, lời dễ hiểu, không thuật ngữ), quyết định (nếu X thì Y),\nđịnh nghĩa hoàn thành, ngoại lệ.\n\nRồi cho tôi xem toàn bộ file và hỏi hai điều: tôi đã rút sai chỗ nào, và điều\ngì tôi chưa kể cho bạn.",
      note: "Bản đầu đúng khoảng 80%. Câu hỏi làm bạn bực thường là câu quan trọng thật. Sửa thì sửa trong file, không phải trong chat.",
    },
    {
      title: "Lớp 2 · Hộp đồ nghề — để không xây lại từ đầu mỗi lần",
      body: "Thiếu lớp này, AI sẽ dựng lại cùng một script, template, quy tắc định dạng từ con số không mỗi lần. Những thứ nên bỏ vào: script làm bước máy móc, template có chỗ trống [ngoặc vuông], dữ liệu tham chiếu (cách ghi tên khách, giá, link), ví dụ thành phẩm từng ưng ý, file quy tắc (giọng thương hiệu, từ cấm), các prompt con hay dùng. Những thứ phải bỏ ra: sản phẩm dùng một lần, mật khẩu/khóa, bản nháp dang dở. Thứ gì không đưa cho nhân viên mới ngày đầu thì cũng đừng bỏ vào thư mục.",
      code: "Nhìn cái [script / template / email / checklist] vừa làm xong.\n\nNếu tôi sẽ còn cần nó, hãy làm đủ các bước sau:\n1. Lưu vào [job-name]/files/ với tên mô tả rõ. Ví dụ: numbers-pull.py,\n   update-template.md. Đừng cho ngày tháng hay số phiên bản vào tên.\n2. Thay phần gắn với tình huống của tôi bằng chỗ trống [ngoặc vuông] cho tái\n   sử dụng được, và để ngay bên dưới một ví dụ đã điền làm tham chiếu.\n3. Cập nhật SKILL.md để bước cần nó trỏ đến file theo tên, kèm khi nào dùng\n   và khi nào không.\n4. Thêm một dòng vào [job-name]/files/INDEX.md: tên file, công dụng, ngày hôm nay.\n\nĐừng lưu sản phẩm dùng một lần, thứ chứa mật khẩu hay API key, hay bản nháp\ntôi chưa duyệt.\n\nRồi chạy lại toàn bộ việc từ đầu, nói rõ đã dùng file lưu nào và đã dựng lại\ntừ trắng cái gì. Những gì phải dựng lại đều là ứng viên cho hộp đồ nghề — nói\nxem lần sau nên lưu gì.",
      note: "Hộp đồ nghề chỉ thật sự đầy ở lần chạy thứ hai, vì lúc đó mới lộ ra thứ gì bị dựng lại. Mỗi tháng rà thư mục một lần, mỗi công dụng giữ đúng một file — hai file na ná nhau là AI chọn nhầm.",
    },
    {
      title: "Lớp 3 · Bằng chứng — chặn kết quả 90%",
      body: "Lớp gần như ai cũng bỏ qua. AI tự đọc bản nháp của mình rồi bảo 'trông ổn' là vô giá trị. Kiểm chứng thật tạo ra bằng chứng nằm ngoài ý kiến của nó — con số truy được về file gốc, link mở được thật, ảnh chụp kết quả render, test chạy qua, luận điểm đối chiếu trích dẫn, số từ, cách ghi tên đối chiếu file tham chiếu. Kiểm chứng không thể trượt thì không phải kiểm chứng.",
      code: "Thêm mục Định nghĩa hoàn thành vào SKILL.md của [job-name].\n\nViết 5–10 hạng mục kiểm chứng riêng cho việc này. Mọi hạng mục phải xác nhận\nđược bằng bằng chứng nằm ngoài ý kiến của bạn: con số truy về file gốc, link\ntải được, ảnh chụp kết quả render, test chạy qua, luận điểm đối chiếu trích\ndẫn, số đếm, giá trị đối chiếu file tham chiếu. Cấm các từ chất lượng mơ hồ\nnhư \"rõ ràng\", \"chuyên nghiệp\", \"chất lượng cao\".\n\nTừ giờ mỗi lần xong việc này, trước khi cho tôi xem bất cứ gì:\n1. Chạy hết các hạng mục kiểm chứng.\n2. Sửa cái trượt.\n3. Chạy lại.\n4. Báo đạt/trượt một dòng cho từng hạng mục kèm căn cứ.\n5. Nói rõ cái gì không xác nhận được và vì sao. Đừng mặc định là đạt.\n\nNếu lượt đầu trượt quá hai hạng mục thì dừng lại, đừng vá kết quả — nói xem\nbước quy trình nào là nguyên nhân.",
      note: "Ví dụ kiểm chứng tốt — 'mọi con số phải tồn tại trong file dữ liệu đã rút', 'cấm tính từ không kèm số', 'dưới 200 từ', 'tên khách khớp cách ghi trong file tham chiếu'. Ví dụ tệ — 'rõ ràng', 'chuyên nghiệp', 'chất lượng cao'.",
    },
    {
      title: "Vòng lặp — sửa cẩm nang, không sửa trong chat",
      body: "AI sai mà bạn sửa trong chat rồi bỏ qua, thì chat đóng là bài học biến mất, tuần sau lại gõ đúng lần sửa đó. Thói quen đưa mọi lần sửa trở về thư mục chính là vòng lặp. Đây là lý do hệ thống này càng dùng càng tốt còn agent càng dùng càng tệ. Trước khi sửa, chẩn đoán lớp nào đã hỏng.",
      code: "Kết quả đó sai. Lý do: [chính xác cái gì sai và sai thế nào].\n\nTrước hết chẩn đoán lớp nào hỏng:\n- Quy trình: thiếu bước, sai thứ tự, hoặc quy tắc sau quyết định chưa được viết\n- Hộp đồ nghề: dựng lại thứ đã có, hoặc file lưu đã cũ/sai\n- Bằng chứng: không tồn tại hạng mục kiểm chứng lẽ ra bắt được lỗi này\n\nNói trong hai câu: lớp nào và vì sao.\n\nRồi thực hiện sửa đổi bền nhỏ nhất ở lớp đó. Đừng viết lại cả cẩm nang. Nếu\ncùng một lỗi đã xảy ra hai lần, thêm quy tắc tường minh chặn nó, không phải\nlời nhắc nhẹ nhàng.\n\nThêm một dòng vào [job-name]/notes.md: ngày hôm nay, cái gì sai, đã đổi gì.\n\nRồi chạy lại đúng việc đó từ đầu và cho xem trước–sau khi sửa, để tôi thấy\nsửa đổi có ăn thua không.",
      note: "notes.md đọc mỗi tháng một lần. Cùng một lớp mà ghi chú lặp lại nghĩa là việc đó thật sự khó — và thường đó chính là việc đáng tự động hóa tử tế tiếp theo.",
    },
    {
      title: "Hình hài thư mục khi hoàn chỉnh",
      body: "Không phải một thư mục to chứa mọi việc, mà mỗi việc một thư mục. Hai việc cứ lẫn vào nhau thì vấn đề nằm ở dòng đầu mỗi SKILL.md.",
      code: "[job-name]/\n  SKILL.md              mục đích, khi nào dùng, đầu vào, các bước, quyết định, định nghĩa hoàn thành, ngoại lệ\n  files/\n    INDEX.md            mỗi file lưu một dòng: tên, công dụng, ngày\n    numbers-pull.py     script làm bước máy móc\n    update-template.md  template có [chỗ trống]\n    tone-rules.md       tiêu chuẩn của tôi, bằng lời của tôi\n  examples/\n    2026-09-08-good.md  bản hoàn thành từng ưng ý\n  notes.md              nhật ký sửa đổi, mới nhất ở trên",
      note: "※ Cả bốn prompt đều có câu này ở cuối — chốt an toàn cho công cụ không ghi được file (Claude trình duyệt, ChatGPT): \"Nếu không ghi file trực tiếp được thì đừng giả vờ đã ghi. In toàn bộ nội dung file ra chat, nói chính xác tên file và vị trí trong thư mục, và nhắc tôi xóa bản cũ đã tải lên rồi thay bằng bản mới.\"",
    },
    {
      title: "30 phút đầu tiên",
      body: "Chọn việc làm thường xuyên nhất → chạy prompt 1 và trả lời phỏng vấn thành thật (15 phút) → chạy việc một lượt, cái ra đạt thì lưu bằng prompt 2 → thêm hạng mục kiểm chứng bằng prompt 3 → chạy lượt thứ hai.",
      note: "Đừng dừng ở một lượt. Phải thấy lượt chạy thứ hai cần giải thích ít đi bao nhiêu thì mới cảm được.",
    },
  ],
};

const DELEGATION_EN: GuideLocale = {
  name: "The AI delegation loop — build manuals, not agents",
  oneLiner: "Don't build an agent per job; write one SKILL.md per job",
  desc: "An essay on why and how to use skills. It makes one claim — build a dedicated agent for every job and the wiring multiplies, the smallest change breaks it, and the person who fixes it is you. Instead, hand ONE general AI a folder of your work knowledge written down. Two pieces of evidence: Vercel, a company that sells agent infrastructure, wired an expert-agent chain for its own data team and the feedback was 'terrible'; switching to one general AI + a folder of files + ordinary tools roughly doubled the internal score. Anthropic engineers also stopped building an agent per job. What was missing wasn't intelligence — it was unwritten work knowledge.",
  badges: [["Author", "낭만빌더 김스듴"], ["Published", "2026-09-18"], ["Category", "Agent workflow"], ["Time", "First manual: 30 min"]],
  steps: [
    {
      title: "Before you start — can your tool write files?",
      body: "This is where most people trip. With a tool that reads and writes files, like Claude Code, you just create a real folder (~/playbooks/job-name) and you're done — the manual updates itself and compounds. Browser Claude and ChatGPT can't write back to files uploaded to a Project: they print a new version to the screen, and saving and replacing is on you. If you add the new version without deleting the old one, the AI starts following instructions you retired weeks ago.",
      note: "Uploading from Dropbox or Drive creates a copy, not a link. Fix the original later and what the Project sees doesn't change. There must be exactly one master.",
    },
    {
      title: "Three criteria for picking the first job",
      body: "① You do it at least weekly ② You can spot a bad version at a glance ③ You could explain it to a new hire in under 20 minutes. Start with the most repeated job, not the most complex one.",
    },
    {
      title: "Layer 1 · Process — get your judgment onto paper",
      body: "Don't type the steps yourself. Make the AI interview you — the parts you'd never write down on your own are exactly what makes the output yours. Seven things that belong in SKILL.md: a one-line purpose, when to use it (in words you'd actually say), the inputs and where they live, numbered steps, the rule behind every decision, the definition of done, and the edge cases that have burned you before.",
      code: "You're going to turn a job I do repeatedly into a manual you can run without me.\n\nThe job is: [one-line description].\n\nInterview me first. Ask one question at a time and wait for my answer. Ask at\nleast eight questions and don't write the file until I say we're done. Cover\nall of this:\n- What triggers this job and how often\n- The inputs and the exact location of each\n- The steps in the order I actually do them\n- Every decision I make and the rule behind it\n- The tone or standard the output has to meet\n- What a bad version looks like\n\nWhen you think you could run this without me, create a folder called [job-name]\nand write SKILL.md inside. Sections: purpose (one line), when to use, inputs,\nsteps (numbered, plain words, no jargon), decisions (if X then Y), definition\nof done, edge cases.\n\nThen show me the whole file and ask two things: what did I get wrong, and what\nhaven't I told you.",
      note: "Expect the first version to be about 80% right. The annoying questions are usually the important ones. Fixes go in the file, not the chat.",
    },
    {
      title: "Layer 2 · Toolbox — stop rebuilding every time",
      body: "Without this, the AI rebuilds the same scripts, templates and formatting rules from scratch every run. What goes in: scripts that do the mechanical steps, templates with [bracketed] placeholders, reference data (client spellings, prices, links), examples of finished work you were happy with, rule files (brand voice, banned words), sub-prompts you reuse. What stays out: one-off artifacts, passwords and keys, half-finished drafts. If you wouldn't hand it to a new hire on day one, it doesn't go in the folder.",
      code: "Look at the [script / template / email / checklist] we just made.\n\nIf I'll need it again, do all of the following:\n1. Save it in [job-name]/files/ under a descriptive name. E.g. numbers-pull.py,\n   update-template.md. No dates or version numbers in names.\n2. Replace the parts specific to my situation with [bracketed] placeholders so\n   it's reusable, and leave one filled-in example right below as reference.\n3. Update SKILL.md so the step that needs it points to the file by name, with\n   when to use it and when not to.\n4. Add one line to [job-name]/files/INDEX.md: filename, purpose, today's date.\n\nDon't save one-off artifacts, anything containing passwords or API keys, or\ndrafts I haven't approved.\n\nThen run the whole job again from the top and tell me which saved files you\nused and what you rebuilt from scratch. Everything rebuilt is a toolbox\ncandidate — tell me what to save next.",
      note: "The toolbox really fills up on the second run — that's when you see what got rebuilt. Review the folder monthly and keep one file per purpose; with two near-duplicates, the AI picks the wrong one.",
    },
    {
      title: "Layer 3 · Proof — cutting off the 90% result",
      body: "The layer almost everyone skips. The AI reading its own draft and saying 'looks fine' is worth nothing. Real verification produces evidence outside its own opinion — numbers traceable to the source file, links that actually open, screenshots of rendered output, tests that run, claims checked against quotes, word counts, spellings checked against a reference file. A check that cannot fail is not a check.",
      code: "Add a Definition of Done section to [job-name]'s SKILL.md.\n\nWrite 5–10 verification items specific to this job. Every item must be\nconfirmable with evidence outside your own opinion: numbers traceable to the\nsource file, links that load, screenshots of rendered output, tests that run,\nclaims checked against quotes, counts, values checked against the reference\nfile. No vague quality words like \"clear\", \"professional\", \"high-quality\".\n\nFrom now on, every time you finish this job, before showing me anything:\n1. Run every verification item.\n2. Fix what failed.\n3. Run them again.\n4. Give me a one-line pass/fail per item with the evidence.\n5. Say what you couldn't verify and why. Don't assume it passed.\n\nIf more than two items fail on the first pass, stop — don't patch the output.\nTell me which process step caused it.",
      note: "Good checks — 'every figure exists in the pulled data file', 'no adjectives without a number', 'under 200 words', 'client names match the reference spelling'. Bad — 'clear', 'professional', 'high-quality'.",
    },
    {
      title: "The loop — fix the manual, not the chat",
      body: "When the AI is wrong and you fix it in chat and move on, the lesson dies the moment the chat closes, and next week you type the same correction again. The habit of feeding every fix back into the folder is the loop. It's why this system gets better with use while agents get worse. Before fixing, diagnose which layer failed.",
      code: "That output is wrong. Here's why: [exactly what's wrong and how].\n\nFirst diagnose which layer failed:\n- Process: a step is missing, out of order, or the rule behind a decision\n  isn't written down\n- Toolbox: something that already exists got rebuilt, or a saved file is\n  stale or wrong\n- Proof: the check that would have caught this doesn't exist\n\nTell me which it was and why, in two sentences.\n\nThen make the smallest durable fix at that layer. Don't rewrite the whole\nmanual. If the same mistake has now happened twice, add an explicit rule that\nblocks it, not a gentle reminder.\n\nAdd one line to [job-name]/notes.md: today's date, what went wrong, what\nchanged.\n\nThen run the same task again from the top and show me before and after, so I\ncan see whether the fix worked.",
      note: "Read notes.md once a month. Repeated entries at the same layer mean the job is genuinely hard — and that's usually the next thing worth automating properly.",
    },
    {
      title: "What the finished folder looks like",
      body: "Not one big folder for everything — one folder per job. If two jobs keep bleeding into each other, the problem is the first line of each SKILL.md.",
      code: "[job-name]/\n  SKILL.md              purpose, when to use, inputs, steps, decisions, definition of done, edge cases\n  files/\n    INDEX.md            one line per saved file: name, purpose, date\n    numbers-pull.py     script for the mechanical steps\n    update-template.md  template with [placeholders]\n    tone-rules.md       my standards, in my words\n  examples/\n    2026-09-08-good.md  finished work I was happy with\n  notes.md              fix log, newest on top",
      note: "※ All four prompts end with this line — a safety latch for tools that can't write files (browser Claude, ChatGPT): \"If you can't write files directly, don't pretend you did. Print the full file contents in chat, tell me the exact filename and its place in the folder, and remind me to delete the old uploaded copy and replace it with the new one.\"",
    },
    {
      title: "The first 30 minutes",
      body: "Pick your most frequent job → run prompt 1 and answer the interview honestly (15 min) → run the job once, and when a result comes out right, save it with prompt 2 → add verification items with prompt 3 → run it a second time.",
      note: "Don't stop at one run. The payoff only lands when you see how much less explaining the second run needs.",
    },
  ],
};

export const GUIDES: Guide[] = [
  {
    slug: "ai-delegation-loop",
    url: "https://sdk-kim-builds.com/guides/ai-delegation-loop-playbook/",
    ko: DELEGATION_KO,
    vi: DELEGATION_VI,
    en: DELEGATION_EN,
  },
];
