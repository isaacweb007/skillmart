/** AI 이미지 생성 명령어 50개 — 챗GPT·Claude·Gemini 어디서나 붙여넣어 쓰는 요청문.
 *
 *  lib/prompts.ts(글 명령어 40개)와 같은 방식의 콘텐츠 데이터다 — UI 문자열이 아니라
 *  항목이 50×3 언어라 messages JSON이 아니라 여기 둔다.
 *  cmd는 정식 명령어가 아니라 외우기 쉬운 이름표다(페이지 상단 안내에 명시).
 *  스킬 코너와 달리 이미지 명령어는 이어질 스킬이 없어 category는 섹션 묶음에만 쓴다.
 */
export const IMAGE_CATS = ["product", "ads", "sns", "branding", "edit"] as const;
export type ImageCat = (typeof IMAGE_CATS)[number];

export interface ImagePromptItem {
  cmd: string;
  cat: ImageCat;
  ko: { label: string; example: string };
  vi: { label: string; example: string };
  en: { label: string; example: string };
}

export const IMAGE_PROMPTS: ImagePromptItem[] = [
  // ───── 제품 사진 (10)
  {
    cmd: "3d-billboard", cat: "product",
    ko: { label: "3D 옥외광고판", example: "이 제품을 도심 대형 옥외 3D 광고판에 튀어나오듯 배치한 초사실 사진으로" },
    vi: { label: "Biển quảng cáo 3D", example: "Đặt sản phẩm này lên biển quảng cáo 3D khổng lồ giữa thành phố, như đang nhô ra ngoài, ảnh siêu thực" },
    en: { label: "3D billboard", example: "Place this product on a giant 3D city billboard, popping out of the screen, hyper-realistic photo" },
  },
  {
    cmd: "showcase", cat: "product",
    ko: { label: "스튜디오 제품컷", example: "이 제품을 스튜디오 조명과 단색 배경 위 전문 제품 촬영컷으로" },
    vi: { label: "Ảnh studio chuyên nghiệp", example: "Chụp sản phẩm này kiểu ảnh studio chuyên nghiệp, ánh sáng studio, nền một màu" },
    en: { label: "Studio product shot", example: "Turn this product into a professional studio shot with studio lighting on a solid background" },
  },
  {
    cmd: "360-view", cat: "product",
    ko: { label: "4각도 격자컷", example: "이 제품을 정면·측면·후면·45도 네 각도에서 본 컷을 한 장에 격자로" },
    vi: { label: "Lưới 4 góc nhìn", example: "Tạo một ảnh dạng lưới gồm 4 góc nhìn của sản phẩm này: chính diện, bên hông, phía sau và góc 45 độ" },
    en: { label: "Four-angle grid", example: "Show this product from four angles — front, side, back and 45 degrees — in one grid image" },
  },
  {
    cmd: "lifestyle-shot", cat: "product",
    ko: { label: "일상 연출컷", example: "이 제품이 실제 사용자의 일상 공간에서 쓰이는 자연스러운 사진으로" },
    vi: { label: "Ảnh đời thường", example: "Chụp sản phẩm này đang được dùng tự nhiên trong không gian sinh hoạt hằng ngày của người dùng thật" },
    en: { label: "Lifestyle shot", example: "Show this product being used naturally in a real person's everyday space" },
  },
  {
    cmd: "flat-lay", cat: "product",
    ko: { label: "플랫레이", example: "이 제품과 어울리는 소품을 위에서 내려다본 플랫레이 구도로" },
    vi: { label: "Flat lay nhìn từ trên", example: "Sắp xếp sản phẩm này cùng các phụ kiện hợp tông, chụp flat lay nhìn thẳng từ trên xuống" },
    en: { label: "Flat lay", example: "Arrange this product with matching props in a top-down flat-lay composition" },
  },
  {
    cmd: "packshot", cat: "product",
    ko: { label: "쇼핑몰 누끼컷", example: "흰 배경, 그림자 살짝, 쇼핑몰 상세페이지용 누끼컷으로" },
    vi: { label: "Ảnh nền trắng bán hàng", example: "Tách nền sản phẩm này: nền trắng, bóng đổ nhẹ, dùng cho trang chi tiết trên sàn thương mại" },
    en: { label: "E-commerce packshot", example: "White background, subtle shadow, clean cut-out packshot for a product listing page" },
  },
  {
    cmd: "macro", cat: "product",
    ko: { label: "초근접 매크로", example: "이 제품의 질감과 디테일을 초근접 매크로 사진으로" },
    vi: { label: "Macro cận cảnh", example: "Chụp macro siêu cận cảnh chất liệu và chi tiết của sản phẩm này" },
    en: { label: "Macro close-up", example: "Capture the texture and fine details of this product in an extreme macro shot" },
  },
  {
    cmd: "unboxing", cat: "product",
    ko: { label: "언박싱 순간", example: "이 제품의 박스를 여는 순간을 1인칭 시점 사진으로" },
    vi: { label: "Khoảnh khắc mở hộp", example: "Chụp khoảnh khắc mở hộp sản phẩm này theo góc nhìn thứ nhất" },
    en: { label: "Unboxing moment", example: "A first-person photo of the moment this product's box is being opened" },
  },
  {
    cmd: "seasonal", cat: "product",
    ko: { label: "시즌 연출", example: "이 제품을 [크리스마스/여름] 분위기 연출 사진으로" },
    vi: { label: "Không khí theo mùa", example: "Chụp sản phẩm này trong không khí [Giáng sinh/mùa hè]" },
    en: { label: "Seasonal styling", example: "Style this product in a [Christmas/summer] themed photo" },
  },
  {
    cmd: "floating", cat: "product",
    ko: { label: "공중 부양 연출컷", example: "이 제품이 공중에 떠 있고 재료가 흩날리는 광고 연출컷으로" },
    vi: { label: "Sản phẩm bay lơ lửng", example: "Ảnh quảng cáo sản phẩm này lơ lửng giữa không trung, nguyên liệu bay tung xung quanh" },
    en: { label: "Floating product", example: "An ad-style shot of this product floating mid-air with its ingredients swirling around" },
  },
  // ───── 광고·마케팅 (10)
  {
    cmd: "meta-ads", cat: "ads",
    ko: { label: "인스타 피드 광고", example: "이 제품으로 인스타 피드용 1:1 광고 이미지, 큰 헤드라인 한 줄 포함" },
    vi: { label: "Quảng cáo feed Instagram", example: "Tạo ảnh quảng cáo 1:1 cho feed Instagram từ sản phẩm này, kèm một dòng tiêu đề lớn" },
    en: { label: "Instagram feed ad", example: "A 1:1 Instagram feed ad image for this product, with one big headline" },
  },
  {
    cmd: "story-ad", cat: "ads",
    ko: { label: "스토리 광고", example: "9:16 스토리 광고, 위에 후킹 문구, 아래 행동유도 버튼 자리" },
    vi: { label: "Quảng cáo story", example: "Quảng cáo story 9:16: câu hook ở trên, chừa chỗ cho nút kêu gọi hành động ở dưới" },
    en: { label: "Story ad", example: "A 9:16 story ad — hook line at the top, space for a call-to-action button at the bottom" },
  },
  {
    cmd: "before-after", cat: "ads",
    ko: { label: "사용 전후 비교", example: "이 제품 사용 전후를 좌우로 나눈 비교 이미지로" },
    vi: { label: "So sánh trước–sau", example: "Tạo ảnh so sánh trước và sau khi dùng sản phẩm này, chia đôi trái phải" },
    en: { label: "Before / after", example: "A split before-and-after comparison image for this product, left vs right" },
  },
  {
    cmd: "comparison", cat: "ads",
    ko: { label: "비교표 광고", example: "우리 제품과 일반 제품을 비교하는 표 형태 광고 이미지로" },
    vi: { label: "Bảng so sánh", example: "Tạo ảnh quảng cáo dạng bảng so sánh sản phẩm của chúng tôi với sản phẩm thông thường" },
    en: { label: "Comparison table ad", example: "A table-style ad image comparing our product with a generic one" },
  },
  {
    cmd: "sale-banner", cat: "ads",
    ko: { label: "세일 배너", example: "이 제품으로 [30% 할인] 세일 배너, 가격표 강조" },
    vi: { label: "Banner giảm giá", example: "Tạo banner giảm giá [30%] cho sản phẩm này, làm nổi bật bảng giá" },
    en: { label: "Sale banner", example: "A [30% off] sale banner for this product, price tag emphasized" },
  },
  {
    cmd: "testimonial", cat: "ads",
    ko: { label: "후기형 광고 카드", example: "고객 후기 한 줄과 제품을 함께 넣은 후기형 광고 카드로" },
    vi: { label: "Thẻ quảng cáo review", example: "Tạo thẻ quảng cáo kiểu review: một câu nhận xét của khách hàng đặt cạnh sản phẩm" },
    en: { label: "Testimonial card", example: "A testimonial-style ad card pairing one line of customer feedback with the product" },
  },
  {
    cmd: "magazine-ad", cat: "ads",
    ko: { label: "잡지 전면 광고", example: "고급 잡지 전면 광고 스타일로" },
    vi: { label: "Quảng cáo tạp chí", example: "Theo phong cách quảng cáo nguyên trang trên tạp chí cao cấp" },
    en: { label: "Magazine ad", example: "In the style of a full-page ad in a luxury magazine" },
  },
  {
    cmd: "poster", cat: "ads",
    ko: { label: "영화 포스터풍", example: "이 제품의 영화 포스터 스타일 이미지로" },
    vi: { label: "Phong cách poster phim", example: "Tạo ảnh sản phẩm này theo phong cách poster phim điện ảnh" },
    en: { label: "Movie poster style", example: "Turn this product into a movie-poster style image" },
  },
  {
    cmd: "landing-hero", cat: "ads",
    ko: { label: "랜딩 메인 이미지", example: "랜딩페이지 첫 화면용 가로형 메인 이미지, 왼쪽에 글자 들어갈 여백" },
    vi: { label: "Ảnh hero landing page", example: "Ảnh ngang cho màn hình đầu landing page, chừa khoảng trống bên trái để đặt chữ" },
    en: { label: "Landing hero image", example: "A wide hero image for a landing page, with empty space on the left for copy" },
  },
  {
    cmd: "ugc", cat: "ads",
    ko: { label: "일반인 후기 느낌", example: "일반인이 폰으로 찍은 듯한 자연스러운 후기 사진 느낌으로" },
    vi: { label: "Ảnh review người dùng", example: "Như ảnh review tự nhiên do người dùng bình thường chụp bằng điện thoại" },
    en: { label: "UGC style", example: "Make it look like a casual review photo taken on a phone by a regular person" },
  },
  // ───── SNS 콘텐츠 (10)
  {
    cmd: "carousel", cat: "sns",
    ko: { label: "인스타 캐러셀 5장", example: "이 주제로 인스타 캐러셀 5장 구성안과 각 장 이미지" },
    vi: { label: "Carousel 5 trang", example: "Lên bố cục carousel Instagram 5 trang cho chủ đề này và tạo ảnh từng trang" },
    en: { label: "5-slide carousel", example: "A 5-slide Instagram carousel outline on this topic, with an image for each slide" },
  },
  {
    cmd: "thumbnail", cat: "sns",
    ko: { label: "유튜브 썸네일", example: "유튜브 썸네일, 놀란 표정 인물, 큰 글자 3단어" },
    vi: { label: "Thumbnail YouTube", example: "Thumbnail YouTube: nhân vật mặt ngạc nhiên, chữ to tối đa 3 từ" },
    en: { label: "YouTube thumbnail", example: "A YouTube thumbnail — shocked face, three big bold words" },
  },
  {
    cmd: "reel-cover", cat: "sns",
    ko: { label: "릴스 커버", example: "릴스 커버, 9:16, 가운데 굵은 제목" },
    vi: { label: "Bìa Reels", example: "Ảnh bìa Reels 9:16, tiêu đề in đậm ở chính giữa" },
    en: { label: "Reel cover", example: "A 9:16 reel cover with a bold title in the center" },
  },
  {
    cmd: "meme", cat: "sns",
    ko: { label: "공감 밈", example: "이 상황을 공감 밈 이미지로" },
    vi: { label: "Ảnh meme", example: "Biến tình huống này thành ảnh meme ai cũng thấy mình trong đó" },
    en: { label: "Relatable meme", example: "Turn this situation into a relatable meme image" },
  },
  {
    cmd: "infographic", cat: "sns",
    ko: { label: "인포그래픽", example: "이 내용을 한눈에 보는 인포그래픽으로" },
    vi: { label: "Infographic", example: "Tóm gọn nội dung này thành một infographic nhìn là hiểu" },
    en: { label: "Infographic", example: "Turn this content into an at-a-glance infographic" },
  },
  {
    cmd: "quote-card", cat: "sns",
    ko: { label: "명언 카드", example: "이 문장을 감성 배경의 명언 카드로" },
    vi: { label: "Thẻ trích dẫn", example: "Đặt câu này lên thẻ trích dẫn với nền giàu cảm xúc" },
    en: { label: "Quote card", example: "Put this sentence on a quote card with a moody background" },
  },
  {
    cmd: "step-guide", cat: "sns",
    ko: { label: "1-2-3 단계 이미지", example: "이 과정을 1-2-3 단계 설명 이미지로" },
    vi: { label: "Hướng dẫn 1-2-3", example: "Trình bày quy trình này thành ảnh hướng dẫn 3 bước 1-2-3" },
    en: { label: "1-2-3 step guide", example: "Turn this process into a 1-2-3 step explainer image" },
  },
  {
    cmd: "comic", cat: "sns",
    ko: { label: "4컷 만화", example: "이 이야기를 4컷 만화로" },
    vi: { label: "Truyện tranh 4 khung", example: "Kể câu chuyện này bằng truyện tranh 4 khung" },
    en: { label: "4-panel comic", example: "Tell this story as a 4-panel comic" },
  },
  {
    cmd: "trend", cat: "sns",
    ko: { label: "유행 스타일 변환", example: "요즘 유행하는 [지브리/피규어] 스타일로 변환" },
    vi: { label: "Đổi style đang hot", example: "Chuyển ảnh sang phong cách đang hot [Ghibli/mô hình figure]" },
    en: { label: "Trending style", example: "Convert this into the trending [Ghibli/figurine] style" },
  },
  {
    cmd: "pinterest", cat: "sns",
    ko: { label: "핀터레스트 무드", example: "핀터레스트 감성의 세로형 무드 이미지로" },
    vi: { label: "Mood Pinterest", example: "Tạo ảnh dọc theo mood thẩm mỹ kiểu Pinterest" },
    en: { label: "Pinterest mood", example: "A vertical mood image with a Pinterest aesthetic" },
  },
  // ───── 인물·브랜딩 (10)
  {
    cmd: "headshot", cat: "branding",
    ko: { label: "링크드인 프로필", example: "이 사진을 링크드인용 전문 프로필 사진으로, 얼굴은 그대로" },
    vi: { label: "Ảnh hồ sơ LinkedIn", example: "Biến ảnh này thành ảnh hồ sơ chuyên nghiệp cho LinkedIn, giữ nguyên khuôn mặt" },
    en: { label: "LinkedIn headshot", example: "Turn this photo into a professional LinkedIn headshot, keep the face unchanged" },
  },
  {
    cmd: "action-figure", cat: "branding",
    ko: { label: "액션 피규어", example: "이 인물을 박스 포장된 액션 피규어로, 소품 3개 포함" },
    vi: { label: "Mô hình action figure", example: "Biến người này thành action figure đóng hộp, kèm 3 phụ kiện" },
    en: { label: "Boxed action figure", example: "Turn this person into a boxed action figure with three accessories" },
  },
  {
    cmd: "caricature", cat: "branding",
    ko: { label: "캐리커처", example: "이 인물의 특징을 살린 캐리커처로" },
    vi: { label: "Tranh biếm họa", example: "Vẽ biếm họa làm nổi bật nét đặc trưng của người này" },
    en: { label: "Caricature", example: "A caricature that plays up this person's distinctive features" },
  },
  {
    cmd: "avatar", cat: "branding",
    ko: { label: "3D 아바타", example: "이 인물을 3D 애니메이션 캐릭터 아바타로" },
    vi: { label: "Avatar 3D", example: "Biến người này thành avatar nhân vật hoạt hình 3D" },
    en: { label: "3D avatar", example: "Turn this person into a 3D animated character avatar" },
  },
  {
    cmd: "logo", cat: "branding",
    ko: { label: "미니멀 로고 4안", example: "[브랜드명] 미니멀 로고 시안 4개" },
    vi: { label: "4 mẫu logo tối giản", example: "4 phương án logo tối giản cho [tên thương hiệu]" },
    en: { label: "4 minimal logos", example: "Four minimal logo concepts for [brand name]" },
  },
  {
    cmd: "mascot", cat: "branding",
    ko: { label: "마스코트 시트", example: "우리 브랜드 마스코트 캐릭터 시트(정면·측면·표정 3종)" },
    vi: { label: "Bảng mascot", example: "Bảng nhân vật mascot cho thương hiệu: chính diện, bên hông và 3 biểu cảm" },
    en: { label: "Mascot sheet", example: "A brand mascot character sheet — front view, side view, three expressions" },
  },
  {
    cmd: "brand-board", cat: "branding",
    ko: { label: "브랜드 보드", example: "이 브랜드의 색상·폰트·무드를 정리한 브랜드 보드로" },
    vi: { label: "Brand board", example: "Tổng hợp màu sắc, phông chữ và mood của thương hiệu này thành một brand board" },
    en: { label: "Brand board", example: "A brand board laying out this brand's colors, fonts and mood" },
  },
  {
    cmd: "business-card", cat: "branding",
    ko: { label: "명함 디자인", example: "이 정보로 명함 앞뒤 디자인" },
    vi: { label: "Thiết kế danh thiếp", example: "Thiết kế hai mặt danh thiếp từ thông tin này" },
    en: { label: "Business card", example: "Design the front and back of a business card from this info" },
  },
  {
    cmd: "mockup", cat: "branding",
    ko: { label: "로고 목업", example: "이 로고를 머그컵·티셔츠·간판에 적용한 목업으로" },
    vi: { label: "Mockup logo", example: "Tạo mockup logo này trên cốc sứ, áo thun và biển hiệu" },
    en: { label: "Logo mockup", example: "Mock up this logo on a mug, a t-shirt and a storefront sign" },
  },
  {
    cmd: "team-photo", cat: "branding",
    ko: { label: "단체 사진 합성", example: "이 사진들을 한 사무실에서 찍은 단체 사진처럼 합성" },
    vi: { label: "Ghép ảnh tập thể", example: "Ghép những ảnh này thành một tấm ảnh tập thể như chụp chung trong văn phòng" },
    en: { label: "Team photo composite", example: "Combine these photos into one group shot that looks taken together in an office" },
  },
  // ───── 편집·변환 (10)
  {
    cmd: "remove-bg", cat: "edit",
    ko: { label: "배경 제거", example: "배경을 지우고 투명 배경으로" },
    vi: { label: "Xóa nền", example: "Xóa nền và chuyển thành nền trong suốt" },
    en: { label: "Remove background", example: "Remove the background and make it transparent" },
  },
  {
    cmd: "extend", cat: "edit",
    ko: { label: "16:9로 확장", example: "이 사진의 좌우를 자연스럽게 늘려 16:9로" },
    vi: { label: "Mở rộng thành 16:9", example: "Kéo dài tự nhiên hai bên trái phải của ảnh này thành khung 16:9" },
    en: { label: "Extend to 16:9", example: "Naturally extend the left and right of this photo to 16:9" },
  },
  {
    cmd: "relight", cat: "edit",
    ko: { label: "조명 바꾸기", example: "같은 장면을 황금빛 저녁 조명으로" },
    vi: { label: "Đổi ánh sáng", example: "Giữ nguyên cảnh này nhưng đổi sang ánh sáng hoàng hôn vàng óng" },
    en: { label: "Relight", example: "Same scene, relit with golden-hour evening light" },
  },
  {
    cmd: "restyle", cat: "edit",
    ko: { label: "화풍 변환", example: "이 사진을 수채화/유화/픽셀아트 스타일로" },
    vi: { label: "Đổi phong cách vẽ", example: "Chuyển ảnh này sang phong cách màu nước/sơn dầu/pixel art" },
    en: { label: "Restyle", example: "Render this photo in watercolor/oil painting/pixel-art style" },
  },
  {
    cmd: "colorize", cat: "edit",
    ko: { label: "흑백 컬러 복원", example: "흑백 사진을 자연스러운 컬러로 복원" },
    vi: { label: "Phục chế màu", example: "Phục chế ảnh đen trắng này thành ảnh màu tự nhiên" },
    en: { label: "Colorize", example: "Restore this black-and-white photo in natural color" },
  },
  {
    cmd: "upscale", cat: "edit",
    ko: { label: "고해상도 업스케일", example: "디테일을 살려 더 선명한 고해상도로" },
    vi: { label: "Nâng độ phân giải", example: "Nâng ảnh lên độ phân giải cao, sắc nét hơn mà vẫn giữ chi tiết" },
    en: { label: "Upscale", example: "Upscale to a sharper, higher resolution while preserving detail" },
  },
  {
    cmd: "sketch-to-real", cat: "edit",
    ko: { label: "손그림을 실사로", example: "이 손그림을 실제 사진처럼" },
    vi: { label: "Phác thảo thành ảnh thật", example: "Biến bản vẽ tay này thành ảnh như chụp thật" },
    en: { label: "Sketch to real", example: "Turn this hand-drawn sketch into a realistic photo" },
  },
  {
    cmd: "interior", cat: "edit",
    ko: { label: "인테리어 변경", example: "이 방을 [북유럽/모던] 인테리어로 바꾼 모습" },
    vi: { label: "Đổi nội thất", example: "Căn phòng này sẽ trông thế nào với nội thất phong cách [Bắc Âu/hiện đại]" },
    en: { label: "Interior makeover", example: "Show this room redone in [Scandinavian/modern] interior style" },
  },
  {
    cmd: "outfit", cat: "edit",
    ko: { label: "옷 갈아입히기", example: "이 사람에게 [정장/캐주얼]을 입힌 모습, 얼굴 유지" },
    vi: { label: "Thay trang phục", example: "Cho người này mặc [vest/đồ thường ngày], giữ nguyên khuôn mặt" },
    en: { label: "Outfit swap", example: "Dress this person in [a suit/casual wear], keep the face unchanged" },
  },
  {
    cmd: "blueprint", cat: "edit",
    ko: { label: "설계도 스타일", example: "이 제품의 분해도·설계도 스타일 이미지로" },
    vi: { label: "Phong cách bản vẽ kỹ thuật", example: "Tạo ảnh sản phẩm này theo kiểu bản vẽ kỹ thuật, sơ đồ tháo rời từng bộ phận" },
    en: { label: "Blueprint style", example: "An exploded-view, technical-blueprint style image of this product" },
  },
];
