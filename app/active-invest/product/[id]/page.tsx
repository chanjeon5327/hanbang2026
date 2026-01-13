"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Star, Share2, Plus, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '@/context/StoreContext';
import MobileProductDetail from '@/components/mobile/MobileProductDetail';
import Image from 'next/image';

export default function ProductDetail() {
  const router = useRouter();
  const params = useParams();
  const { userCash, holdings, buyStock, sellStock, isLoggedIn, openLoginModal, products } = useStore();
  
  // URL에서 id를 가져오기
  const productId = params?.id ? parseInt(params.id as string, 10) : 1;
  const product = products.find(p => p.id === productId);
  
  // 상품이 없으면 404 화면 표시
  if (!product) {
    return (
      <div className="bg-background min-h-screen pt-20 pb-32 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-foreground mb-5">상품을 찾을 수 없습니다</h1>
        <p className="text-muted-foreground mb-8">요청하신 상품 ID: {productId}</p>
        <Link href="/active-invest" className="px-6 py-3 bg-[#7c3aed] text-white rounded-lg font-bold hover:bg-[#6d28d9] transition-colors">
          전체 상품 목록으로 돌아가기
        </Link>
      </div>
    );
  }
  
  const productName = product.name;
  const productPrice = product.price;
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit'); // 지정가/시장가
  const [price, setPrice] = useState(productPrice);
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  
  // 현재 상품 보유 수량 확인
  const currentHolding = holdings.find(h => h.name === productName);
  const holdingQuantity = currentHolding?.quantity || 0;
  
  // 시장가일 때 현재가 사용
  const currentPrice = productPrice;
  const [chartData, setChartData] = useState(() => {
    const basePrice = productPrice;
    const data = Array.from({ length: 30 }, (_, i) => {
      const trend = i * 200;
      const volatility = Math.sin(i / 3) * 500;
      const calculatedPrice = Math.round(basePrice + trend + volatility);
      return {
        time: `${String(Math.floor(i / 6) + 9).padStart(2, '0')}:${String((i % 6) * 10).padStart(2, '0')}`,
        price: calculatedPrice,
      };
    });
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;
    return { data, minPrice: minPrice - padding, maxPrice: maxPrice + padding };
  });

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // productId가 변경되면 가격 업데이트
  useEffect(() => {
    if (product) {
      setPrice(product.price);
    }
  }, [productId, product]);

  const handlePrice = (delta: number) => setPrice(prev => Math.max(0, prev + delta));
  const handleQuantity = (delta: number) => setQuantity(prev => Math.max(1, prev + delta));
  
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToastMessage('주소가 복사되었습니다');
      setShowToast(true);
    } catch (err) {
      setToastMessage('복사에 실패했습니다');
      setShowToast(true);
    }
  };

  const updateChartData = () => {
    setChartData(prev => {
      const newData = [...prev.data];
      const lastPrice = newData[newData.length - 1].price;
      const variation = (Math.random() - 0.5) * 1000;
      newData.push({
        time: new Date().toTimeString().slice(0, 5),
        price: Math.max(productPrice * 0.5, Math.round(lastPrice + variation)),
      });
      const updatedData = newData.slice(-30);
      const prices = updatedData.map(d => d.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      const padding = priceRange * 0.1;
      return { 
        data: updatedData, 
        minPrice: minPrice - padding, 
        maxPrice: maxPrice + padding 
      };
    });
  };

  const handleBuy = () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    const orderPrice = orderType === 'market' ? currentPrice : price;
    const totalCost = orderPrice * quantity;
    
    if (userCash < totalCost) {
      setToastMessage('예수금이 부족합니다.');
      setShowToast(true);
      return;
    }
    
    const success = buyStock({ name: productName, price: orderPrice }, quantity);
    if (success) {
      setToastMessage(`💰 ${quantity}주 매수 체결!`);
      setShowToast(true);
      updateChartData();
      setTimeout(() => {
        router.push('/wallet');
      }, 1500);
    } else {
      setToastMessage('매수에 실패했습니다.');
      setShowToast(true);
    }
  };

  const handleSell = () => {
    if (holdingQuantity < quantity || holdingQuantity === 0) {
      setToastMessage('보유 수량이 부족합니다.');
      setShowToast(true);
      return;
    }
    
    const orderPrice = orderType === 'market' ? currentPrice : price;
    const totalAmount = orderPrice * quantity;
    const success = sellStock({ name: productName, price: orderPrice }, quantity);
    if (success) {
      const newCash = userCash + totalAmount;
      setToastMessage(`💰 매도 체결! 잔액: ${newCash.toLocaleString()}원`);
      setShowToast(true);
      updateChartData();
      } else {
      setToastMessage('매도에 실패했습니다.');
      setShowToast(true);
    }
  };

  // 호가창 데이터
  interface OrderBookItem {
    price: number;
    volume: number;
    flashType: 'buy' | 'sell' | null;
    flashTime: number;
  }

  const [orderBook, setOrderBook] = useState<{
    asks: OrderBookItem[];
    bids: OrderBookItem[];
  }>(() => {
    const basePrice = productPrice;
    const asks = Array.from({ length: 7 }, (_, i) => ({
      price: basePrice + (i + 1) * 500,
      volume: Math.floor(Math.random() * 50) + 10,
      flashType: null as 'buy' | 'sell' | null,
      flashTime: 0,
    }));
    const bids = Array.from({ length: 7 }, (_, i) => ({
      price: basePrice - (i + 1) * 500,
      volume: Math.floor(Math.random() * 50) + 10,
      flashType: null as 'buy' | 'sell' | null,
      flashTime: 0,
    }));
    return { asks, bids };
  });

  const [priceFlash, setPriceFlash] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  // 실시간 체결 시뮬레이션
  useEffect(() => {
    const simulateTrade = () => {
      const isBuy = Math.random() > 0.5;
      const side = isBuy ? 'bids' : 'asks';
      
      setOrderBook(prev => {
        const newOrderBook = { ...prev };
        const newSide = [...newOrderBook[side]];
        const index = Math.floor(Math.random() * newSide.length);
        const item = { ...newSide[index] };
        
        const volumeChange = Math.floor(Math.random() * 5) + 1;
        item.volume = Math.max(5, item.volume + (isBuy ? -volumeChange : volumeChange));
        
        item.flashType = isBuy ? 'buy' : 'sell';
        item.flashTime = Date.now();
        
        newSide[index] = item;
        newOrderBook[side] = newSide;
        
        if (index === 0 || Math.random() > 0.7) {
          setPriceFlash(true);
          setTimeout(() => setPriceFlash(false), 300);
        }
        
        return newOrderBook;
      });
      setRenderKey(prev => prev + 1);
    };

    const getNextInterval = () => 300 + Math.random() * 500;
    let timeoutId: NodeJS.Timeout;
    
    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        simulateTrade();
        scheduleNext();
      }, getNextInterval());
    };
    
    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, []);

  // 번쩍임 효과 자동 제거
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setOrderBook(prev => {
        let needsUpdate = false;
        const checkFlash = (item: OrderBookItem) => {
          if (item.flashTime && (now - item.flashTime) >= 300) {
            needsUpdate = true;
            return { ...item, flashType: null };
          }
          return item;
        };
        const newAsks = prev.asks.map(checkFlash);
        const newBids = prev.bids.map(checkFlash);
        
        if (needsUpdate) {
          // @ts-ignore
          return { asks: newAsks, bids: newBids };
        }
        return prev;
      });
      setRenderKey(prev => prev + 1);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setOrderBook(prev => {
      const basePrice = price;
      const generateItems = (isAsk: boolean) => Array.from({ length: 7 }, (_, i) => {
        const targetPrice = isAsk ? basePrice + (i + 1) * 500 : basePrice - (i + 1) * 500;
        const existing = (isAsk ? prev.asks : prev.bids).find(item => Math.abs(item.price - targetPrice) < 100);
        return {
          price: targetPrice,
          volume: existing?.volume || Math.floor(Math.random() * 50) + 10,
          flashType: null as 'buy' | 'sell' | null,
          flashTime: 0,
        };
      });
      return { asks: generateItems(true), bids: generateItems(false) };
    });
  }, [price]);

  return (
    <>
      {/* 모바일 전용 */}
      <div className="block md:hidden">
        <MobileProductDetail id={productId.toString()} />
      </div>

      {/* PC 버전 */}
      <div className="hidden md:block bg-background min-h-screen pb-32 flex flex-col relative">
      
      {showToast && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000,
          backgroundColor: 'var(--card-bg)', padding: '12px 24px', borderRadius: '12px',
          border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          color: 'var(--text-primary)', fontWeight: 'bold', animation: 'popUp 0.4s ease-out'
        }}>
          {toastMessage}
        </div>
      )}
      
      <div className="flex-1 mt-20 p-5 max-w-[1600px] mx-auto w-full">
        
        {/* 대표 이미지 */}
        <div className="w-full h-[400px] bg-black rounded-xl mb-5 overflow-hidden relative group">
          <Image 
            src={product?.image || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1000"} 
            alt={productName}
            fill
            className="object-cover"
          />
          <div className="absolute top-5 right-5 flex gap-4 items-center z-10">
            <button onClick={() => setIsStarred(!isStarred)} className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition">
                <Star size={24} fill={isStarred ? '#fbbf24' : 'none'} color={isStarred ? '#fbbf24' : 'white'} />
            </button>
            <button onClick={handleShare} className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition">
                <Share2 size={24} color="white" />
            </button>
          </div>
          <div className="absolute bottom-5 left-5 z-10">
            <h1 className="text-4xl font-bold text-white drop-shadow-md">{productName}</h1>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        </div>

        {/* 메인 레이아웃 (차트 + 주문) */}
        <div className="flex gap-5 items-start">
            
            {/* 차트 영역 */}
            <div className="flex-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-4 h-[600px] flex flex-col">
                <div className="text-center text-[var(--text-secondary)] mb-2 text-xs font-bold">가격 차트</div>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--up-color)" stopOpacity={1}/>
                          <stop offset="50%" stopColor="var(--up-color)" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="var(--up-color)" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="time" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--border-color)" />
                      <YAxis domain={[chartData.minPrice, chartData.maxPrice]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} stroke="var(--border-color)" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        formatter={(value: any) => [value.toLocaleString(), '가격']}
                      />
                      <Area type="monotone" dataKey="price" stroke="var(--up-color)" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
            </div>

            {/* 우측 사이드바: 호가창 + 주문 패널 */}
            <div className="w-[360px] flex flex-col gap-4">
                
                {/* 주문 패널 */}
                <div className="bg-[var(--bg-secondary)] p-5 rounded-xl border border-[var(--border-color)]">
                    {/* 탭 */}
                    <div className="flex gap-2 mb-5 bg-[var(--bg-primary)] p-1 rounded-lg">
                        <button onClick={() => setOrderType('limit')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${orderType === 'limit' ? 'bg-[#7c3aed] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-white/10'}`}>
                            지정가
                        </button>
                        <button onClick={() => setOrderType('market')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${orderType === 'market' ? 'bg-[#7c3aed] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-white/10'}`}>
                            시장가
                        </button>
                    </div>

                    {/* 가격 입력 */}
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[var(--text-primary)]">가격</span>
                        {orderType === 'market' ? (
                            <div className="text-right">
                                <div className="text-lg font-bold text-[var(--text-primary)]">{currentPrice.toLocaleString()}</div>
                                <div className="text-xs text-[var(--text-muted)]">현재가 즉시 체결</div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button onClick={() => handlePrice(-500)} className="p-1 rounded bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                                    <Minus size={16} />
                                </button>
                                <span className="text-lg font-bold text-[var(--text-primary)] w-24 text-center">{price.toLocaleString()}</span>
                                <button onClick={() => handlePrice(500)} className="p-1 rounded bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                                    <Plus size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 수량 입력 */}
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[var(--text-primary)]">수량</span>
                        <div className="flex items-center gap-2">
                             <button onClick={() => handleQuantity(-1)} className="p-1 rounded bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                                <Minus size={16} />
                            </button>
                            <span className="text-lg font-bold text-[var(--text-primary)] w-20 text-center">{quantity}주</span>
                            <button onClick={() => handleQuantity(1)} className="p-1 rounded bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    {/* 총액 */}
                    <div className="bg-[var(--bg-primary)] p-3 rounded-lg flex justify-between items-center mb-4">
                        <span className="text-xs text-[var(--text-secondary)]">총 주문금액</span>
                        <span className="text-lg font-bold text-[var(--text-primary)]">
                            {((orderType === 'market' ? currentPrice : price) * quantity).toLocaleString()}원
                        </span>
                    </div>

                    {/* 주문 버튼 */}
                    <div className="flex gap-3">
                         <button 
                            onClick={handleBuy} 
                            disabled={isLoggedIn && userCash < (orderType === 'market' ? currentPrice : price) * quantity}
                            className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${isLoggedIn && userCash < (orderType === 'market' ? currentPrice : price) * quantity ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#ef4444] hover:bg-red-600 active:scale-95'}`}
                         >
                            매수
                         </button>
                         <button 
                            onClick={handleSell} 
                            disabled={holdingQuantity < quantity || holdingQuantity === 0}
                            className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${holdingQuantity < quantity || holdingQuantity === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3b82f6] hover:bg-blue-600 active:scale-95'}`}
                         >
                            매도
                         </button>
                    </div>
                </div>

                {/* 호가창 */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-3 flex gap-2 h-[300px]">
                    {/* 매수 잔량 (빨강) */}
                    <div className="flex-1 flex flex-col gap-1">
                        <div className="text-center text-xs text-[var(--text-secondary)] mb-1">매수</div>
                        {orderBook.bids.map((item, i) => {
                             const max = Math.max(...orderBook.bids.map(b => b.volume), ...orderBook.asks.map(a => a.volume), 1);
                             const width = (item.volume / max) * 100;
                             const isFlash = item.flashType === 'buy' && item.flashTime && (Date.now() - item.flashTime) < 300;
                             return (
                                 <div key={i} className={`relative h-6 flex items-center justify-between px-2 rounded overflow-hidden ${isFlash ? 'bg-red-500/30' : 'bg-red-500/10'}`}>
                                     <div className="absolute right-0 top-0 bottom-0 bg-red-500/20 transition-all" style={{ width: `${width}%` }} />
                                     <span className="relative z-10 text-xs font-bold text-[#ef4444]">{item.price.toLocaleString()}</span>
                                     <span className="relative z-10 text-[10px] text-[#ef4444]">{item.volume}</span>
                                 </div>
                             )
                        })}
                    </div>
                    {/* 매도 잔량 (파랑) */}
                    <div className="flex-1 flex flex-col gap-1">
                        <div className="text-center text-xs text-[var(--text-secondary)] mb-1">매도</div>
                        {orderBook.asks.map((item, i) => {
                             const max = Math.max(...orderBook.bids.map(b => b.volume), ...orderBook.asks.map(a => a.volume), 1);
                             const width = (item.volume / max) * 100;
                             const isFlash = item.flashType === 'sell' && item.flashTime && (Date.now() - item.flashTime) < 300;
                             return (
                                 <div key={i} className={`relative h-6 flex items-center justify-between px-2 rounded overflow-hidden ${isFlash ? 'bg-blue-500/30' : 'bg-blue-500/10'}`}>
                                     <div className="absolute left-0 top-0 bottom-0 bg-blue-500/20 transition-all" style={{ width: `${width}%` }} />
                                     <span className="relative z-10 text-[10px] text-[#3b82f6]">{item.volume}</span>
                                     <span className="relative z-10 text-xs font-bold text-[#3b82f6]">{item.price.toLocaleString()}</span>
                                 </div>
                             )
                        })}
                    </div>
                </div>

            </div>
        </div>
      </div>

      {/* PC 전용 고정 채팅창 (우측 하단) */}
      <div className="hidden md:block w-full max-w-[320px] fixed right-10 bottom-10 z-50">
             <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <div className="bg-[#7c3aed] p-3 text-white font-bold flex justify-between items-center shadow-md">
                   <span className="flex items-center gap-2 text-sm">💬 투자자 토론방</span>
                   <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">342명</span>
                </div>
                
                <div className="h-[320px] overflow-y-auto p-3 bg-gray-50 space-y-3 scrollbar-thin scrollbar-thumb-gray-200">
                   <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex-shrink-0" />
                      <div className="bg-white p-2 rounded-lg rounded-tl-none shadow-sm text-xs border border-gray-100 text-gray-700">
                         이거 진짜 오나요? 수익률 대박이네
                      </div>
                   </div>
                   <div className="flex gap-2 flex-row-reverse">
                      <div className="w-7 h-7 rounded-full bg-[#7c3aed] flex-shrink-0" />
                      <div className="bg-[#7c3aed] text-white p-2 rounded-lg rounded-tr-none shadow-sm text-xs">
                         저도 방금 100주 추매했습니다 ㅋㅋ
                      </div>
                   </div>
                </div>

                <div className="p-2 border-t bg-white flex gap-2">
                   <input 
                     type="text" 
                     placeholder="채팅 입력..."
                     className="flex-1 px-3 py-1.5 border rounded-full text-xs focus:outline-none focus:border-[#7c3aed] bg-gray-50"
                   />
                   <button className="bg-[#7c3aed] text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#6d28d9] transition-colors">
                     전송
                   </button>
                </div>
             </div>
      </div>

      </div>
    </>
  );
}