'use client';

import { useState, useEffect } from 'react';
import { Camera, Edit2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { fixImageUrl } from '@/utils/utils';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    username: '',
    date_of_birth: '',
    age: 0,
    gender: '',
    prefecture: '',
    city: '',
    bio: '',
    avatar_url: '/placeholder-dog.jpg',
  });
  
  const [dogs, setDogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [dogPhotoErrors, setDogPhotoErrors] = useState<{[key: string]: boolean}>({});
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/sign-in');
          return;
        }

        // プロフィール情報の取得
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // 画像URLをデバッグ
        let debug = `Avatar URL: ${profileData.avatar_url}\n`;
        console.log('Avatar URL:', profileData.avatar_url);

        // 犬の情報を取得
        const { data: dogsData, error: dogsError } = await supabase
          .from('dogs')
          .select('*')
          .eq('owner_id', user.id);

        if (dogsError) throw dogsError;
        
        // 犬の画像URLをデバッグ
        if (dogsData && dogsData.length > 0) {
          debug += 'Dog photos:\n';
          dogsData.forEach((dog, index) => {
            if (dog.photos_urls && dog.photos_urls.length > 0) {
              debug += `Dog ${index+1} (${dog.name}): ${dog.photos_urls[0]}\n`;
              console.log(`Dog photo URL for ${dog.name}:`, dog.photos_urls[0]);
            } else {
              debug += `Dog ${index+1} (${dog.name}): No photos\n`;
            }
          });
        }
        
        setDebugInfo(debug);
        
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

        setProfile({
          ...profileData,
          age
        });
        
        if (dogsData) {
          setDogs(dogsData);
        }
        
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setDebugInfo(`Error: ${JSON.stringify(error)}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleEditProfile = () => {
    router.push('/register');
  };

  // 画像読み込みエラー時のハンドラー
  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setAvatarError(true);
    console.log("Avatar image failed to load", e);
    // 元のURLをログ出力
    console.log("Failed URL:", e.currentTarget.src);
    
    // CORSエラーかどうかを確認
    if (e.currentTarget.naturalWidth === 0) {
      console.log("Possible CORS issue with avatar image");
    }
  };

  const handleDogPhotoError = (dogId: string, e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setDogPhotoErrors(prev => ({...prev, [dogId]: true}));
    console.log(`Dog photo for dog ${dogId} failed to load`, e);
    // 元のURLをログ出力
    console.log("Failed URL:", e.currentTarget.src);
    
    // CORSエラーかどうかを確認
    if (e.currentTarget.naturalWidth === 0) {
      console.log("Possible CORS issue with dog image");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  // 性別の表示を調整
  const displayGender = () => {
    switch(profile.gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      case 'other': return 'その他';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-b-3xl shadow-lg">
          <div className="relative h-64">
            {!avatarError ? (
              <img
                src={fixImageUrl(profile.avatar_url)}
                alt={profile.username || 'プロフィール画像'}
                className="h-full w-full object-cover rounded-b-3xl"
                onError={handleAvatarError}
              />
            ) : (
              <div className="h-full w-full bg-gray-200 flex items-center justify-center rounded-b-3xl">
                <Camera className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold">{profile.username}{profile.age ? `, ${profile.age}` : ''}</h1>
                <p className="text-gray-500">{profile.prefecture} {profile.city}</p>
                {profile.gender && <p className="text-gray-500">{displayGender()}</p>}
              </div>
              <button 
                className="bg-gray-100 p-2 rounded-full"
                onClick={handleEditProfile}
              >
                <Edit2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {profile.bio && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">自己紹介</h2>
                <p className="text-gray-600">{profile.bio}</p>
              </div>
            )}

            {/* デバッグ情報（開発時のみ表示） */}
            {process.env.NODE_ENV === 'development' && debugInfo && (
              <div className="mb-6 p-3 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
                <h3 className="font-bold mb-1">デバッグ情報:</h3>
                <pre>{debugInfo}</pre>
              </div>
            )}

            {dogs.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">愛犬の情報</h2>
                
                {dogs.map((dog) => (
                  <div key={dog.id} className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-4 mb-2">
                      {dog.photos_urls && dog.photos_urls.length > 0 && !dogPhotoErrors[dog.id] ? (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden">
                          <img
                            src={fixImageUrl(dog.photos_urls[0])}
                            alt={dog.name}
                            className="w-full h-full object-cover"
                            onError={(e) => handleDogPhotoError(dog.id, e)}
                          />
                        </div>
                      ) : (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-lg">{dog.name}</h3>
                        <p className="text-gray-500">{dog.breed}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p><span className="font-medium">年齢：</span>
                        {dog.age_years > 0 ? `${dog.age_years}歳` : ''}
                        {dog.age_months > 0 ? `${dog.age_months}ヶ月` : ''}
                      </p>
                      <p><span className="font-medium">性別：</span>
                        {dog.gender === 'male' ? 'オス' : dog.gender === 'female' ? 'メス' : ''}
                      </p>
                      <p><span className="font-medium">サイズ：</span>
                        {dog.size === 'small' ? '小型' : dog.size === 'medium' ? '中型' : dog.size === 'large' ? '大型' : ''}
                      </p>
                      {dog.bio && <p><span className="font-medium">性格：</span>{dog.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          <button 
            className="w-full bg-pink-500 text-white py-3 rounded-full font-bold hover:bg-pink-600 transition-colors"
            onClick={handleEditProfile}
          >
            プロフィールを編集
          </button>
        </div>
      </div>
    </div>
  );
} 