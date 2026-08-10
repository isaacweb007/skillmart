-- 같은 영상이 여러 언어 목록에 걸릴 수 있다(영어 영상이 en·vi 양쪽 결과에 등장).
-- video_id 단독 PK면 upsert가 한쪽을 덮어써 로케일 하나에서 사라진다.
alter table videos drop constraint videos_pkey;
alter table videos add primary key (video_id, locale);
