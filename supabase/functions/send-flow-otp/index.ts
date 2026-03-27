import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const FLOW_URL = "https://flow.emro.co.kr/MGateway"

serve(async (req) => {
  // CORS 프리플라이트 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { email, otpCode } = await req.json()
    
    // 환경 변수에서 FLOW 인증키 가져오기
    const FLOW_AUTH_KEY = Deno.env.get('FLOW_AUTH_KEY')

    if (!FLOW_AUTH_KEY) {
      throw new Error('FLOW_AUTH_KEY is not set in Edge Function Secrets')
    }

    const payload = {
      "JSONData": {
        "API_KEY": "FLOW_BOT_NOTI_API",
        "CNTS_CRTC_KEY": FLOW_AUTH_KEY,
        "REQ_DATA": {
          "BOT_ID": "testbot",
          "RCVR_USER_ID": email,
          "CNTN": `[Worktime Dashboard] 인증번호는 [${otpCode}] 입니다. 5분 이내에 입력해주세요.`,
          "PREVIEW_LINK": "",
          "PREVIEW_TTL": "인증 요청",
          "PREVIEW_CNTN": "본인 확인을 위한 인증번호를 입력해주세요."
        }
      }
    }

    const response = await fetch(FLOW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    return new Response(JSON.stringify(result), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      status: response.status,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      status: 400,
    })
  }
})
