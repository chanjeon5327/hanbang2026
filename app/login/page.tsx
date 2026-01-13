'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Globe, Wallet } from 'lucide-react';
import { signIn } from 'next-auth/react'; // NextAuth 공식 함수 사용
import { useStore } from '@/context/StoreContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useStore(); // StoreContext의 로그인 상태 변경 함수
  const [activeTab, setActiveTab] = useState<'investor' | 'creator'>('investor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // [1] 카카오 로그인 (NextAuth)
  const handleKakaoLogin = async () => {
    setIsLoading('kakao');
    try {
      // 자동으로 /api/auth/signin/kakao 로 POST 요청을 보내고 처리함
      await signIn('kakao', { callbackUrl: '/' });
      login(); // 전역 상태도 로그인됨으로 변경
    } catch (error) {
      console.error(error);
      alert('카카오 로그인 연결 실패');
    } finally {
      setIsLoading(null);
    }
  };

  // [2] 구글 로그인 (NextAuth)
  const handleGoogleLogin = async () => {
    setIsLoading('google');
    try {
      await signIn('google', { callbackUrl: '/' });
      login();
    } catch (error) {
      console.error(error);
      alert('구글 로그인 연결 실패');
    } finally {
      setIsLoading(null);
    }
  };

  // [3] 이메일 로그인 (NextAuth Credentials)
  const handleEmailLogin = async () => {
    if (!email || !password) return alert('이메일과 비밀번호를 입력해주세요.');
    setIsLoading('email');
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        alert('로그인 실패: 이메일 또는 비밀번호를 확인해주세요.');
      } else {
        login(); // 성공 시 상태 변경
        router.push('/'); // 홈으로 이동
      }
    } catch (error) {
      console.error(error);
      alert('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(null);
    }
  };

  // [4] 메타마스크 지갑 연결 (수동 처리 유지)
  const handleWalletLogin = async () => {
    setIsLoading('wallet');
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts[0]) {
          alert(`지갑 연결 성공! \n주소: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
          login();
          router.push('/');
        }
      } else {
        alert('메타마스크 앱이 설치되어 있지 않습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('지갑 연결 취소 또는 실패');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <div className="relative flex items-center justify-center h-[60px] px-4">
        <button 
          onClick={() => router.back()} 
          className="absolute left-4 p-2 -ml-2 text-slate-900"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="flex-1 px-5 pt-4 pb-10 flex flex-col max-w-[480px] mx-auto w-full">
        {/* 타이틀 */}
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-8">
          간편하게 로그인하고<br />투자를 시작하세요
        </h1>

        {/* 탭 메뉴 */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
          <button
            onClick={() => setActiveTab('investor')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'investor'
                ? 'bg-white text-[#191F28] shadow-sm'
                : 'text-gray-400'
            }`}
          >
            일반 투자자
          </button>
          <button
            onClick={() => setActiveTab('creator')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'creator'
                ? 'bg-white text-[#191F28] shadow-sm'
                : 'text-gray-400'
            }`}
          >
            크리에이터 (전문가)
          </button>
        </div>

        {/* 소셜 로그인 버튼들 */}
        <div className="space-y-3 mb-8">
          {/* 카카오 */}
          <button
            onClick={handleKakaoLogin}
            disabled={!!isLoading}
            className="w-full bg-[#FEE500] text-[#391B1E] py-4 rounded-xl font-bold flex items-center justify-center gap-2 relative active:scale-[0.98] transition-transform"
          >
            <MessageCircle size={20} fill="#391B1E" className="absolute left-5" />
            {isLoading === 'kakao' ? '연결 중...' : '카카오로 시작하기'}
          </button>

          {/* 구글 */}
          <button
            onClick={handleGoogleLogin}
            disabled={!!isLoading}
            className="w-full bg-white border border-gray-200 text-slate-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 relative active:scale-[0.98] transition-transform"
          >
            <Globe size={20} className="absolute left-5" />
            {isLoading === 'google' ? '연결 중...' : '구글로 시작하기'}
          </button>

          {/* 지갑 연결 */}
          <button
            onClick={handleWalletLogin}
            disabled={!!isLoading}
            className="w-full bg-[#3182F6] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 relative active:scale-[0.98] transition-transform"
          >
            <Wallet size={20} className="absolute left-5" />
            {isLoading === 'wallet' ? '지갑 확인 중...' : '지갑 연결 (Metamask)'}
          </button>
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] bg-gray-200 flex-1"></div>
          <span className="text-xs text-gray-400">또는 이메일로 시작하기</span>
          <div className="h-[1px] bg-gray-200 flex-1"></div>
        </div>

        {/* 이메일 로그인 폼 */}
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-slate-900 outline-none focus:border-black focus:bg-white transition-all placeholder:text-gray-400"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 (6자리 이상)"
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-slate-900 outline-none focus:border-black focus:bg-white transition-all placeholder:text-gray-400"
          />
          <button
            onClick={handleEmailLogin}
            disabled={!!isLoading}
            className="w-full bg-[#191F28] text-white py-4 rounded-xl font-bold active:scale-[0.98] transition-transform mt-2"
          >
            {isLoading === 'email' ? '로그인 중...' : '이메일로 로그인'}
          </button>
        </div>
        
        {/* 회원가입 링크 등 추가 가능 영역 */}
        <div className="mt-6 text-center">
            <span className="text-xs text-gray-400">아직 계정이 없으신가요? </span>
            <button className="text-xs font-bold text-slate-900 underline ml-1">회원가입</button>
        </div>
      </div>
    </div>
  );
}
