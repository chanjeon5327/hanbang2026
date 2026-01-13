"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/auth/LoginModal"
import { createClient } from "@/lib/supabase/client"
import { User, Sun, Moon } from "lucide-react"

export function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 다크모드 상태 확인
    if (typeof window !== 'undefined') {
      const isDarkMode = document.documentElement.classList.contains('dark')
      setIsDark(isDarkMode)
    }

    // localStorage에서 로그인 상태 확인
    const checkUser = () => {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('hb_user')
        if (userData) {
          try {
            const parsed = JSON.parse(userData)
            setUser({ name: parsed.name, email: parsed.email })
          } catch {
            // 기존 형식 지원
            setUser({ name: userData })
          }
        } else {
          setUser(null)
        }
      }
    }

    checkUser()
    
    // storage 이벤트 리스너 (다른 탭에서 로그인/로그아웃 시)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hb_user') {
        checkUser()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // 주기적으로 확인 (같은 탭에서의 변경 감지)
    const interval = setInterval(checkUser, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const toggleTheme = () => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      root.classList.toggle('dark')
      setIsDark(root.classList.contains('dark'))
      localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('hb_user')
    setUser(null)
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0 z-10">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              H
            </div>
            <span className="text-xl font-bold">HANBANG</span>
          </Link>

          <div className="flex items-center gap-2 flex-shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/wallet">
                  <Button variant="ghost" size="sm" className="flex-shrink-0 active:scale-95 transition-transform cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">내 지갑</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="flex-shrink-0 active:scale-95 transition-transform cursor-pointer">
                  로그아웃
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsLoginModalOpen(true)} className="flex-shrink-0 active:scale-95 transition-transform cursor-pointer">
                <span className="hidden sm:inline">로그인 / 회원가입</span>
                <span className="sm:hidden">로그인</span>
              </Button>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-transform cursor-pointer flex-shrink-0"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <LoginModal
        open={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
      />
    </>
  )
}

