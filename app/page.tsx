"use client";

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { ArrowRight, Trophy, Sparkles, Clock, Bell, Globe, Shield, TrendingDown } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/context/StoreContext"
import Image from "next/image"
import MobileHome from '@/components/mobile/MobileHome';

// [수정 1] 뉴스라인: 보라색 테마 적용 + 뉴스 내용 업데이트
function NewsLine() {
  const newsItems = [
    "[속보] 세븐틴 스타디움 투어 수익 배분 시작! 예상 수익률 15% 돌파",
    "[단독] 웹툰 '나 혼자 만렙' 드라마화 확정, 제작비 200억 펀딩 오픈",
    "[화제] 오징어게임2 관련주, 한방 거래소에서 거래량 1위 달성",
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 overflow-hidden whitespace-nowrap bg-[#7c3aed]/90 backdrop-blur-sm py-2">
      <motion.div
        animate={{ x: ['100%', '-100%'] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="inline-block"
      >
        {newsItems.map((item, idx) => (
          <span key={idx} className="mr-24 text-sm font-bold text-white">
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// [수정 2] 히어로 섹션: 유튜브 영상 배경 (클릭 방지 + 자동 재생)
function HeroSection() {
  return (
    <section className="relative h-[600px] mt-[100px] overflow-hidden w-full bg-black">
      {/* 배경 영상 (클릭 불가 처리) */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <iframe
          width="100%"
          height="150%" // 상하 레터박스 제거를 위해 높이 키움
          src="https://www.youtube.com/embed/fLJS_iA7a5k?autoplay=1&mute=1&controls=0&loop=1&playlist=fLJS_iA7a5k&playsinline=1"
          title="Background Video"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>

      {/* 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      {/* 텍스트 컨텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6"
        >
          3초 만에 시작하는<br />
          <span className="text-[#7c3aed]">K-콘텐츠 투자</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mb-10"
        >
          검증된 K-콘텐츠 IP에 투자하고, 전 세계 팬들의 사랑을 수익으로 전환하세요
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/active-invest">
            <Button size="lg" className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-purple-500/50 transition-all">
              지금 바로 투자하기 <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// 상태표시바 (디자인 다듬기)
function StatusBar() {
  const statusMessages = [
    "🟢 현재 3,420명이 접속 중입니다.",
    "⚡ 방금 '오징어게임2' 500주 매수 체결!",
    "📈 '세븐틴 투어' 수익률 12% 돌파!",
    "🔥 'BTS 앨범' 투자 모집률 85% 달성!",
    "💎 '웹툰 드라마화' 프로젝트 신규 상장!",
  ];
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % statusMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [statusMessages.length]);

  return (
    <div className="fixed top-[40px] left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 py-2 flex justify-center items-center">
      <motion.span
        key={currentMessage}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        className="text-sm font-medium text-blue-400"
      >
        {statusMessages[currentMessage]}
      </motion.span>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const { products } = useStore();

  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("status", "recruiting")
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) {
        console.error("Error fetching projects:", error);
      } else {
        setProjects(data || []);
      }
    };
    fetchProjects();
  }, []);

  return (
    <>
      {/* 모바일 전용 */}
      <div className="block md:hidden">
        <MobileHome />
      </div>

      {/* PC 버전: 배경을 강제로 검은색(#000000)으로 고정 */}
      <div className="hidden md:block min-h-screen bg-black text-white pb-32">
        <NewsLine />
        <StatusBar />
        <HeroSection />

        {/* 1. 퀵 메뉴바 (중요: 기획서 반영) */}
        <section className="relative z-20 -mt-16 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-4 gap-4">
            {[
              { title: "실시간 랭킹", desc: "수익률 TOP 10", icon: Trophy, color: "#7c3aed", link: "/ranking" },
              { title: "신규 상장", desc: "새로운 투자 기회", icon: Sparkles, color: "#ef4444", link: "/new-listing" },
              { title: "마감 임박", desc: "곧 펀딩 종료", icon: Clock, color: "#3b82f6", link: "/closing-soon" },
              { title: "공지사항", desc: "한방 소식", icon: Bell, color: "#ffffff", link: "/notice" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                onClick={() => router.push(item.link)}
                className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-[#7c3aed]/50 transition-all shadow-lg"
              >
                <item.icon size={32} color={item.color} className="mb-4" />
                <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 2. 인기 투자 상품 */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-white">🔥 핫 트렌드 상품</h2>
                <p className="text-gray-400 mt-2">지금 가장 거래량이 많은 K-콘텐츠</p>
              </div>
              <Link href="/active-invest">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  전체 보기 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-8">
              {products.slice(0, 3).map((product) => (
                <Link key={product.id} href={`/active-invest/product/${product.id}`}>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#111] rounded-3xl overflow-hidden border border-white/10 hover:border-[#7c3aed] transition-all group"
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-110"
                      />
                      {/* 뱃지 예시 */}
                      <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        HOT
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{product.name}</h3>
                      <div className="flex justify-between items-end mt-4">
                        <div>
                          <p className="text-sm text-gray-400">현재가</p>
                          <p className="text-2xl font-bold text-[#ef4444]">{product.price.toLocaleString()}원</p>
                        </div>
                        <Button size="sm" className="bg-[#7c3aed] hover:bg-[#6d28d9]">투자하기</Button>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 3. 왜 한방인가 (Why Section) */}
        <section className="py-12 border-t border-white/10 bg-[#050505]">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-3 gap-8">
            {[
              { title: "글로벌 팬덤 수익", desc: "전 세계 팬들의 사랑을 내 수익으로", icon: Globe },
              { title: "안전한 블록체인", desc: "위변조 불가능한 투명한 거래 기록", icon: Shield },
              { title: "내가 만드는 자산", desc: "콘텐츠의 주인이 되는 새로운 경험", icon: TrendingDown },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-[#1a1a1a] to-black p-8 rounded-3xl border border-white/5 text-center"
              >
                <div className="bg-[#7c3aed]/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <item.icon size={32} className="text-[#7c3aed]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}