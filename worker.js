// (선택) Cloudflare Worker 프록시 — API 키를 폰/브라우저에 두지 않기 위한 서버 측 중계
//
// 배포:  npx wrangler deploy worker.js --name hm-interp
// 비밀값: npx wrangler secret put ANTHROPIC_API_KEY
//         npx wrangler secret put AZURE_KEY
// 환경변수(wrangler.toml [vars]): AZURE_REGION="koreacentral", ALLOWED_ORIGIN="https://내도메인"
//
// 앱 설정에서:
//   프록시 URL     → https://hm-interp.<계정>.workers.dev/translate
//   TTS 엔진       → 내 서버 / 프록시
//   TTS 프록시 URL → https://hm-interp.<계정>.workers.dev/tts

const ALLOWED_MODELS = ['claude-sonnet-5-5', 'claude-haiku-5-5'];

export default {
  async fetch(request, env){
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });

    const { pathname } = new URL(request.url);

    // ---- 번역: 앱이 보낸 Messages API 본문을 그대로 전달 (모델·토큰 수는 제한) ----
    if (pathname === '/translate'){
      const body = await request.json();
      if (!ALLOWED_MODELS.includes(body.model)) body.model = ALLOWED_MODELS[0];
      body.max_tokens = Math.min(body.max_tokens || 1024, 1024);
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
      });
      return new Response(res.body, {
        status: res.status,
        headers: { ...cors, 'content-type': 'application/json' }
      });
    }

    // ---- TTS: { text, lang, voice } → Azure mp3 ----
    if (pathname === '/tts'){
      const { text = '', lang = 'mn', voice } = await request.json();
      if (!text || text.length > 1000) return new Response('Bad text', { status: 400, headers: cors });
      const esc = s => s.replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]));
      const xmlLang = lang === 'ko' ? 'ko-KR' : 'mn-MN';
      const v = lang === 'ko' ? 'ko-KR-SunHiNeural' : (voice || 'mn-MN-YesuiNeural');
      const res = await fetch(`https://${env.AZURE_REGION || 'koreacentral'}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': env.AZURE_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3'
        },
        body: `<speak version="1.0" xml:lang="${xmlLang}"><voice name="${v}">${esc(text)}</voice></speak>`
      });
      return new Response(res.body, {
        status: res.status,
        headers: { ...cors, 'content-type': 'audio/mpeg' }
      });
    }

    return new Response('Not found', { status: 404, headers: cors });
  }
};
