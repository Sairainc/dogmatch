'use client';

import { useState, useRef } from 'react';
import { Heart, X, Camera } from 'lucide-react';
import { fixImageUrl } from '@/utils/utils';
import { useRouter } from 'next/navigation';
import { useSwipeable } from 'react-swipeable';

export default function DiscoveryPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [swipePosition, setSwipePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // ダミーデータ
  const profiles = [
    {
      id: 1,
      name: '太郎',
      age: 28,
      dogName: 'ポチ',
      dogBreed: '柴犬',
      image: '/placeholder-dog.jpg',
      bio: '柴犬のポチと一緒に暮らしています。散歩が大好きです！'
    },
    // 他のプロフィールデータ...
  ];

  const handleLike = () => {
    // Likeの処理
    animateSwipe('right');
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      resetSwipeState();
    }, 300);
  };

  const handleDislike = () => {
    // Dislikeの処理
    animateSwipe('left');
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      resetSwipeState();
    }, 300);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCardClick = () => {
    // カードがタップされたら詳細ページに遷移
    if (currentIndex < profiles.length && !swipeDirection) {
      router.push(`/discovery/${profiles[currentIndex].id}`);
    }
  };

  // スワイプ状態をリセット
  const resetSwipeState = () => {
    setSwipeDirection(null);
    setSwipePosition({ x: 0, y: 0 });
    setImageError(false);
  };

  // スワイプアニメーション
  const animateSwipe = (direction: string) => {
    setSwipeDirection(direction);
    if (direction === 'right') {
      setSwipePosition({ x: 1500, y: 0 });
    } else if (direction === 'left') {
      setSwipePosition({ x: -1500, y: 0 });
    }
  };

  // スワイプハンドラー
  const swipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      // スワイプ中の位置を更新
      setSwipePosition({ 
        x: eventData.deltaX, 
        y: Math.min(Math.max(eventData.deltaY, -100), 100) // Y軸の移動を制限
      });
    },
    onSwipedLeft: () => {
      // 左スワイプ（Dislike）
      if (Math.abs(swipePosition.x) > 100) {
        handleDislike();
      } else {
        resetSwipeState();
      }
    },
    onSwipedRight: () => {
      // 右スワイプ（Like）
      if (Math.abs(swipePosition.x) > 100) {
        handleLike();
      } else {
        resetSwipeState();
      }
    },
    onSwipedDown: () => {
      // スワイプキャンセル
      resetSwipeState();
    },
    onSwipedUp: () => {
      // スワイプキャンセル
      resetSwipeState();
    },
    trackMouse: true,
    delta: 10,
  });

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-xl text-gray-600">新しいプロフィールはありません</p>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  // スワイプ角度に基づいた回転
  const rotationAngle = swipePosition.x * 0.1; // X位置に基づいて回転
  const cardStyle = {
    transform: `translate(${swipePosition.x}px, ${swipePosition.y}px) rotate(${rotationAngle}deg)`,
    transition: swipeDirection ? 'transform 0.3s ease' : 'none',
    zIndex: 10,
  };

  // スワイプ方向によるオーバーレイの表示
  const showLikeOverlay = swipePosition.x > 50;
  const showDislikeOverlay = swipePosition.x < -50;

  return (
    <div className="relative h-screen bg-gray-100">
      <div className="max-w-md mx-auto h-full flex flex-col">
        <div 
          className="relative flex-1 m-4 rounded-2xl overflow-hidden shadow-lg cursor-pointer"
          onClick={handleCardClick}
          style={cardStyle}
          {...swipeHandlers}
        >
          {!imageError ? (
            <img
              src={fixImageUrl(currentProfile.image)}
              alt={currentProfile.dogName}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center">
              <Camera className="w-16 h-16 text-gray-400 mb-2" />
              <p className="text-gray-500">画像を読み込めませんでした</p>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
            <h2 className="text-2xl font-bold">{currentProfile.name}, {currentProfile.age}</h2>
            <p className="text-lg">{currentProfile.dogName} ({currentProfile.dogBreed})</p>
            <p className="mt-2">{currentProfile.bio}</p>
          </div>
          
          {/* Like オーバーレイ */}
          {showLikeOverlay && (
            <div className="absolute top-10 right-10 transform rotate-12 border-4 border-green-500 text-green-500 text-2xl font-bold px-4 py-2 rounded-lg">
              LIKE
            </div>
          )}
          
          {/* Dislike オーバーレイ */}
          {showDislikeOverlay && (
            <div className="absolute top-10 left-10 transform -rotate-12 border-4 border-red-500 text-red-500 text-2xl font-bold px-4 py-2 rounded-lg">
              NOPE
            </div>
          )}
        </div>

        <div className="flex justify-center gap-16 py-2 mb-20">
          <button
            onClick={handleDislike}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center"
            aria-label="Dislike"
          >
            <X className="w-7 h-7 text-red-500" />
          </button>
          <button
            onClick={handleLike}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center"
            aria-label="Like"
          >
            <Heart className="w-7 h-7 text-pink-500" />
          </button>
        </div>
      </div>
    </div>
  );
} 