'use client';

import { useState } from 'react';
import { Heart, X, Camera } from 'lucide-react';

export default function DiscoveryPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  
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
    setCurrentIndex(prev => prev + 1);
    setImageError(false); // 次のカードに移るときにエラー状態をリセット
  };

  const handleDislike = () => {
    // Dislikeの処理
    setCurrentIndex(prev => prev + 1);
    setImageError(false); // 次のカードに移るときにエラー状態をリセット
  };

  const handleImageError = () => {
    setImageError(true);
    console.log("Profile image failed to load");
  };

  // 画像URLを修正する関数
  const fixImageUrl = (url: string) => {
    if (!url) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTAwIiBmb250LXNpemU9IjE4IiBmaWxsPSIjYWFhYWFhIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
    
    // URLが既に正しいかチェック
    if (url.startsWith('http') || url.startsWith('/')) {
      return url;
    }
    
    // SupabaseのストレージURLを正しく構築
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (url.includes('supabase') && !url.startsWith('http') && supabaseUrl) {
      // URLを修復
      return `${supabaseUrl}/storage/v1/object/public/${url}`;
    }
    
    return url;
  };

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-xl text-gray-600">新しいプロフィールはありません</p>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  // 安全なプレースホルダーとしてBase64 SVGを使用
  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTAwIiBmb250LXNpemU9IjE4IiBmaWxsPSIjYWFhYWFhIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

  return (
    <div className="relative h-screen bg-gray-100">
      <div className="max-w-md mx-auto h-full flex flex-col">
        <div className="relative flex-1 m-4 rounded-2xl overflow-hidden shadow-lg">
          {!imageError ? (
            <img
              src={fixImageUrl(currentProfile.image) || placeholderImage}
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
        </div>

        <div className="flex justify-center gap-8 p-6">
          <button
            onClick={handleDislike}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center"
          >
            <X className="w-8 h-8 text-red-500" />
          </button>
          <button
            onClick={handleLike}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center"
          >
            <Heart className="w-8 h-8 text-pink-500" />
          </button>
        </div>
      </div>
    </div>
  );
} 