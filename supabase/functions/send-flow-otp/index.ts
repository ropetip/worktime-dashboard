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

    // 응답을 텍스트로 먼저 받음 (URL 인코딩되어 올 수 있음)
    const rawText = await response.text()
    console.log("FLOW API Raw Response:", rawText)

    let finalResult = null
    try {
      // URL 인코딩된 문자열(%7B%22... )인 경우 디코딩 시도
      let decodedText = rawText;
      if (rawText.includes('%7B')) {
        decodedText = decodeURIComponent(rawText);
        console.log("Decoded Flow Response:", decodedText);
      }
      
      finalResult = JSON.parse(decodedText)
    } catch (parseError: any) {
      console.error("JSON Parsing Error:", parseError?.message || String(parseError))
      // 파싱 실패 시 원본 텍스트를 포함하여 응답
      finalResult = { error: "Parse Error", raw: rawText }
    }

    // FLOW 응답의 RSLT 코드가 00이면 성공으로 간주함 (필요 시 수정 가능)
    // 혹은 상태 코드가 200이면 성공으로 통과시킴
    const isSuccess = response.ok || (finalResult && finalResult.JSONData && finalResult.JSONData.RSLT === "00")

    return new Response(JSON.stringify(finalResult), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      status: isSuccess ? 200 : response.status,
    })

  } catch (error: any) {
    console.error("Edge Function Runtime Error:", error?.message || String(error))
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      status: 400,
    })
  }
})
