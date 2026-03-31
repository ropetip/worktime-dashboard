import { supabase } from './supabase';

/**
 * FLOW API를 통한 OTP 인증 유틸리티
 */

/**
 * 6자리 랜덤 인증번호 생성
 */
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * FLOW API를 사용하여 인증번호 전송 (Supabase Edge Function 경유)
 */
export const sendOTPViaFlow = async (email, otpCode) => {
    try {
        // 직접 호출 대신 이전에 생성한 Edge Function('send-flow-otp')을 호출합니다.
        // 이를 통해 CORS 문제를 해결하고 보안 키를 서버사이드로 은닉할 수 있습니다.
        const { data, error } = await supabase.functions.invoke('send-flow-otp', {
            body: { email, otpCode }
        });

        //console.log("Edge Function Response Data:", data);

        if (error) {
            console.error("Edge Function 호출 오류:", error);
            return { success: false, error: error.message };
        }

        // 데이터 내부의 실제 성공 여부 체크 (필요한 경우)
        return { success: true, data };
    } catch (error) {
        console.error("인증 전송 프로세스 예외:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Supabase DB에 OTP 정보 저장
 */
export const saveOTPToDB = async (email, otpCode) => {
    // 5분 후 만료
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('auth_otp')
        .insert([{
            user_id: email,
            otp_code: otpCode,
            expires_at: expiresAt,
            is_used: false
        }]);

    if (error) {
        console.error("OTP DB 저장 오류:", error);
        return { success: false, error };
    }
    return { success: true, data };
};

/**
 * OTP 코드 검증
 */
export const verifyOTP = async (email, otpCode) => {
    const now = new Date().toISOString();

    // 1. 유효한 OTP 조회 (만료되지 않고 사용되지 않은 최신 코드)
    const { data, error } = await supabase
        .from('auth_otp')
        .select('*')
        .eq('user_id', email)
        .eq('otp_code', otpCode)
        .eq('is_used', false)
        .gt('expires_at', now)
        .order('create_dt', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) {
        return { success: false, message: "잘못된 인증번호이거나 만료되었습니다." };
    }

    // 2. 사용 완료 처리
    await supabase
        .from('auth_otp')
        .update({ is_used: true })
        .eq('id', data[0].id);

    return { success: true, message: "인증 성공" };
};
