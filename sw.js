// 서비스 워커 — 앱 화면(셸)만 캐시. 번역·TTS API 호출은 항상 네트워크로.
// 파일을 수정해 배포할 때마다 버전 숫자를 올려야 사용자 폰에서 새 버전으로 바뀝니다.
const CACHE = 'hm-interp-v12';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // 외부 API(Anthropic, Azure, 프록시)와 POST 요청은 건드리지 않음
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // 페이지 이동: 네트워크 우선(업데이트 반영) → 실패 시 캐시
  if (req.mode === 'navigate'){
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 정적 파일: 캐시 우선
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      // 정상 응답만 캐시 (없는 파일의 404를 저장하지 않도록)
      if (res.ok){
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
