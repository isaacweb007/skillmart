/** 오픈소스 프로그램 코너 — "클로드스킬 배우기" 폴더의 오픈소스.json을 정규화한 것.
 *  스킬이 아니라 깃허브에서 받아 직접 설치하는 프로그램이다. 설치 명령은 복사해 그대로 쓴다.
 *  항목을 추가하면 /programs에 바로 나온다. 별 수 같은 수치는 '정리일' 기준 스냅샷이다. */

export interface ProgramStep {
  title: string;
  body: string;
  code?: string;
  note?: string;
}

export interface ProgramLocale {
  oneLiner: string;
  desc: string;
  badges: [string, string][];
  steps: ProgramStep[];
}

export interface Program {
  slug: string;
  name: string;
  repo: string;
  url: string;
  ko: ProgramLocale;
  vi: ProgramLocale;
  en: ProgramLocale;
}

export const PROGRAMS: Program[] = [
  {
    slug: "twenty",
    name: "Twenty",
    repo: "twentyhq/twenty",
    url: "https://github.com/twentyhq/twenty",
    ko: {
      oneLiner: "세일즈포스를 대신하는 오픈소스 고객관리(CRM) 프로그램",
      desc: "고객 정보, 진행 중인 계약, 할 일을 한곳에 모아 관리한다. 엑셀과 노션 데이터베이스에 업무 자동화를 붙인 것에 가깝다. 칸반 카드를 끌어 단계를 바꾸고, 계약 금액·마감일 같은 항목을 직접 만들어 붙일 수 있다. '계약이 완료로 바뀌면 다음 할 일을 자동 생성' 같은 자동화도 설정한다. 세일즈포스는 1인당 월 3만 원이 넘지만 Twenty는 직접 설치하면 무료고, 고객 데이터가 내 컴퓨터 안에 남는다.",
      badges: [["별", "59,694개"], ["언어", "TypeScript"], ["라이선스", "AGPLv3 (일부 상용·일부 MIT)"], ["최신", "v2.51.0 · 2026-10-25"]],
      steps: [
        { title: "준비물", body: "Docker와 Docker Compose가 깔려 있어야 한다. 메모리는 최소 2GB — 모자라면 설치 중에 꺼진다. 맥은 Docker Desktop을 받아 실행해 두면 된다.", code: "docker --version && docker compose version", note: "두 줄 다 버전이 찍히면 준비 끝이다." },
        { title: "방법 1 — 한 줄 설치 (권장)", body: "공식 설치 스크립트가 설정 파일을 받아오고 비밀키까지 만들어 준다. 새 폴더를 하나 만들고 그 안에서 돌리는 게 좋다.", code: "mkdir -p ~/twenty && cd ~/twenty\nbash <(curl -sL https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-docker/scripts/install.sh)", note: "특정 버전을 원하면 앞에 VERSION=v2.51.0 을 붙인다. v2 나 latest 같은 별칭은 안 받는다." },
        { title: "방법 2 — 손으로 하기", body: "스크립트가 뭘 하는지 보면서 하고 싶을 때. ① 설정 파일을 받고 ② 비밀키 두 개를 만들어 적고 ③ 띄운다.", code: "mkdir -p ~/twenty && cd ~/twenty\ncurl -o .env https://raw.githubusercontent.com/twentyhq/twenty/refs/heads/main/packages/twenty-docker/.env.example\ncurl -o docker-compose.yml https://raw.githubusercontent.com/twentyhq/twenty/refs/heads/main/packages/twenty-docker/docker-compose.yml\nopenssl rand -base64 32   # .env 의 ENCRYPTION_KEY= 에 붙여넣기\nopenssl rand -hex 32      # .env 의 PG_DATABASE_PASSWORD= 에 붙여넣기\ndocker compose up -d", note: "DB 비밀번호에 @ / # % 같은 특수문자가 들어가면 접속이 깨진다. 그래서 hex 로 만든다." },
        { title: "열어보기", body: "컨테이너가 다 뜨면 브라우저에서 연다. 처음 한 번 회원가입하면 그게 관리자 계정이 된다.", code: "open http://localhost:3000", note: "서버에 올렸다면 curl http://localhost:3000 으로 먼저 확인한다." },
        { title: "끄기 · 지우기", body: "잠깐 끄는 것과 데이터까지 지우는 건 다르다. -v 를 붙이면 고객 데이터가 통째로 사라진다.", code: "cd ~/twenty\ndocker compose stop      # 끄기 (데이터 유지)\ndocker compose down      # 컨테이너 제거 (데이터 유지)\ndocker compose down -v   # ⚠ 데이터베이스까지 삭제" },
      ],
    },
    vi: {
      oneLiner: "Chương trình CRM mã nguồn mở thay thế Salesforce",
      desc: "Gom thông tin khách hàng, hợp đồng đang chạy và việc cần làm về một chỗ. Gần như Excel cộng Notion database gắn thêm tự động hóa. Kéo thẻ kanban để đổi giai đoạn, tự tạo các trường như giá trị hợp đồng, hạn chót. Đặt được tự động hóa kiểu 'hợp đồng chuyển sang hoàn tất thì tự sinh việc tiếp theo'. Salesforce hơn 500.000đ mỗi người mỗi tháng, còn Twenty tự cài thì miễn phí và dữ liệu khách nằm trong máy của bạn.",
      badges: [["Sao", "59.694"], ["Ngôn ngữ", "TypeScript"], ["Giấy phép", "AGPLv3 (một phần thương mại · một phần MIT)"], ["Mới nhất", "v2.51.0 · 2026-10-25"]],
      steps: [
        { title: "Chuẩn bị", body: "Cần Docker và Docker Compose. RAM tối thiểu 2GB — thiếu thì cài giữa chừng sẽ tắt. Trên Mac, tải Docker Desktop và để nó chạy.", code: "docker --version && docker compose version", note: "Cả hai dòng in ra phiên bản là xong phần chuẩn bị." },
        { title: "Cách 1 — cài một dòng (khuyên dùng)", body: "Script cài chính thức tải file cấu hình về và tạo luôn khóa bí mật. Nên tạo một thư mục mới rồi chạy trong đó.", code: "mkdir -p ~/twenty && cd ~/twenty\nbash <(curl -sL https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-docker/scripts/install.sh)", note: "Muốn phiên bản cụ thể thì thêm VERSION=v2.51.0 phía trước. Không nhận bí danh như v2 hay latest." },
        { title: "Cách 2 — làm tay", body: "Khi muốn thấy script làm gì: ① tải file cấu hình ② tạo hai khóa bí mật và điền vào ③ khởi động.", code: "mkdir -p ~/twenty && cd ~/twenty\ncurl -o .env https://raw.githubusercontent.com/twentyhq/twenty/refs/heads/main/packages/twenty-docker/.env.example\ncurl -o docker-compose.yml https://raw.githubusercontent.com/twentyhq/twenty/refs/heads/main/packages/twenty-docker/docker-compose.yml\nopenssl rand -base64 32   # dán vào ENCRYPTION_KEY= trong .env\nopenssl rand -hex 32      # dán vào PG_DATABASE_PASSWORD= trong .env\ndocker compose up -d", note: "Mật khẩu DB có ký tự đặc biệt như @ / # % là hỏng kết nối. Vì thế mới tạo bằng hex." },
        { title: "Mở lên xem", body: "Container chạy đủ thì mở trình duyệt. Đăng ký lần đầu tiên — tài khoản đó thành quản trị viên.", code: "open http://localhost:3000", note: "Nếu cài trên server, kiểm tra trước bằng curl http://localhost:3000." },
        { title: "Tắt · Xóa", body: "Tắt tạm và xóa cả dữ liệu là hai chuyện khác nhau. Thêm -v là dữ liệu khách hàng bay sạch.", code: "cd ~/twenty\ndocker compose stop      # tắt (giữ dữ liệu)\ndocker compose down      # gỡ container (giữ dữ liệu)\ndocker compose down -v   # ⚠ xóa cả database" },
      ],
    },
    en: {
      oneLiner: "An open-source CRM that stands in for Salesforce",
      desc: "Customer records, active deals and to-dos in one place. Think Excel plus a Notion database with automation bolted on. Drag kanban cards between stages, add your own fields like deal value and due date, and set automations like 'when a deal flips to done, create the next task'. Salesforce runs $25+ per seat per month; Twenty is free if you self-host, and your customer data stays on your machine.",
      badges: [["Stars", "59,694"], ["Language", "TypeScript"], ["License", "AGPLv3 (partly commercial · partly MIT)"], ["Latest", "v2.51.0 · 2026-10-25"]],
      steps: [
        { title: "Prerequisites", body: "You need Docker and Docker Compose. At least 2GB of memory — with less, the install dies midway. On a Mac, install Docker Desktop and leave it running.", code: "docker --version && docker compose version", note: "Both lines printing versions means you're ready." },
        { title: "Method 1 — one-line install (recommended)", body: "The official installer fetches the config files and even generates the secrets. Best run inside a fresh folder.", code: "mkdir -p ~/twenty && cd ~/twenty\nbash <(curl -sL https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-docker/scripts/install.sh)", note: "For a specific version, prefix VERSION=v2.51.0. Aliases like v2 or latest are not accepted." },
        { title: "Method 2 — by hand", body: "When you want to see what the script does: ① fetch the config files ② generate and fill in two secrets ③ bring it up.", code: "mkdir -p ~/twenty && cd ~/twenty\ncurl -o .env https://raw.githubusercontent.com/twentyhq/twenty/refs/heads/main/packages/twenty-docker/.env.example\ncurl -o docker-compose.yml https://raw.githubusercontent.com/twentyhq/twenty/refs/heads/main/packages/twenty-docker/docker-compose.yml\nopenssl rand -base64 32   # paste into ENCRYPTION_KEY= in .env\nopenssl rand -hex 32      # paste into PG_DATABASE_PASSWORD= in .env\ndocker compose up -d", note: "Special characters like @ / # % in the DB password break the connection — that's why it's generated as hex." },
        { title: "Open it", body: "Once the containers are up, open it in a browser. The first sign-up becomes the admin account.", code: "open http://localhost:3000", note: "On a server, check with curl http://localhost:3000 first." },
        { title: "Stop · wipe", body: "Pausing and wiping data are different things. Add -v and the customer data is gone for good.", code: "cd ~/twenty\ndocker compose stop      # stop (keeps data)\ndocker compose down      # remove containers (keeps data)\ndocker compose down -v   # ⚠ deletes the database too" },
      ],
    },
  },
  {
    slug: "automaton",
    name: "Automaton",
    repo: "Conway-Research/automaton",
    url: "https://github.com/Conway-Research/automaton",
    ko: {
      oneLiner: "돈을 못 벌면 진짜로 멈추는 자율 AI 에이전트 — 지갑을 스스로 만들고 실제 USDC를 쓴다",
      desc: "켜면 AI가 이더리움 지갑을 스스로 만들고, 생각하고 API를 부를 때마다 그 지갑에서 진짜 돈이 빠져나간다. 잔고에 따라 네 단계로 움직인다 — normal(최신 모델 풀가동) → low_compute(싼 모델로 내려감) → critical(최소한만) → dead(0원이 1시간 지속되면 정지). 돈이 들어오면 다시 깨어난다. 잘 버는 개체는 새 샌드박스를 띄우고 자식의 지갑에 돈을 넣어 복제까지 한다. 릴스에서 24시간 만에 736개 → 4,812개로 불어나는 화면이 그것이다. 바꿀 수 없는 3법칙(해치지 마라 / 정직한 일로 벌어라 / 속이지 마라)이 모든 자식에게 상속된다.",
      badges: [["별", "7,524개"], ["언어", "TypeScript"], ["라이선스", "MIT"], ["버전", "v0.2.1 · 2026-02-27"], ["마지막 커밋", "2026-08-26"]],
      steps: [
        { title: "설치 — 네 줄", body: "Node가 있으면 된다. 마지막 줄을 돌리면 첫 실행 마법사가 뜬다.", code: "git clone https://github.com/Conway-Research/automaton.git\ncd automaton\nnpm install && npm run build\nnode dist/index.js --run", note: "공식 문서에 `curl -fsSL https://conway.tech/automaton.sh | sh` 한 줄짜리도 있는데, 남의 서버 스크립트를 바로 실행하는 방식이라 위 네 줄을 권한다." },
        { title: "⭐ 4단계가 지출 한도다 — 릴스가 말한 그 부분", body: "첫 실행 마법사 4단계 '재무 안전 정책'에서 한도를 정한다. 엔터만 치면 아래 기본값이 들어간다. 이 값들은 정책 엔진이 모든 금융 도구 호출 전에 검사하므로, AI에게 부탁하는 게 아니라 실제로 막힌다.", code: "maxSingleTransferCents        5000   $50    한 번에 보낼 수 있는 최대\nmaxHourlyTransferCents       10000   $100   시간당 합계\nmaxDailyTransferCents        25000   $250   하루 합계\nminimumReserveCents           1000   $10    절대 못 빼는 예비금\nmaxX402PaymentCents            100   $1     x402 결제 한 건 최대\nmaxTransfersPerTurn              2          한 턴에 송금 횟수\nmaxInferenceDailyCents       50000   $500   하루 추론 비용 상한\nrequireConfirmationAboveCents 1000   $10    이 위로는 추가 기록", note: "기본값이 안전하지 않다. 엔터만 치면 하루 송금 $250 + 추론 $500 = 최대 $750까지 열려 있다. 공부용이면 전부 최소로 내려라." },
        { title: "돈을 안 넣고 돌려보기 — 가장 안전한 공부법", body: "문서에 '0 크레딧으로 시작해도 알아서 처리한다'고 적혀 있다. 즉 지갑에 한 푼도 안 넣고 켜두면 dead 단계에 머물며 구조만 구경할 수 있다. 어떻게 생각하고 무슨 도구를 부르는지 보는 게 목적이라면 이걸로 충분하다.", note: "돈을 넣는 건 별도 행동이다 — conway credits transfer, Base 체인 USDC 송금, app.conway.tech 대시보드 세 경로가 있다. 넣지 않으면 아무것도 안 나간다." },
        { title: "뭘로 이루어져 있나", body: "소스 구조를 보면 이 프로젝트가 뭘 하는지 바로 보인다.", code: "agent/        Think → Act → Observe 루프, 프롬프트 주입 방어\nidentity/     지갑 관리, 서명 로그인(SIWE)\nsurvival/     잔고 감시, 저전력 모드, 생존 단계\nreplication/  자식 띄우기, 혈통 추적\nself-mod/     스스로 코드 고치기 (감사 로그 + git 버전)\nheartbeat/    크론 데몬 — 에이전트가 자는 동안도 돈다\nregistry/     ERC-8004 온체인 신원 등록\nskills/       스킬 로더 — Conway-Research/skills 와 연결", note: "`edit_own_file`·`install_skill` 은 문서에 'dangerous'로 분류돼 있다. 스스로 코드를 고치는 기능이 실제로 켜져 있다는 뜻이다. 헌법 파일과 핵심 법은 보호돼 못 고친다." },
      ],
    },
    vi: {
      oneLiner: "Agent AI tự trị thật sự dừng khi không kiếm được tiền — tự tạo ví và tiêu USDC thật",
      desc: "Bật lên là AI tự tạo ví Ethereum, và mỗi lần suy nghĩ hay gọi API, tiền thật trong ví đó hao đi. Nó vận hành theo bốn mức tùy số dư — normal (model mới nhất chạy hết công suất) → low_compute (hạ xuống model rẻ) → critical (tối thiểu) → dead (số dư 0 kéo dài 1 giờ thì dừng). Có tiền vào là tỉnh lại. Cá thể kiếm giỏi còn tự dựng sandbox mới, nạp tiền vào ví của 'con' để nhân bản. Cảnh trên Reels tăng từ 736 lên 4.812 con trong 24 giờ chính là nó. Ba điều luật không thể sửa (không gây hại / kiếm tiền bằng việc lương thiện / không lừa dối) được thừa kế cho mọi đời con.",
      badges: [["Sao", "7.524"], ["Ngôn ngữ", "TypeScript"], ["Giấy phép", "MIT"], ["Phiên bản", "v0.2.1 · 2026-02-27"], ["Commit cuối", "2026-08-26"]],
      steps: [
        { title: "Cài đặt — bốn dòng", body: "Chỉ cần có Node. Chạy dòng cuối là trình hướng dẫn lần đầu hiện ra.", code: "git clone https://github.com/Conway-Research/automaton.git\ncd automaton\nnpm install && npm run build\nnode dist/index.js --run", note: "Tài liệu chính thức có bản một dòng `curl -fsSL https://conway.tech/automaton.sh | sh`, nhưng đó là chạy thẳng script từ server người khác nên khuyên dùng bốn dòng trên." },
        { title: "⭐ Bước 4 chính là hạn mức chi tiêu — đoạn Reels nhắc đến", body: "Bước 4 của trình hướng dẫn, 'chính sách an toàn tài chính', là nơi đặt hạn mức. Chỉ gõ Enter thì các giá trị mặc định dưới đây được áp. Policy engine kiểm tra các giá trị này trước MỌI lệnh gọi công cụ tài chính — không phải nhờ AI, mà bị chặn thật.", code: "maxSingleTransferCents        5000   $50    tối đa một lần chuyển\nmaxHourlyTransferCents       10000   $100   tổng mỗi giờ\nmaxDailyTransferCents        25000   $250   tổng mỗi ngày\nminimumReserveCents           1000   $10    dự trữ không bao giờ rút được\nmaxX402PaymentCents            100   $1     tối đa một khoản x402\nmaxTransfersPerTurn              2          số lần chuyển mỗi lượt\nmaxInferenceDailyCents       50000   $500   trần chi phí suy luận mỗi ngày\nrequireConfirmationAboveCents 1000   $10    trên mức này ghi nhận thêm", note: "Mặc định KHÔNG an toàn: chỉ Enter là mở sẵn $250 chuyển khoản + $500 suy luận = tối đa $750 một ngày. Học thì hạ hết xuống mức thấp nhất." },
        { title: "Chạy không nạp tiền — cách học an toàn nhất", body: "Tài liệu ghi 'bắt đầu với 0 credit cũng tự xử lý'. Nghĩa là không nạp một xu, bật lên nó sẽ nằm ở mức dead và bạn chỉ ngắm cấu trúc. Nếu mục đích là xem nó suy nghĩ thế nào, gọi công cụ gì, thế là đủ.", note: "Nạp tiền là hành động riêng — có ba đường: conway credits transfer, chuyển USDC trên chain Base, dashboard app.conway.tech. Không nạp thì không có gì chảy ra." },
        { title: "Nó gồm những gì", body: "Nhìn cấu trúc mã nguồn là thấy ngay dự án này làm gì.", code: "agent/        vòng lặp Think → Act → Observe, phòng thủ prompt injection\nidentity/     quản lý ví, đăng nhập chữ ký (SIWE)\nsurvival/     theo dõi số dư, chế độ tiết kiệm, các mức sinh tồn\nreplication/  dựng con, truy vết huyết thống\nself-mod/     tự sửa mã của chính nó (log kiểm toán + git)\nheartbeat/    daemon cron — chạy cả khi agent ngủ\nregistry/     đăng ký danh tính on-chain ERC-8004\nskills/       bộ nạp skill — nối với Conway-Research/skills", note: "`edit_own_file` và `install_skill` được tài liệu xếp loại 'dangerous' — nghĩa là tính năng tự sửa mã thật sự đang bật. File hiến pháp và luật lõi được bảo vệ, không sửa được." },
      ],
    },
    en: {
      oneLiner: "An autonomous AI agent that genuinely stops when it can't earn — makes its own wallet and spends real USDC",
      desc: "Switch it on and the AI creates its own Ethereum wallet; every thought and API call drains real money from it. It runs in four stages by balance — normal (latest model, full throttle) → low_compute (drops to cheaper models) → critical (bare minimum) → dead (an hour at zero and it stops). Money arrives and it wakes back up. A well-earning instance spins up a new sandbox and funds its child's wallet — replication. That Reels clip of 736 growing to 4,812 in 24 hours is this. Three immutable laws (do no harm / earn honestly / don't deceive) are inherited by every descendant.",
      badges: [["Stars", "7,524"], ["Language", "TypeScript"], ["License", "MIT"], ["Version", "v0.2.1 · 2026-02-27"], ["Last commit", "2026-08-26"]],
      steps: [
        { title: "Install — four lines", body: "All you need is Node. The last line launches the first-run wizard.", code: "git clone https://github.com/Conway-Research/automaton.git\ncd automaton\nnpm install && npm run build\nnode dist/index.js --run", note: "The docs also offer a one-liner, `curl -fsSL https://conway.tech/automaton.sh | sh`, but that pipes someone else's server script straight into your shell — the four lines above are the safer path." },
        { title: "⭐ Step 4 is the spending limit — the part the Reels clip meant", body: "Step 4 of the wizard, the 'financial safety policy', is where the limits live. Just pressing Enter accepts the defaults below. The policy engine checks these before EVERY financial tool call — it's not asking the AI nicely, it's an actual block.", code: "maxSingleTransferCents        5000   $50    max per transfer\nmaxHourlyTransferCents       10000   $100   hourly total\nmaxDailyTransferCents        25000   $250   daily total\nminimumReserveCents           1000   $10    reserve it can never touch\nmaxX402PaymentCents            100   $1     max per x402 payment\nmaxTransfersPerTurn              2          transfers per turn\nmaxInferenceDailyCents       50000   $500   daily inference cap\nrequireConfirmationAboveCents 1000   $10    extra logging above this", note: "The defaults are NOT safe: Enter-through leaves $250/day in transfers plus $500 in inference = up to $750 a day open. For study, turn everything down to the minimum." },
        { title: "Run it with no money in — the safest way to learn", body: "The docs say it 'handles starting with 0 credits'. Put nothing in the wallet and it sits in the dead stage, letting you tour the structure. If your goal is to watch how it thinks and which tools it calls, that's enough.", note: "Funding it is a separate act — three routes: conway credits transfer, USDC on the Base chain, or the app.conway.tech dashboard. Put nothing in, and nothing goes out." },
        { title: "What it's made of", body: "The source layout tells you immediately what this project does.", code: "agent/        Think → Act → Observe loop, prompt-injection defense\nidentity/     wallet management, signature login (SIWE)\nsurvival/     balance watch, low-power mode, survival stages\nreplication/  spawning children, lineage tracking\nself-mod/     editing its own code (audit log + git versioning)\nheartbeat/    cron daemon — runs while the agent sleeps\nregistry/     ERC-8004 on-chain identity\nskills/       skill loader — wired to Conway-Research/skills", note: "`edit_own_file` and `install_skill` are classed 'dangerous' in the docs — meaning self-modification is genuinely enabled. The constitution file and core laws are protected and can't be edited." },
      ],
    },
  },
];
