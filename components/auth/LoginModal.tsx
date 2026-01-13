"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useStore } from "@/context/StoreContext"
import { WalletConnect } from "@/components/WalletConnect"

export function LoginModal() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [userType, setUserType] = useState<"investor" | "creator">("investor")
  const [activeTab, setActiveTab] = useState<"sns" | "wallet">("sns")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState("")
  const { isLoginModalOpen, closeLoginModal } = useStore()

  const handleSocialLogin = async (provider: "google" | "kakao") => {
    try {
      setLoading(provider)
      setLoadingMessage("🚀 블록체인 지갑 생성 중...")
      
      // 출품자 선택 시 userType 저장
      if (userType === "creator") {
        localStorage.setItem("hb_userType", "creator")
      } else {
        localStorage.setItem("hb_userType", "investor")
      }
      
      // redirect 옵션을 명시하여 클라이언트 사이드 리다이렉트 충돌 방지
      const callbackUrl = userType === "creator" ? "/creator/register" : "/"
      
      await signIn(provider, { 
        redirect: true, 
        callbackUrl: callbackUrl
      })
    } catch (error) {
      console.error("Login error:", error)
      setLoadingMessage("로그인에 실패했습니다. 다시 시도해주세요.")
      setTimeout(() => {
        setLoading(null)
      }, 2000)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 유효성 검사
    if (!email || !email.includes("@")) {
      setEmailError("올바른 이메일을 입력해주세요.")
      return
    }
    if (!password || password.length < 6) {
      setEmailError("비밀번호는 6자 이상이어야 합니다.")
      return
    }

    setEmailError("")
    setLoading("email")
    setLoadingMessage("🚀 블록체인 지갑 생성 중...")

    try {
      // 출품자 선택 시 userType 저장 및 가짜 로그인 시뮬레이션
      if (userType === "creator") {
        localStorage.setItem("hb_userType", "creator")
        // 가짜 로그인 시뮬레이션 (실제로는 API 호출)
        setTimeout(() => {
          const userData = {
            name: email.split("@")[0],
            email: email,
            provider: "email",
            loginTime: new Date().toISOString(),
            userType: "creator",
          }
          localStorage.setItem("hb_user", JSON.stringify(userData))
          window.dispatchEvent(new Event("loginStateChange"))
          closeLoginModal()
          router.push("/creator/register")
        }, 1500)
      } else {
        // 이메일 로그인은 CredentialsProvider가 제거되었으므로 비활성화
        setEmailError("이메일 로그인은 현재 준비 중입니다. 소셜 로그인을 이용해주세요.")
        setLoading(null)
      }
    } catch (error) {
      console.error("Login error:", error)
      setEmailError("로그인에 실패했습니다. 다시 시도해주세요.")
      setLoading(null)
    }
  }

  const handleWalletConnect = (address: string) => {
    // 지갑 연결 성공 시 localStorage에 저장
    const walletData = {
      name: `Wallet_${address.slice(0, 6)}`,
      email: null,
      provider: 'metamask',
      address: address,
      loginTime: new Date().toISOString(),
      userType: userType,
    }
    localStorage.setItem('hb_user', JSON.stringify(walletData))
    localStorage.setItem("hb_userType", userType)
    window.dispatchEvent(new Event('loginStateChange'))
    closeLoginModal()
    
    // 출품자 선택 시 등록 페이지로 이동
    if (userType === "creator") {
      router.push("/creator/register")
    } else {
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    }
  }

  if (!isLoginModalOpen) return null

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeLoginModal()
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'var(--card-bg)',
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '420px',
          width: '90%',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '12px' }}>
            ⚡ 3초 만에 시작하기
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            간편하게 로그인하고 투자를 시작하세요
          </p>
        </div>

        {/* 신분 선택 탭 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px' }}>
          <button
            onClick={() => setUserType("investor")}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: userType === "investor" ? 'var(--accent-color)' : 'transparent',
              color: userType === "investor" ? 'white' : 'var(--text-secondary)',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: userType === "investor" ? 'scale(1.02)' : 'scale(1)',
              boxShadow: userType === "investor" ? '0 2px 8px rgba(124, 58, 237, 0.3)' : 'none'
            }}
          >
            일반 투자자
          </button>
          <button
            onClick={() => setUserType("creator")}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: userType === "creator" ? 'var(--accent-color)' : 'transparent',
              color: userType === "creator" ? 'white' : 'var(--text-secondary)',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: userType === "creator" ? 'scale(1.02)' : 'scale(1)',
              boxShadow: userType === "creator" ? '0 2px 8px rgba(124, 58, 237, 0.3)' : 'none'
            }}
          >
            프로젝트 출품자
          </button>
        </div>

        {/* 탭 선택 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', position: 'relative' }}>
          <button
            onClick={() => setActiveTab("sns")}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === "sns" ? 'var(--accent-color)' : 'transparent',
              color: activeTab === "sns" ? 'white' : 'var(--text-secondary)',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              zIndex: 1,
              transform: activeTab === "sns" ? 'scale(1.02)' : 'scale(1)',
              boxShadow: activeTab === "sns" ? '0 2px 8px rgba(124, 58, 237, 0.3)' : 'none'
            }}
          >
            소셜 로그인
          </button>
          <button
            onClick={() => setActiveTab("wallet")}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === "wallet" ? 'var(--accent-color)' : 'transparent',
              color: activeTab === "wallet" ? 'white' : 'var(--text-secondary)',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              zIndex: 1,
              transform: activeTab === "wallet" ? 'scale(1.02)' : 'scale(1)',
              boxShadow: activeTab === "wallet" ? '0 2px 8px rgba(124, 58, 237, 0.3)' : 'none'
            }}
          >
            지갑 연결
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: 'var(--accent-color)', marginBottom: '20px' }} />
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{loadingMessage}</p>
          </div>
        ) : activeTab === "sns" ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => handleSocialLogin("kakao")}
              style={{
                width: '100%',
                backgroundColor: '#FEE500',
                color: '#000000',
                fontWeight: 'bold',
                fontSize: '16px',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FDD835'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FEE500'
              }}
            >
              <span>🟡</span>
              카카오로 시작하기
            </button>
            <button
              onClick={() => handleSocialLogin("google")}
              style={{
                width: '100%',
                backgroundColor: 'white',
                color: '#000000',
                fontWeight: 'bold',
                fontSize: '16px',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #d1d6db',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <span>⚪</span>
              구글로 시작하기
            </button>
            
            {/* 이메일 로그인 폼 */}
            <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="email"
                  placeholder="이메일"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError("")
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#F9FAFB',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(49, 130, 246, 0.1)'
                    e.currentTarget.style.backgroundColor = '#FFFFFF'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.backgroundColor = '#F9FAFB'
                  }}
                />
                <input
                  type="password"
                  placeholder="비밀번호 (6자 이상)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setEmailError("")
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#F9FAFB',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 500,
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(49, 130, 246, 0.1)'
                    e.currentTarget.style.backgroundColor = '#FFFFFF'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.backgroundColor = '#F9FAFB'
                  }}
                />
                {emailError && (
                  <p style={{ fontSize: '12px', color: 'var(--up-color)', marginTop: '-8px' }}>{emailError}</p>
                )}
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  <span>📧</span>
                  이메일로 시작하기
                </button>
              </form>
            </div>
          </div>
        ) : (
          <WalletConnect onConnect={handleWalletConnect} />
        )}

        {!loading && (
          <p style={{ fontSize: '11px', textAlign: 'center', color: 'var(--text-muted)', marginTop: '24px' }}>
            로그인 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다
          </p>
        )}
      </div>
    </div>
  )
}
