"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Share2, Send, Plus, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../../../context/StoreContext';
import { LiveChat } from '@/components/LiveChat';

export default function ProductDetail({ params }: { params?: { id?: string } }) {
  const router = useRouter();
  const { userCash, holdings, buyStock, sellStock, isLoggedIn, openLoginModal, products } = useStore();
  
  // URL에서 id를 가져오거나 기본값 사용
  const productId = typeof window !== 'undefined' 
    ? parseInt(window.location.pathname.split('/').pop() || '1', 10)
    : (params?.id ? parseInt(params.id, 10) : 1);
  
  const product = products.find(p => p.id === productId) || products[0];
  const productName = product?.name || '오징어게임2 펀드';
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit'); // 지정가/시장가
  const [price, setPrice] = useState(product?.price || 35000);
  const [quantity, setQuantity] = useState(1);
  const [chat, setChat] = useState('');
  const [msgs, setMsgs] = useState([{ id: 'user1', text: '이거 진짜 오나요?', time: '14:20' }]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  
  // 현재 상품 보유 수량 확인
  const currentHolding = holdings.find(h => h.name === productName);
  const holdingQuantity = currentHolding?.quantity || 0;
  
  // 시장가일 때 현재가 사용
  const currentPrice = price; // 실제로는 실시간 가격을 가져와야 함
  const [chartData, setChartData] = useState(() => {
    const basePrice = 30000;
    const data = Array.from({ length: 30 }, (_, i) => {
      const trend = i * 200;
      const volatility = Math.sin(i / 3) * 500;
      const calculatedPrice = Math.round(basePrice + trend + volatility);
      return {
        time: `${String(Math.floor(i / 6) + 9).padStart(2, '0')}:${String((i % 6) * 10).padStart(2, '0')}`,
        price: calculatedPrice,
      };
    });
    // 데이터 범위를 최적화하여 차트가 꽉 차게
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    // 차트가 비어 보이지 않도록 범위 확장
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1; // 10% 패딩
    return { data, minPrice: minPrice - padding, maxPrice: maxPrice + padding };
  });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handlePrice = (delta: number) => setPrice(prev => Math.max(0, prev + delta));
  const handleQuantity = (delta: number) => setQuantity(prev => Math.max(1, prev + delta));
  
  const sendChat = () => {
    if(!chat) return;
    setMsgs([...msgs, { id: '나', text: chat, time: new Date().toTimeString().slice(0,5) }]);
    setChat('');
  };

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
      const variation = (Math.random() - 0.5) * 1000; // -500 ~ +500 변동
      newData.push({
        time: new Date().toTimeString().slice(0, 5),
        price: Math.max(30000, Math.round(lastPrice + variation)),
      });
      const updatedData = newData.slice(-30); // 최근 30개만 유지
      // 데이터 범위 재계산
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
    // Case A: 비회원일 때 - 로그인 모달 띄우기
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    // Case B: 회원일 때 - 매수 로직 수행
    const orderPrice = orderType === 'market' ? currentPrice : price;
    const totalCost = orderPrice * quantity;
    
    if (userCash < totalCost) {
      setToastMessage('예수금이 부족합니다.');
      setShowToast(true);
      return;
    }
    
    const success = buyStock({ name: productName, price: orderPrice }, quantity);
    if (success) {
      // 매수 성공 메시지
      setToastMessage(`💰 ${quantity}주 매수 체결!`);
      setShowToast(true);
      updateChartData();
      
      // 1.5초 후 지갑 페이지로 이동
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

  // 호가창 데이터 구조 (가격, 수량, 번쩍임 상태)
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
    const basePrice = price;
    const asks = Array.from({ length: 7 }, (_, i) => ({
      price: basePrice + (i + 1) * 500,
      volume: Math.floor(Math.random() * 50) + 10, // 10~60
      flashType: null as 'buy' | 'sell' | null,
      flashTime: 0,
    }));
    const bids = Array.from({ length: 7 }, (_, i) => ({
      price: basePrice - (i + 1) * 500,
      volume: Math.floor(Math.random() * 50) + 10, // 10~60
      flashType: null as 'buy' | 'sell' | null,
      flashTime: 0,
    }));
    return { asks, bids };
  });

  const [priceFlash, setPriceFlash] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // 강제 리렌더링용

  // 실시간 체결 시뮬레이션
  useEffect(() => {
    const simulateTrade = () => {
      const isBuy = Math.random() > 0.5; // 50% 확률로 매수/매도
      const side = isBuy ? 'bids' : 'asks';
      
      setOrderBook(prev => {
        const newOrderBook = { ...prev };
        const newSide = [...newOrderBook[side]];
        const index = Math.floor(Math.random() * newSide.length);
        const item = { ...newSide[index] };
        
        // 수량 변화 (1~5 감소 또는 증가)
        const volumeChange = Math.floor(Math.random() * 5) + 1;
        item.volume = Math.max(5, item.volume + (isBuy ? -volumeChange : volumeChange));
        
        // 번쩍임 효과
        item.flashType = isBuy ? 'buy' : 'sell';
        item.flashTime = Date.now();
        
        newSide[index] = item;
        newOrderBook[side] = newSide;
        
        // 현재가 번쩍임 효과 (30% 확률 또는 첫 번째 가격대일 때)
        if (index === 0 || Math.random() > 0.7) {
          setPriceFlash(true);
          setTimeout(() => setPriceFlash(false), 300);
        }
        
        return newOrderBook;
      });
      
      // 강제 리렌더링으로 번쩍임 효과 표시
      setRenderKey(prev => prev + 1);
    };

    // 0.3~0.8초 간격으로 랜덤 체결
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
  }, []); // 의존성 제거하여 무한 루프 방지

  // 번쩍임 효과 자동 제거 및 실시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setOrderBook(prev => {
        let needsUpdate = false;
        const newAsks = prev.asks.map(item => {
          if (item.flashTime && (now - item.flashTime) >= 300) {
            needsUpdate = true;
            return { ...item, flashType: null };
          }
          return item;
        });
        const newBids = prev.bids.map(item => {
          if (item.flashTime && (now - item.flashTime) >= 300) {
            needsUpdate = true;
            return { ...item, flashType: null };
          }
          return item;
        });
        
        if (needsUpdate) {
          return { asks: newAsks, bids: newBids };
        }
        return prev;
      });
      
      // 강제 리렌더링으로 실시간 번쩍임 효과 표시
      setRenderKey(prev => prev + 1);
    }, 50); // 50ms마다 체크하여 부드러운 애니메이션

    return () => clearInterval(interval);
  }, []);

  // 가격이 변경되면 호가창도 업데이트
  useEffect(() => {
    setOrderBook(prev => {
      const basePrice = price;
      const asks = Array.from({ length: 7 }, (_, i) => {
        const existingAsk = prev.asks.find(a => Math.abs(a.price - (basePrice + (i + 1) * 500)) < 100);
        return {
          price: basePrice + (i + 1) * 500,
          volume: existingAsk?.volume || Math.floor(Math.random() * 50) + 10,
          flashType: null as 'buy' | 'sell' | null,
          flashTime: 0,
        };
      });
      const bids = Array.from({ length: 7 }, (_, i) => {
        const existingBid = prev.bids.find(b => Math.abs(b.price - (basePrice - (i + 1) * 500)) < 100);
        return {
          price: basePrice - (i + 1) * 500,
          volume: existingBid?.volume || Math.floor(Math.random() * 50) + 10,
          flashType: null as 'buy' | 'sell' | null,
          flashTime: 0,
        };
      });
      return { asks, bids };
    });
  }, [price]);

  return (
    <div className="bg-background" style={{ paddingBottom: '120px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          backgroundColor: 'var(--card-bg)',
          padding: '12px 24px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          color: 'var(--text-primary)',
          fontWeight: 'bold',
          animation: 'popUp 0.4s ease-out'
        }}>
          {toastMessage}
        </div>
      )}
      
      <div style={{ flex: 1, marginTop: '80px', display: 'flex', flexDirection: 'column', padding: '20px', paddingBottom: '120px', maxWidth: '1600px', margin: '80px auto 0', width: '100%' }}>
        
        {/* 고화질 대표 이미지 */}
        <div style={{ width: '100%', height: '400px', backgroundColor: '#000000', borderRadius: '24px', marginBottom: '20px', overflow: 'hidden', position: 'relative', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)' }}>
          <img 
            src={product?.image || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1000"} 
            alt={productName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Star 
              size={24} 
              style={{ cursor: 'pointer' }} 
              fill={isStarred ? '#fbbf24' : 'none'}
              color={isStarred ? '#fbbf24' : 'white'}
              onClick={() => setIsStarred(!isStarred)}
            />
            <Share2 
              size={24} 
              style={{ cursor: 'pointer', color: 'white' }}
              onClick={handleShare}
            />
          </div>
          <div style={{ position: 'absolute', bottom: '20px', left: '20px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{productName}</h1>
          </div>
        </div>

        {/* 2단 레이아웃: 좌측 70% (차트+주문+호가창), 우측 30% (채팅) */}
        <div style={{ display: 'grid', gridTemplateColumns: '70% 30%', gap: '20px', width: '100%', alignItems: 'flex-start' }}>
          {/* 좌측 컬럼 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 차트 및 주문 패널 - 가로 배치 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', width: '100%' }}>
          {/* 차트 영역 */}
          <div style={{ 
            border: 'none', 
            borderRadius: '24px', 
            padding: '20px', 
            backgroundColor: 'var(--card-bg)',
            height: '400px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '12px', fontWeight: 'bold' }}>가격 차트</div>
            <div style={{ flex: 1, minHeight: '350px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--up-color)" stopOpacity={1}/>
                      <stop offset="50%" stopColor="var(--up-color)" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="var(--up-color)" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fill: '#6B7684', fontSize: 10, fontWeight: 500 }}
                    stroke="#E5E7EB"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7684', fontSize: 10, fontWeight: 500 }}
                    stroke="#E5E7EB"
                    domain={[chartData.minPrice, chartData.maxPrice]}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: 'none', 
                      borderRadius: '16px', 
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                      color: '#191F28',
                      fontWeight: 500
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card-bg)', 
                      border: '1px solid var(--border-color)',
                  borderRadius: '8px', 
                      color: 'var(--text-primary)',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                    formatter={(value: any) => [value.toLocaleString(), '가격']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="var(--up-color)" 
                    fillOpacity={1} 
                    fill="url(#colorPrice)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            </div>

          {/* 주문 패널 */}
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '24px', borderRadius: '24px', width: '320px', flexShrink: 0, boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)' }}>
            {/* 지정가/시장가 탭 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: '#F9FAFB', padding: '4px', borderRadius: '12px' }}>
              <button 
                onClick={() => setOrderType('limit')}
                style={{ 
                  flex: 1, 
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: orderType === 'limit' ? 'var(--accent-color)' : 'transparent',
                  color: orderType === 'limit' ? 'white' : 'var(--text-primary)',
                  fontWeight: orderType === 'limit' ? '600' : '500',
                  border: 'none', 
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                지정가
              </button>
              <button 
                onClick={() => setOrderType('market')}
                style={{ 
                  flex: 1, 
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: orderType === 'market' ? 'var(--accent-color)' : 'transparent',
                  color: orderType === 'market' ? 'white' : 'var(--text-primary)',
                  fontWeight: orderType === 'market' ? '600' : '500',
                  border: 'none', 
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                시장가
              </button>
            </div>

            {/* 주문단가 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', minHeight: '40px', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)' }}>주문단가</span>
              {orderType === 'market' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '120px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', fontSize: '16px' }}>{currentPrice.toLocaleString()}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>현재가로 즉시 체결</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => handlePrice(-500)} 
                    disabled={false}
                    style={{ 
                      padding: '5px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}
                  >
                    <Minus size={16} color="var(--text-primary)" />
                  </button>
                  <span style={{ fontWeight: 'bold', minWidth: '100px', textAlign: 'center', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', fontSize: '16px' }}>{price.toLocaleString()}</span>
                  <button 
                    onClick={() => handlePrice(500)} 
                    style={{ 
                      padding: '5px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}
                  >
                    <Plus size={16} color="var(--text-primary)" />
                  </button>
                </div>
              )}
              </div>

            {/* 수량 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', minHeight: '40px', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)' }}>수량</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '140px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleQuantity(-1)} 
                  style={{ 
                    padding: '5px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}
                >
                  <Minus size={16} color="var(--text-primary)" />
                </button>
                <span style={{ fontWeight: 'bold', minWidth: '80px', textAlign: 'center', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', fontSize: '16px' }}>{quantity} 주</span>
                <button 
                  onClick={() => handleQuantity(1)} 
                  style={{ 
                    padding: '5px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}
                >
                  <Plus size={16} color="var(--text-primary)" />
                </button>
              </div>
            </div>

            {/* 주문 가능 금액 표시 */}
            <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', textAlign: 'center', minHeight: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>주문 가능 금액</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>{userCash.toLocaleString()}원</div>
            </div>

            {/* 총 주문금액 */}
            <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', textAlign: 'center', minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>총 주문금액: </span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '16px', fontVariantNumeric: 'tabular-nums' }}>
                {((orderType === 'market' ? currentPrice : price) * quantity).toLocaleString()}원
              </span>
            </div>

            {/* 보유 수량 */}
            {holdingQuantity > 0 && (
              <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', textAlign: 'center', minHeight: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>보유 수량</div>
                <div style={{ color: 'var(--down-color)', fontWeight: 'bold', fontSize: '14px', fontVariantNumeric: 'tabular-nums' }}>{holdingQuantity}주</div>
              </div>
            )}

            {/* 매수/매도 버튼 */}
            <div style={{ display: 'flex', gap: '10px' }}>
            <button 
                onClick={handleBuy} 
                disabled={isLoggedIn && userCash < (orderType === 'market' ? currentPrice : price) * quantity}
              style={{ 
                  flex: 1, 
                  padding: '15px', 
                  backgroundColor: (isLoggedIn && userCash < (orderType === 'market' ? currentPrice : price) * quantity) ? 'var(--text-muted)' : 'var(--up-color)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: 'bold', 
                  fontSize: '16px', 
                  cursor: (isLoggedIn && userCash < (orderType === 'market' ? currentPrice : price) * quantity) ? 'not-allowed' : 'pointer',
                  opacity: (isLoggedIn && userCash < (orderType === 'market' ? currentPrice : price) * quantity) ? 0.5 : 1,
                }}
              >
                매수
            </button>
              <button 
                onClick={handleSell} 
                disabled={holdingQuantity < quantity || holdingQuantity === 0}
                style={{ 
                  flex: 1, 
                  padding: '15px', 
                  backgroundColor: (holdingQuantity < quantity || holdingQuantity === 0) ? 'var(--text-muted)' : 'var(--down-color)', 
                  color: 'white',
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 'bold', 
                  fontSize: '16px', 
                  cursor: (holdingQuantity < quantity || holdingQuantity === 0) ? 'not-allowed' : 'pointer',
                  opacity: (holdingQuantity < quantity || holdingQuantity === 0) ? 0.5 : 1,
                }}
              >
                매도
              </button>
            </div>
          </div>
        </div>

            {/* 호가창 - 좌우 레이아웃 (매수/매도 각 7줄) - 높이 축소 */}
            <div style={{ 
              border: '1px solid var(--border-color)', 
              borderRadius: '12px', 
              padding: '12px', 
              backgroundColor: 'var(--card-bg)',
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              gap: '12px',
              height: '300px'
            }}>
          {/* 좌측: 매수 잔량 (빨간색) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>매수</div>
            {orderBook.bids.map((item) => {
              const maxVolume = Math.max(...orderBook.asks.map(a => a.volume), ...orderBook.bids.map(b => b.volume), 1);
              const barWidth = maxVolume > 0 ? (item.volume / maxVolume) * 100 : 0;
              const now = Date.now();
              const isFlashing = item.flashType === 'buy' && item.flashTime && (now - item.flashTime) < 300;
              const flashColor = 'rgba(239, 68, 68, 0.8)';

              return (
                <div 
                  key={`bid-${item.price}-${renderKey}`}
                  style={{ 
                    position: 'relative',
                    marginBottom: '2px',
                    minHeight: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background-color 0.3s ease-out',
                    backgroundColor: isFlashing ? flashColor : 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '4px',
                    padding: '2px 8px'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 0, 
                    bottom: 0,
                    width: `${barWidth}%`,
                    backgroundColor: 'rgba(239, 68, 68, 0.3)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease-out',
                  }} />
                  <div style={{ 
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <span style={{ 
                      color: 'var(--up-color)', 
                      fontSize: '13px',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 'bold'
                    }}>
                      {item.price.toLocaleString()}
                    </span>
                    <span style={{ 
                      color: 'var(--up-color)', 
                      fontSize: '11px',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: '500'
                    }}>
                      {item.volume}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 중앙: 현재가 */}
          <div style={{ 
            minWidth: '140px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderLeft: '2px solid var(--border-color)',
            borderRight: '2px solid var(--border-color)',
            padding: '0 16px'
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold' }}>현재가</div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
              transform: priceFlash ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              {price.toLocaleString()}
            </div>
          </div>

          {/* 우측: 매도 잔량 (파란색) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>매도</div>
            {orderBook.asks.map((item, idx) => {
              const maxVolume = Math.max(...orderBook.asks.map(a => a.volume), ...orderBook.bids.map(b => b.volume), 1);
              const barWidth = maxVolume > 0 ? (item.volume / maxVolume) * 100 : 0;
              const now = Date.now();
              const isFlashing = item.flashType === 'sell' && item.flashTime && (now - item.flashTime) < 300;
              const flashColor = 'rgba(59, 130, 246, 0.8)';
              
              return (
                <div 
                  key={`ask-${item.price}-${renderKey}`}
                  style={{
                    position: 'relative',
                    marginBottom: '2px',
                    minHeight: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background-color 0.3s ease-out',
                    backgroundColor: isFlashing ? flashColor : 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '4px',
                    padding: '2px 8px'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${barWidth}%`,
                    backgroundColor: 'rgba(59, 130, 246, 0.3)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease-out',
                  }} />
                  <div style={{ 
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: 'var(--down-color)', 
                      fontSize: '11px',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: '500'
                    }}>
                      {item.volume}
                    </span>
                    <span style={{ 
                      color: 'var(--down-color)', 
                      fontSize: '13px',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 'bold'
                    }}>
                      {item.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          </div>

          {/* 우측 컬럼 - 채팅창 (Sticky) */}
          <div style={{ position: 'sticky', top: '100px', height: 'calc(100vh - 120px)', maxHeight: '800px' }}>
            <LiveChat />
          </div>
        </div>
      </div>
    </div>
  );
}
