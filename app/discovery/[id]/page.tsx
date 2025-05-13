'use client';

import { useState, useEffect } from 'react';
import { Camera, ArrowLeft } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams } from 'next/navigation';
import { fixImageUrl } from '@/utils/utils';

export default function ProfileDetailPage() {
  const [profile, setProfile] = useState<any>(null);
  const [dog, setDog] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const profileId = params.id;
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        
        // プロフィール情報の取得
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();

        if (profileError) throw profileError;

        // 年齢計算
        let age = 0;
        if (profileData.date_of_birth) {
          const birthDate = new Date(profileData.date_of_birth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        // プロフィールデータを設定
        setProfile({
          ...profileData,
          age,
          name: profileData.username
        });
        
        // 犬の情報を取得
        const { data: dogsData, error: dogsError } = await supabase
          .from('dogs')
          .select('*')
          .eq('owner_id', profileId)
          .limit(1);

        if (dogsError) throw dogsError;
        
        if (dogsData && dogsData.length > 0) {
          setDog(dogsData[0]);
        }
        
      } catch (error) {
        console.error('Error fetching profile data:', error);
        // エラー発生時はダミーデータを表示（オプション）
        setProfile({
          id: profileId,
          name: 'ユーザー情報取得エラー',
          age: 0,
          avatar_url: '/placeholder-dog.jpg',
          bio: 'プロフィールを読み込めませんでした。',
          prefecture: '',
          city: '',
          gender: ''
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [profileId]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleGoBack = () => {
    router.back();
  };

  // 性別の表示を調整
  const displayGender = (gender: string) => {
    switch(gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      case 'other': return 'その他';
      default: return '';
    }
  };
  
  // 犬の性別表示
  const displayDogGender = (gender: string) => {
    switch(gender) {
      case 'male': return 'オス';
      case 'female': return 'メス';
      default: return '';
    }
  };
  
  // 犬のサイズ表示
  const displayDogSize = (size: string) => {
    switch(size) {
      case 'small': return '小型';
      case 'medium': return '中型';
      case 'large': return '大型';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 z-10 bg-white p-4 shadow-sm">
          <button 
            onClick={handleGoBack}
            className="flex items-center text-gray-700"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span>戻る</span>
          </button>
        </div>
        
        <div className="bg-white">
          {/* プロフィール画像 */}
          <div className="relative h-80">
            {!imageError ? (
              <img
                src={fixImageUrl(profile.avatar_url)}
                alt={profile.name}
                className="h-full w-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                <Camera className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* プロフィール情報 */}
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{profile.name}, {profile.age}</h1>
              <p className="text-gray-500">{profile.prefecture} {profile.city}</p>
              {profile.gender && <p className="text-gray-500">{displayGender(profile.gender)}</p>}
            </div>

            {profile.bio && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">自己紹介</h2>
                <p className="text-gray-600">{profile.bio}</p>
              </div>
            )}

            {/* 愛犬の情報 */}
            {dog && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">愛犬の情報</h2>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-4 mb-4">
                    {dog.photos_urls && dog.photos_urls.length > 0 ? (
                      <div className="relative w-20 h-20 rounded-full overflow-hidden">
                        <img
                          src={fixImageUrl(dog.photos_urls[0])}
                          alt={dog.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-xl">{dog.name}</h3>
                      <p className="text-gray-500">{dog.breed}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p>
                      <span className="font-medium">年齢：</span>
                      {dog.age_years > 0 ? `${dog.age_years}歳` : ''}
                      {dog.age_months > 0 ? `${dog.age_months}ヶ月` : ''}
                    </p>
                    <p>
                      <span className="font-medium">性別：</span>
                      {displayDogGender(dog.gender)}
                    </p>
                    <p>
                      <span className="font-medium">サイズ：</span>
                      {displayDogSize(dog.size)}
                    </p>
                    {dog.bio && <p><span className="font-medium">性格：</span>{dog.bio}</p>}
                    
                    {dog.temperament && dog.temperament.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium mb-2">特徴：</p>
                        <div className="flex flex-wrap gap-2">
                          {dog.temperament.map((trait: string, index: number) => (
                            <span 
                              key={index} 
                              className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full"
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 flex gap-4">
                      {dog.is_vaccinated && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          ワクチン接種済み
                        </span>
                      )}
                      {dog.is_neutered_spayed && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {dog.gender === 'male' ? '去勢済み' : dog.gender === 'female' ? '避妊済み' : '不妊手術済み'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="p-4 flex justify-center gap-6">
          <button 
            onClick={handleGoBack}
            className="bg-gray-200 text-gray-800 px-8 py-3 rounded-full font-bold hover:bg-gray-300 transition-colors"
          >
            戻る
          </button>
          <button 
            className="bg-pink-500 text-white px-8 py-3 rounded-full font-bold hover:bg-pink-600 transition-colors"
            onClick={() => router.push('/chat')}
          >
            メッセージを送る
          </button>
        </div>
      </div>
    </div>
  );
} 