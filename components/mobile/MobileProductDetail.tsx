'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Home, Share2, Star } from 'lucide-react';

interface MobileProductDetailProps {
  id: string;
}

export default function MobileProductDetail({ id }: MobileProductDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'order' | 'price'>('info');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [priceType, setPriceType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState(10000);
  const [quantity, setQuantity] = useState(1);
  const [isStarred, setIsStarred] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: '투자자A', message: '이거 진짜 오나요?', time: '14:20', isMe: false },
    { id: 2, user: '나', message: '저도 궁금해요', time: '14:25', isMe: true },
    { id: 3, user: '투자자B', message: '수익률이 좋아 보이네요!', time: '14:30', isMe: false },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // [New] 미디어 제어 로직
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMuted, setIsMuted] = useState(true); // 초기값: Muted (소리 꺼짐)
  const [flash, setFlash] = useState(false); // 호가창 번쩍임 효과용

  // 음소거 토글 핸들러
  const toggleMute = () => {
    if (isMuted) {
      // 현재 Muted 상태 -> 소리 켜기 (Unmute)
      setIsMuted(false);
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'unMute' }),
        '*'
      );
    } else {
      // 현재 Unmuted 상태 -> 소리 끄기 (Mute)
      setIsMuted(true);
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'mute' }),
        '*'
      );
    }
  };

  const currentPrice = 10000;
  const changeRate = 15.5;
  const isUp = changeRate > 0;

  // 더미 데이터
  const productData = {
    name: '나 혼자 만렙',
    category: '웹툰',
    totalAmount: 1000000000, // 10억
    pricePerShare: 1000,
    externalUrl: 'https://example.com',
    revenueSplit: {
      creator: 50,
      investor: 47,
      fee: 3,
    },
    manager: {
      name: '김면식',
      position: '대리',
      email: 'kim@hanbang.com',
    },
    news: [
      { id: 1, title: '[속보] 나 혼자 만렙 드라마화 확정', date: '2024.01.15' },
      { id: 2, title: '웹툰 IP 투자 열풍...', date: '2024.01.10' },
      { id: 3, title: 'K-콘텐츠 글로벌 진출 가속화', date: '2024.01.05' },
    ],
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const newMessage = {
      id: chatMessages.length + 1,
      user: '나',
      message: chatInput,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };
    setChatMessages([...chatMessages, newMessage]);
    setChatInput('');
    setTimeout(() => {
      chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight });
  }, [chatMessages]);

  // 공유 기능: 현재 URL 복사
  const handleShare = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      // 간단한 피드백 (선택사항: 토스트 메시지 추가 가능)
      alert('링크가 클립보드에 복사되었습니다.');
    } catch (err) {
      console.error('링크 복사 실패:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-[140px]">
      {/* 상단 헤더 */}
      <header className="sticky top-0 bg-white z-50 border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* 좌측: 상품명 */}
          <h1 className="text-lg font-bold text-slate-900 truncate flex-1 mr-3">
            {productData.name}
          </h1>
          
          {/* 우측: 아이콘 3개 */}
          <div className="flex items-center gap-1">
            {/* 홈 버튼 */}
            <button
              onClick={() => router.push('/')}
              className="p-2.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
            >
              <Home size={24} className="text-slate-700" />
            </button>
            
            {/* 공유 버튼 */}
            <button
              onClick={handleShare}
              className="p-2.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
            >
              <Share2 size={24} className="text-slate-700" />
            </button>
            
            {/* 찜 버튼 */}
            <button
              onClick={() => setIsStarred(!isStarred)}
              className={`p-2.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all ${
                isStarred ? 'bg-yellow-50' : ''
              }`}
            >
              <Star 
                size={24} 
                className={`${
                  isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-slate-700'
                }`} 
              />
            </button>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 - 캡슐형 세그먼트 컨트롤 */}
      <div className="sticky top-[60px] z-40 px-4 py-2 bg-white">
        <div className="bg-gray-100 rounded-xl p-1 flex">
          {[
            { id: 'info', label: '정보' },
            { id: 'order', label: '주문' },
            { id: 'price', label: '시세' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-[#7c3aed] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <main className="min-h-[500px] pb-[30vh]">
        {/* 정보 탭 */}
        {activeTab === 'info' && (
          <div className="px-4 py-4 space-y-2">
            {/* 미디어 - 유튜브 임베드 */}
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative group">
              <iframe
                ref={iframeRef}
                src="https://www.youtube.com/embed/HosW0gulISQ?start=26&end=115&autoplay=1&mute=1&controls=0&loop=1&playlist=HosW0gulISQ&rel=0&enablejsapi=1"
                className="w-full h-full pointer-events-none"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="상품 미디어"
              />

              {/* 투명 음소거 버튼 */}
              <button
                onClick={toggleMute}
                className="absolute bottom-3 right-3 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-transform active:scale-90 hover:bg-black/60 z-10 btn-press"
              >
                {isMuted ? (
                  // 소리가 꺼져있을 때 -> 켤 수 있도록 '스피커 아이콘(🔊)' 표시
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                ) : (
                  // 소리가 켜져있을 때 -> 끌 수 있도록 '음소거 아이콘(🔇)' 표시
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>
            </div>

            {/* 핵심 요약 */}
            <div className="pt-1">
              <div className="flex justify-between items-end mb-1">
                <h2 className="text-xl font-bold text-[#191F28] leading-none tracking-tight">{productData.name}</h2>
                <span className="text-xl font-bold text-[#191F28] leading-none">{currentPrice.toLocaleString()}원</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 text-sm font-bold leading-none">+{changeRate}%</span>
                <span className="text-gray-300 text-[10px]">|</span>
                <a
                  href={productData.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 text-xs underline leading-none btn-press"
                >
                  외부 링크 열기 ›
                </a>
              </div>
            </div>

            {/* 투자 개요 카드 */}
            <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">투자 개요</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">총 투자 모집액</span>
                  <span className="font-bold text-slate-900">
                    {(productData.totalAmount / 100000000).toFixed(0)}억 원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">주당 가격</span>
                  <span className="font-bold text-slate-900">
                    {productData.pricePerShare.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">카테고리</span>
                  <span className="font-bold text-slate-900">{productData.category}</span>
                </div>
              </div>
            </div>

            {/* 수익 배분율 */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">수익 배분율</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">창작자</span>
                    <span className="text-sm font-bold text-slate-900">
                      {productData.revenueSplit.creator}%
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${productData.revenueSplit.creator}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">투자자</span>
                    <span className="text-sm font-bold text-slate-900">
                      {productData.revenueSplit.investor}%
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${productData.revenueSplit.investor}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">수수료</span>
                    <span className="text-sm font-bold text-slate-900">
                      {productData.revenueSplit.fee}%
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-400"
                      style={{ width: `${productData.revenueSplit.fee}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 상세 정보 */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">투자 계획</h3>
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                본 작품은 글로벌 배급사와의 협약을 통해 드라마화가 확정되었으며,
                향후 3년간의 수익 배분 계획이 수립되었습니다.
              </p>
              <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold btn-press">
                계획서 다운로드
              </button>
            </div>

            {/* 담당자 정보 */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-slate-900 mb-3">담당자 정보</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">이름</span>
                  <span className="font-bold text-slate-900">
                    {productData.manager.name} {productData.manager.position}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">이메일</span>
                  <a
                    href={`mailto:${productData.manager.email}`}
                    className="text-blue-600 text-sm font-medium"
                  >
                    {productData.manager.email}
                  </a>
                </div>
              </div>
            </div>

            {/* 관련 뉴스 */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">관련 뉴스</h3>
              <div className="space-y-2">
                {productData.news.map((news) => (
                  <div
                    key={news.id}
                    className="border-b border-gray-100 pb-3 last:border-0 list-press"
                  >
                    <div className="text-sm font-medium text-slate-900 mb-1">{news.title}</div>
                    <div className="text-xs text-gray-400">{news.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 주문 탭: 차트 -> 호가 -> 주문 순서로 통합 */}
        {activeTab === 'order' && (
          <div className="flex flex-col gap-6 px-4">
            {/* 1. 차트 영역 (보라색 recharts 그래프) */}
            <div className="h-[200px] bg-white rounded-xl border border-slate-100 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={Array.from({ length: 20 }, (_, i) => ({
                  time: `${9 + i}:00`,
                  price: currentPrice + Math.sin(i / 3) * 500 + (i * 50),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fill: '#6B7280', fontSize: 10 }}
                    stroke="#E5E7EB"
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280', fontSize: 10 }}
                    stroke="#E5E7EB"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #E5E7EB', 
                      borderRadius: '8px',
                      color: '#191F28'
                    }}
                    formatter={(value: any) => [value.toLocaleString(), '가격']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#7c3aed" 
                    strokeWidth={2}
                    dot={{ fill: '#7c3aed', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 2. 호가 영역 (복구: 고퀄리티 디자인) */}
            <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="bg-gray-50 p-2 text-center text-xs font-bold border-b">호가 정보</div>
              
              {/* 매도 호가 (위로 쌓임) */}
              <div className="flex flex-col-reverse">
                {[10500, 10400, 10300, 10200, 10100].map((p, idx) => {
                  const amount = Math.floor(Math.random() * 100) + 20;
                  return (
                    <div
                      key={`ask-${p}`}
                      className="flex justify-between items-center text-xs p-2 bg-blue-50/50 relative overflow-hidden"
                    >
                      {/* 배경 막대 그래프 (오른쪽에서 왼쪽으로) */}
                      <div
                        className="absolute top-0 bottom-0 right-0 bg-blue-100 opacity-50 transition-all duration-300"
                        style={{ width: `${Math.min((amount / 200) * 100, 100)}%` }}
                      ></div>
                      {/* 텍스트 내용 */}
                      <span className="z-10 text-blue-600 w-1/3 text-center font-medium">
                        {p.toLocaleString()}
                      </span>
                      <span className="z-10 text-gray-500 w-1/3 text-right pr-2">{amount}</span>
                    </div>
                  );
                })}
              </div>

              {/* 현재가 */}
              <div className="bg-gray-100 p-2 text-center font-bold text-sm border-y border-gray-200">
                {currentPrice.toLocaleString()} (현재가)
              </div>

              {/* 매수 호가 (아래로 쌓임) */}
              <div className="flex flex-col">
                {[9900, 9800, 9700, 9600, 9500].map((p, idx) => {
                  const amount = Math.floor(Math.random() * 100) + 20;
                  return (
                    <div
                      key={`bid-${p}`}
                      className="flex justify-between items-center text-xs p-2 bg-red-50/50 relative overflow-hidden"
                    >
                      {/* 배경 막대 그래프 (왼쪽에서 오른쪽으로) */}
                      <div
                        className="absolute top-0 bottom-0 left-0 bg-red-100 opacity-50 transition-all duration-300"
                        style={{ width: `${Math.min((amount / 200) * 100, 100)}%` }}
                      ></div>
                      {/* 텍스트 내용 */}
                      <span className="z-10 text-red-600 w-1/3 text-center font-medium">
                        {p.toLocaleString()}
                      </span>
                      <span className="z-10 text-gray-500 w-1/3 text-right pr-2">{amount}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. 주문 입력 영역 */}
            <div className="bg-white border-t-8 border-gray-100 pt-6">
              {/* 지정가/시장가 탭 */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                <button
                  onClick={() => setPriceType('limit')}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all btn-press ${
                    priceType === 'limit'
                      ? 'bg-white shadow text-[#191F28]'
                      : 'text-gray-400'
                  }`}
                >
                  지정가
                </button>
                <button
                  onClick={() => setPriceType('market')}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all btn-press ${
                    priceType === 'market'
                      ? 'bg-white shadow text-[#191F28]'
                      : 'text-gray-400'
                  }`}
                >
                  시장가
                </button>
              </div>

              {/* 가격 입력 (지정가일 때만 보임) */}
              {priceType === 'limit' ? (
                <div className="mb-4">
                  <label className="text-xs text-gray-500 mb-1 block">주문 가격 (500원 단위)</label>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPrice((p) => Math.max(0, p - 500))}
                      className="w-10 h-10 bg-gray-100 rounded-lg font-bold text-gray-600 active:bg-gray-200 btn-press"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={price}
                      step="500"
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        // 500원 단위로 반올림
                        const rounded = Math.round(val / 500) * 500;
                        setPrice(Math.max(0, rounded));
                      }}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        const rounded = Math.round(val / 500) * 500;
                        setPrice(Math.max(0, rounded));
                      }}
                      className="w-[120px] text-center font-bold text-lg border-b-2 border-gray-200 outline-none focus:border-black"
                    />
                    <button
                      onClick={() => setPrice((p) => p + 500)}
                      className="w-10 h-10 bg-gray-100 rounded-lg font-bold text-gray-600 active:bg-gray-200 btn-press"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 text-center py-4 bg-gray-50 rounded-lg text-gray-500 text-sm">
                  시장가로 즉시 체결됩니다.
            </div>
              )}

              {/* 수량 입력 */}
              <div className="mb-6">
                <label className="text-xs text-gray-500 mb-1 block">주문 수량</label>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 bg-gray-100 rounded-lg font-bold text-gray-600 active:bg-gray-200 btn-press"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-[120px] text-center font-bold text-lg border-b-2 border-gray-200 outline-none focus:border-black"
                  />
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 bg-gray-100 rounded-lg font-bold text-gray-600 active:bg-gray-200 btn-press"
                  >
                    +
                  </button>
                </div>
                {/* 총 예상 금액 표시 */}
                <div className="text-center mt-2 text-sm font-bold text-blue-600">
                  총 예상 금액: {priceType === 'limit' ? (price * quantity).toLocaleString() : '시장가'}원
                </div>
                  </div>

              {/* 하단 버튼 (매수/매도 분리) */}
              <div className="flex gap-3 mt-4">
                <button className="flex-1 bg-red-500 text-white py-3.5 rounded-xl font-bold shadow-lg active:scale-95 transition-transform btn-press">
                  매수하기
                </button>
                <button className="flex-1 bg-blue-500 text-white py-3.5 rounded-xl font-bold shadow-lg active:scale-95 transition-transform btn-press">
                  매도하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 시세 탭 */}
        {activeTab === 'price' && (
          <div className="px-4 py-6">
            <div className="space-y-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-3 border-b border-gray-100"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {10000 + i * 100}원
                    </div>
                    <div className="text-xs text-gray-400">14:{(30 - i).toString().padStart(2, '0')}</div>
                  </div>
                  <div className="text-sm text-red-500 font-medium">
                    +{(i * 0.5).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Chitchat (실시간 채팅) - 화면 최하단 고정, z-index 최상위 */}
      <div className="fixed bottom-0 left-0 w-full z-[100] flex flex-col bg-white border-t border-gray-200 shadow-[0_-5px_30px_rgba(0,0,0,0.15)]">
        {/* 채팅 뷰어 (20vh) */}
        <div
          ref={chatScrollRef}
          className="h-[20vh] bg-white/95 p-4 overflow-y-auto flex flex-col justify-end scrollbar-hide"
        >
          <div className="text-center text-[10px] text-gray-400 mb-1">Chitchat - 실시간 토론</div>
          {/* 채팅 메시지 (폰트 축소 및 간격 조정) */}
          <div className="space-y-1 text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!msg.isMe && (
                  <span className="font-bold text-gray-600">{msg.user}:</span>
                )}
                <span
                  className={`${
                    msg.isMe
                      ? 'bg-blue-100 px-2 py-1 rounded-lg text-blue-800'
                      : 'text-slate-900'
                  }`}
                >
                  {msg.message}
                </span>
              </div>
            ))}
          </div>
      </div>

        {/* 입력창 (종이비행기 아이콘) */}
        <div className="bg-white px-3 py-2 flex items-center gap-2 border-t border-gray-100 pb-safe">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
            placeholder="함께 토론해보세요"
            className="flex-1 bg-gray-50 text-[#333] text-sm px-4 py-2.5 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400"
          />
        <button
            onClick={handleSendChat}
            className="w-10 h-10 bg-[#3182F6] rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform btn-press"
          >
            <svg className="w-5 h-5 text-white ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
        </button>
        </div>
      </div>
    </div>
  );
}
