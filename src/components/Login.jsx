import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { generateOTP, sendOTPViaFlow, saveOTPToDB, verifyOTP } from '../lib/flowApi';
import '../styles/Login.css';

const Login = ({ onLoginSuccess }) => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);

    // 카운트다운 타이머
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 이메일 전송 핸들러
    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setError('올바른 이메일 주소를 입력해 주세요.');
            return;
        }

        setLoading(true);
        setError('');

        const newOtp = generateOTP();
        
        // 1. FLOW API 발송
        const flowResult = await sendOTPViaFlow(email, newOtp);
        
        if (!flowResult.success) {
            setError('인증번호 발송에 실패했습니다. (FLOW API 오류)');
            setLoading(false);
            return;
        }

        // 2. DB 저장
        const dbResult = await saveOTPToDB(email, newOtp);
        
        if (!dbResult.success) {
            setError('시스템 오류가 발생했습니다. (DB 저장 실패)');
            setLoading(false);
            return;
        }

        setLoading(false);
        setStep(2);
        setCountdown(300); // 5분
    };

    // OTP 입력 처리
    const handleOtpChange = (index, value) => {
        // 숫자만 허용 (빈 문자열은 백스페이스 처리를 위해 허용)
        if (value !== '' && isNaN(value)) return;
        
        const newOtp = [...otpCode];
        // 한 글자만 유지
        newOtp[index] = value.substring(value.length - 1);
        setOtpCode(newOtp);

        // 값 입력 시 다음 칸으로 자동 포커스 이동
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!otpCode[index] && index > 0) {
                // 현재 칸이 비어있으면 이전 칸으로 이동하며 지움
                const newOtp = [...otpCode];
                newOtp[index - 1] = '';
                setOtpCode(newOtp);
                document.getElementById(`otp-${index - 1}`).focus();
            } else if (otpCode[index]) {
                // 현재 칸에 값이 있으면 지우기만 함 (기본 동작)
            }
        } else if (e.key === 'Delete' && index < 5) {
            // Delete 키 누르면 현재 값 지우고 다음 칸은 그대로 (기본 동작 유지 가능)
        } else if (e.key === 'ArrowLeft' && index > 0) {
            document.getElementById(`otp-${index - 1}`).focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6); // 최대 6자리
        if (!/^\d+$/.test(pastedData)) return; // 숫자만 포함된 경우만 처리

        const newOtp = [...otpCode];
        pastedData.split('').forEach((char, index) => {
            if (index < 6) newOtp[index] = char;
        });
        setOtpCode(newOtp);

        // 마지막 입력 칸 또는 채워진 마지막 칸으로 포커스 이동
        const nextIndex = Math.min(pastedData.length, 5);
        document.getElementById(`otp-${nextIndex}`).focus();
    };

    // OTP 검증 핸들러
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const fullCode = otpCode.join('');
        if (fullCode.length < 6) {
            setError('6자리 인증번호를 모두 입력해 주세요.');
            return;
        }

        setLoading(true);
        setError('');

        const result = await verifyOTP(email, fullCode);

        if (result.success) {
            // 세션 저장 (localStorage 사용)
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userEmail', email);
            onLoginSuccess();
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-logo">Worktime</div>
                <div className="login-subtitle">Dashboard Access</div>

                {step === 1 ? (
                    <form className="login-form" onSubmit={handleSendOTP}>
                        <div className="input-group">
                            <label>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#a0aec0' }} />
                                <input
                                    type="email"
                                    className="login-input"
                                    placeholder="yourname@emro.co.kr"
                                    style={{ paddingLeft: '45px' }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" className="btn-primary-login" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'Send Verification Code'}
                        </button>
                    </form>
                ) : (
                    <form className="login-form" onSubmit={handleVerifyOTP}>
                        <div className="input-group">
                            <label>Verification Code</label>
                            <p style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '1rem' }}>
                                {email} (으)로 전송된 6자리 코드를 입력하세요.
                            </p>
                            <div className="otp-inputs">
                                {otpCode.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`otp-${index}`}
                                        type="text"
                                        className="otp-digit"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        maxLength={1}
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem', color: '#718096' }}>
                                남은 시간: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                            </div>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" className="btn-primary-login" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'Verify & Enter'}
                        </button>

                        <div className="resend-link" onClick={() => { setStep(1); setOtpCode(['', '', '', '', '', '']); }}>
                            이메일 다시 입력하기
                        </div>
                    </form>
                )}

                <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#a0aec0' }}>
                    &copy; 2026 Worktime Dashboard. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Login;
