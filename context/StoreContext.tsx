"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useAccount } from 'wagmi';

interface Holding {
  id: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  currentValue: number; // 현재 평가금액
}

interface Transaction {
  id: string;
  type: '매수' | '매도';
  name: string;
  price: number;
  qty: number;
  total: number;
  date: string; // YYYY-MM-DD HH:mm 형식
}

export interface Product {
  id: number;
  name: string;
  category: string;
  yield: string;
  price: number;
  image: string;
  description: string;
}

interface StoreContextType {
  userCash: number;
  holdings: Holding[];
  history: Transaction[];
  products: Product[];
  buyStock: (item: { name: string; price: number }, count: number) => boolean;
  sellStock: (item: { name: string; id?: string; price: number }, count: number) => boolean;
  getTotalAssets: () => number;
  getTotalReturn: () => { amount: number; rate: number };
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = 'hanbang_store';

const defaultState = {
  userCash: 10000000, // 1천만원
  holdings: [] as Holding[],
  history: [] as Transaction[],
};

// 상품 데이터 - 진실의 원천(Source of Truth)
export const products: Product[] = [
  {
    id: 1,
    name: "웹툰 <나 혼자 만렙> 지분",
    category: "웹툰",
    yield: "15.5%",
    price: 10000,
    image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=800&fit=crop",
    description: "글로벌 3억 뷰 달성 예정! 대작 웹툰의 주인이 되세요."
  },
  {
    id: 2,
    name: "드라마 <한방의 추억> OST",
    category: "드라마",
    yield: "8.2%",
    price: 15000,
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&fit=crop",
    description: "매달 꽂히는 저작권료 연금."
  },
  {
    id: 3,
    name: "유튜브 채널 <크리에이터> 수익권",
    category: "유튜브",
    yield: "20.0%",
    price: 50000,
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&fit=crop",
    description: "구독자 100만 유튜버와 함께 성장하세요."
  },
  {
    id: 4,
    name: "신인 걸그룹 <Sparkle> 데뷔",
    category: "K-POP",
    yield: "45.2%",
    price: 8000,
    image: "https://images.unsplash.com/photo-1514525253440-b393452e3383?q=80&w=800&fit=crop",
    description: "차세대 K-POP 스타의 데뷔 프로젝트."
  },
  {
    id: 5,
    name: "로맨스 판타지 <황녀의 귀환>",
    category: "웹툰",
    yield: "12.4%",
    price: 12000,
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&fit=crop",
    description: "압도적 작화, 로판 분야 1위 예상작."
  },
  {
    id: 6,
    name: "독립영화 <새벽의 질주> 배급",
    category: "영화",
    yield: "-2.1%",
    price: 55000,
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&fit=crop",
    description: "칸 영화제 초청작."
  },
  {
    id: 7,
    name: "전시회 <빛의 벙커> 지분",
    category: "전시",
    yield: "5.5%",
    price: 30000,
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&fit=crop",
    description: "제주 핫플레이스 미디어아트 전시."
  },
  {
    id: 8,
    name: "여행 유튜버 <Traveler> 채널",
    category: "유튜브",
    yield: "18.0%",
    price: 25000,
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800&fit=crop",
    description: "세계일주 콘텐츠 수익 공유."
  },
  {
    id: 9,
    name: "웹소설 <재벌집 막내> 연재",
    category: "웹소설",
    yield: "30.5%",
    price: 9000,
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&fit=crop",
    description: "드라마화 확정 원작 소설."
  },
  {
    id: 10,
    name: "뮤지컬 <영웅> 제작 투자",
    category: "공연",
    yield: "7.8%",
    price: 150000,
    image: "https://images.unsplash.com/photo-1503095392237-fa3526781538?q=80&w=800&fit=crop",
    description: "매진 행렬 뮤지컬 제작 참여."
  },
  {
    id: 11,
    name: "캐릭터 굿즈 <냥냥이> 라이선스",
    category: "굿즈",
    yield: "11.2%",
    price: 20000,
    image: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=800&fit=crop",
    description: "귀여움이 세상을 구한다."
  },
  {
    id: 12,
    name: "AI 스타트업 <Future> 엔젤투자",
    category: "스타트업",
    yield: "50.0%",
    price: 500000,
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&fit=crop",
    description: "미래 유니콘 기업 초기 투자."
  }
];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [userCash, setUserCash] = useState<number>(defaultState.userCash);
  const [holdings, setHoldings] = useState<Holding[]>(defaultState.holdings);
  const [history, setHistory] = useState<Transaction[]>(defaultState.history);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // NextAuth 세션 및 지갑 연결 상태 확인 (이 훅은 컴포넌트 내부에서만 사용 가능)
  // 하지만 Provider는 컴포넌트이므로 사용 가능
  const { data: session, status: sessionStatus } = useSession();
  const { address, isConnected } = useAccount();

  // 로그인 상태 확인 (NextAuth 세션, 지갑 연결, localStorage 모두 확인)
  // 주석 처리: 자동으로 isLoggedIn을 true로 바꾸는 로직 비활성화
  // useEffect(() => {
  //   const checkLogin = () => {
  //     if (typeof window !== 'undefined') {
  //       try {
  //         // NextAuth 세션이 있거나 지갑이 연결되어 있으면 로그인 상태
  //         const hasSession = sessionStatus === 'authenticated' && !!session;
  //         const hasWallet = isConnected && !!address;
  //         const hasLocalStorage = !!localStorage.getItem('hb_user');
  //         
  //         setIsLoggedIn(hasSession || hasWallet || hasLocalStorage);
  //       } catch (e) {
  //         console.error('Error checking login status:', e);
  //         setIsLoggedIn(false);
  //       }
  //     }
  //   };
  //   
  //   checkLogin();
  //   
  //   // storage 이벤트 리스너 (다른 탭에서의 변경 감지)
  //   const handleStorageChange = (e: StorageEvent) => {
  //     if (e.key === 'hb_user' || !e.key) {
  //       checkLogin();
  //     }
  //   };
  //   window.addEventListener('storage', handleStorageChange);
  //   
  //   // 커스텀 이벤트 리스너 (같은 탭에서 localStorage 변경 시)
  //   window.addEventListener('loginStateChange', checkLogin);
  //   
  //   return () => {
  //     window.removeEventListener('storage', handleStorageChange);
  //     window.removeEventListener('loginStateChange', checkLogin);
  //   };
  // }, [sessionStatus, session, isConnected, address]);

  // localStorage에서 데이터 로드 (로그인된 유저만)
  useEffect(() => {
    // 로그인 상태 확인
    const hasSession = sessionStatus === 'authenticated' && !!session;
    const hasWallet = isConnected && !!address;
    const hasLocalStorage = !!localStorage.getItem('hb_user');
    const isUserLoggedIn = hasSession || hasWallet || hasLocalStorage;

    if (!isUserLoggedIn) {
      // 로그인하지 않은 경우 기본값 유지
      setIsInitialized(true);
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserCash(parsed.userCash ?? parsed.cash ?? defaultState.userCash);
        setHoldings((parsed.holdings ?? []).map((h: any) => ({
          ...h,
          currentValue: (h.currentPrice || h.avgPrice) * (h.quantity || 0),
        })));
        setHistory(parsed.history ?? parsed.transactions ?? defaultState.history);
      } catch (e) {
        console.error('Failed to load store data:', e);
        // 로그인된 유저에게는 기본 자금 지급
        setUserCash(defaultState.userCash);
        setHoldings(defaultState.holdings);
        setHistory(defaultState.history);
      }
    } else {
      // 로그인된 유저에게는 기본 자금 지급 (1천만원)
      setUserCash(defaultState.userCash);
      setHoldings(defaultState.holdings);
      setHistory(defaultState.history);
    }
    setIsInitialized(true);
  }, [sessionStatus, session, isConnected, address]);

  // 데이터 변경 시 localStorage에 저장
  useEffect(() => {
    if (!isInitialized) return;
    
    const data = {
      userCash,
      holdings,
      history,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [userCash, holdings, history, isInitialized]);

  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 매수 함수: 현금 차감 -> 보유 주식 추가 (물타기 평단가 계산) -> 내역 기록
  const buyStock = (item: { name: string; price: number }, count: number): boolean => {
    const totalCost = item.price * count;
    
    // 예외 처리: 마이너스 통장 방지
    if (userCash < totalCost) {
      return false; // 예수금 부족
    }

    if (count <= 0) {
      return false; // 수량 오류
    }

    // 예수금 차감
    setUserCash(prev => prev - totalCost);

    // 보유 종목 업데이트 (물타기 평단가 계산)
    setHoldings(prev => {
      const existing = prev.find(h => h.name === item.name);
      if (existing) {
        // 기존 종목이 있으면 평균 단가 계산 (물타기)
        const existingTotalCost = existing.avgPrice * existing.quantity;
        const newTotalCost = existingTotalCost + totalCost;
        const newTotalQty = existing.quantity + count;
        const newAvgPrice = Math.round(newTotalCost / newTotalQty);
        
        return prev.map(h =>
          h.name === item.name
            ? { 
                ...h, 
                quantity: newTotalQty, 
                avgPrice: newAvgPrice, 
                currentPrice: item.price,
                currentValue: item.price * newTotalQty,
              }
            : h
        );
      } else {
        // 새 종목 추가
        return [
          ...prev,
          {
            id: `${item.name}-${Date.now()}`,
            name: item.name,
            quantity: count,
            avgPrice: item.price,
            currentPrice: item.price,
            currentValue: item.price * count,
          },
        ];
      }
    });

    // 거래 내역 추가
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}-${Math.random()}`,
      type: '매수',
      name: item.name,
      price: item.price,
      qty: count,
      total: totalCost,
      date: formatDateTime(new Date()),
    };
    setHistory(prev => [newTransaction, ...prev]);

    return true;
  };

  // 매도 함수: 보유 주식 차감 -> 현금 증가 -> 수익률 확정 -> 내역 기록
  const sellStock = (item: { name: string; id?: string; price: number }, count: number): boolean => {
    // 보유 종목 찾기 (name 또는 id로)
    const holding = holdings.find(h => 
      (item.id && h.id === item.id) || (!item.id && h.name === item.name)
    );
    
    if (!holding || holding.quantity < count) {
      return false; // 보유 수량 부족
    }

    if (count <= 0) {
      return false; // 수량 오류
    }

    const totalAmount = item.price * count;

    // 예수금 증가
    setUserCash(prev => prev + totalAmount);

    // 보유 종목 업데이트
    setHoldings(prev => {
      const updated = prev.map(h => {
        if ((item.id && h.id === item.id) || (!item.id && h.name === item.name)) {
          const newQty = h.quantity - count;
          if (newQty === 0) {
            return null; // 전량 매도
          }
          return { 
            ...h, 
            quantity: newQty, 
            currentPrice: item.price,
            currentValue: item.price * newQty,
          };
        }
        return h;
      });
      return updated.filter(h => h !== null) as Holding[];
    });

    // 거래 내역 추가
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}-${Math.random()}`,
      type: '매도',
      name: holding.name,
      price: item.price,
      qty: count,
      total: totalAmount,
      date: formatDateTime(new Date()),
    };
    setHistory(prev => [newTransaction, ...prev]);

    return true;
  };

  // 총 자산 계산
  const getTotalAssets = (): number => {
    const holdingsValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    return userCash + holdingsValue;
  };

  // 총 수익률 계산
  const getTotalReturn = (): { amount: number; rate: number } => {
    const holdingsValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const holdingsCost = holdings.reduce((sum, h) => sum + (h.avgPrice * h.quantity), 0);
    if (holdingsCost === 0) return { amount: 0, rate: 0 };
    const returnAmount = holdingsValue - holdingsCost;
    const returnRate = (returnAmount / holdingsCost) * 100;
    return { amount: returnAmount, rate: returnRate };
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const login = () => {
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
    // 로그아웃 시 관련 데이터 정리 (선택사항)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hb_user');
    }
  };

  return (
    <StoreContext.Provider
      value={{
        userCash,
        holdings,
        history,
        products,
        buyStock,
        sellStock,
        getTotalAssets,
        getTotalReturn,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        isLoggedIn,
        login,
        logout,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
