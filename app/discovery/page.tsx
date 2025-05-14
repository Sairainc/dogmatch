'use client';

import { useState, useRef, useEffect } from 'react';
import { Heart, X, Camera } from 'lucide-react';
import { fixImageUrl } from '@/utils/utils';
import { useRouter } from 'next/navigation';
import { useSwipeable } from 'react-swipeable';
import { createBrowserClient } from '@supabase/ssr';

export default function DiscoveryPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [swipePosition, setSwipePosition] = useState({ x: 0, y: 0 });
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ユーザーデータとマッチング候補を取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // 現在のユーザー情報を取得
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/sign-in');
          return;
        }

        // 自分のプロフィール情報を取得
        const { data: myProfile, error: myProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (myProfileError) throw myProfileError;
        setCurrentUser(myProfile);

        // 自分と反対の性別のユーザーを取得
        let oppositeGender;
        if (myProfile.gender === 'male') {
          oppositeGender = 'female';
        } else if (myProfile.gender === 'female') {
          oppositeGender = 'male';
        } else {
          // その他の性別の場合は両方取得
          oppositeGender = null;
        }

        // 既にLikeした相手のIDリストを取得
        const { data: likedUsers, error: likedError } = await supabase
          .from('likes')
          .select('liked_user_id')
          .eq('liker_user_id', user.id);

        if (likedError) {
          console.error('Error fetching liked users:', likedError);
          throw likedError;
        }
        
        console.log('Liked users:', likedUsers);

        // likedUsersからIDのみの配列を作成
        const likedUserIds = likedUsers ? likedUsers.map(like => like.liked_user_id) : [];
        console.log('Liked user IDs:', likedUserIds);

        // 全プロフィール数を確認
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('id, gender, is_profile_completed');
          
        if (allProfilesError) {
          console.error('Error fetching all profiles:', allProfilesError);
        } else {
          console.log('All profiles:', allProfiles);
          console.log('Total profiles count:', allProfiles?.length);
          console.log('Completed profiles count:', allProfiles?.filter(p => p.is_profile_completed).length);
          console.log('Male profiles count:', allProfiles?.filter(p => p.gender === 'male').length);
          console.log('Female profiles count:', allProfiles?.filter(p => p.gender === 'female').length);
          
          // 各プロフィールの詳細を表示
          console.log('Profiles details:');
          allProfiles?.forEach(p => {
            console.log(`ID: ${p.id}, Gender: ${p.gender}, Completed: ${p.is_profile_completed}`);
          });
          
          // 男性プロフィールの詳細確認
          const maleProfiles = allProfiles?.filter(p => p.gender === 'male');
          console.log('Male profiles details:', maleProfiles);
          
          // データベースから直接男性プロフィールを取得して確認
          supabase
            .from('profiles')
            .select('*')
            .eq('gender', 'male')
            .then(({ data, error }) => {
              if (error) {
                console.error('Error fetching male profiles directly:', error);
              } else {
                console.log('Male profiles direct query:', data);
                console.log('Male profiles direct count:', data?.length);
              }
            });
        }

        let query = supabase
          .from('profiles')
          .select(`
            id,
            username,
            bio,
            gender,
            prefecture,
            city,
            avatar_url,
            date_of_birth,
            dogs (
              id,
              name,
              breed,
              gender,
              age_years,
              age_months,
              bio,
              photos_urls
            )
          `)
          .neq('id', user.id) // 自分以外
          .eq('is_profile_completed', true); // プロフィール完了済み
          
        console.log('Current user ID:', user.id);
        console.log('Current user gender:', myProfile.gender);

        // 性別でフィルタリング
        if (oppositeGender) {
          console.log('Filtering by opposite gender:', oppositeGender);
          query = query.eq('gender', oppositeGender);
        }

        // 既にLikeした相手を除外
        if (likedUserIds.length > 0) {
          console.log('Excluding liked users:', likedUserIds);
          query = query.not('id', 'in', `(${likedUserIds.join(',')})`);
        }

        const { data: matchProfiles, error: matchError } = await query;

        if (matchError) {
          console.error('Error in main query:', matchError);
          throw matchError;
        }
        
        console.log('Match profiles before formatting:', matchProfiles);
        console.log('Match profiles count:', matchProfiles?.length);

        // 年齢計算を含むプロフィール情報を整形
        const formattedProfiles = matchProfiles?.map(profile => {
          // 年齢計算
          let age = 0;
          if (profile.date_of_birth) {
            const birthDate = new Date(profile.date_of_birth);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
          }

          // 犬の情報がある場合は最初の犬を表示用に選択
          const dog = profile.dogs && profile.dogs.length > 0 ? profile.dogs[0] : null;

          return {
            id: profile.id,
            name: profile.username,
            age: age,
            bio: profile.bio,
            gender: profile.gender,
            prefecture: profile.prefecture,
            city: profile.city,
            avatar_url: profile.avatar_url,
            dogName: dog ? dog.name : '',
            dogBreed: dog ? dog.breed : '',
            dogImage: dog && dog.photos_urls && dog.photos_urls.length > 0 ? dog.photos_urls[0] : null,
            image: profile.avatar_url
          };
        }) || [];

        setProfiles(formattedProfiles);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const createMatch = async (user1Id: string, user2Id: string) => {
    // IDが小さい方をuser1_id、大きい方をuser2_idにする（一貫性のため）
    const [smallerId, largerId] = user1Id < user2Id 
      ? [user1Id, user2Id] 
      : [user2Id, user1Id];

    const { data, error } = await supabase
      .from('matches')
      .insert({
        user1_id: smallerId,
        user2_id: largerId,
        created_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating match:', error);
      return null;
    }

    return data;
  };

  const checkForMatch = async (likedUserId: string) => {
    if (!currentUser) return false;

    // 相手が自分にLikeしているかチェック
    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('liker_user_id', likedUserId)
      .eq('liked_user_id', currentUser.id)
      .single();

    if (error || !data) {
      return false;
    }

    // マッチングが成立
    const match = await createMatch(currentUser.id, likedUserId);
    return !!match;
  };

  const handleLike = async () => {
    if (isProcessingAction || currentIndex >= profiles.length) return;

    setIsProcessingAction(true);
    const likedProfile = profiles[currentIndex];

    try {
      // データベースにLikeを記録
      const { error } = await supabase
        .from('likes')
        .insert({
          liker_user_id: currentUser.id,
          liked_user_id: likedProfile.id,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving like:', error);
        throw error;
      }

      // マッチングをチェック
      const isMatch = await checkForMatch(likedProfile.id);

      if (isMatch) {
        // マッチング成立
        setMatchedProfile(likedProfile);
        setShowMatchModal(true);
      } else {
        // 通常通り次のプロフィールへ
        animateSwipe('right');
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          resetSwipeState();
          setIsProcessingAction(false);
        }, 300);
      }
    } catch (error) {
      console.error('Error in handleLike:', error);
      setIsProcessingAction(false);
    }
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

  // ローディング表示
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        <p className="mt-4 text-gray-600">プロフィールを読み込み中...</p>
      </div>
    );
  }

  // プロフィールがない場合
  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 px-4 text-center">
        <p className="text-xl text-gray-600">マッチング候補が見つかりませんでした</p>
        <p className="mt-2 text-gray-500">新しいユーザーが登録されるのをお待ちください</p>
      </div>
    );
  }

  // すべてのプロフィールを見終わった場合
  if (currentIndex >= profiles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 px-4 text-center">
        <p className="text-xl text-gray-600">すべてのプロフィールを見終わりました</p>
        <p className="mt-2 text-gray-500">また後でチェックしてみてください</p>
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
              alt={currentProfile.name}
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
            {currentProfile.prefecture && <p className="text-sm opacity-80">{currentProfile.prefecture} {currentProfile.city}</p>}
            {currentProfile.dogName && (
              <p className="text-lg mt-1">
                {currentProfile.dogName} 
                {currentProfile.dogBreed && `(${currentProfile.dogBreed})`}
              </p>
            )}
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
            disabled={isProcessingAction}
          >
            <X className="w-7 h-7 text-red-500" />
          </button>
          <button
            onClick={handleLike}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center"
            aria-label="Like"
            disabled={isProcessingAction}
          >
            <Heart className="w-7 h-7 text-pink-500" />
          </button>
        </div>
      </div>

      {/* マッチング成立モーダル */}
      {showMatchModal && matchedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <h2 className="text-2xl font-bold text-pink-500 mb-4">マッチング成立！</h2>
            <p className="mb-6">あなたと{matchedProfile.name}さんがお互いにLikeしました！</p>
            
            <div className="flex justify-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500">
                <img 
                  src={fixImageUrl(currentUser.avatar_url)} 
                  alt={currentUser.username} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-profile.jpg';
                  }}
                />
              </div>
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500">
                <img 
                  src={fixImageUrl(matchedProfile.image)} 
                  alt={matchedProfile.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-profile.jpg';
                  }}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => router.push('/matches')}
                className="bg-pink-500 text-white py-3 px-6 rounded-full font-semibold hover:bg-pink-600 transition-colors"
              >
                マッチページへ
              </button>
              <button 
                onClick={() => {
                  setShowMatchModal(false);
                  setCurrentIndex(prev => prev + 1);
                  resetSwipeState();
                  setIsProcessingAction(false);
                }}
                className="bg-gray-200 text-gray-800 py-3 px-6 rounded-full font-semibold hover:bg-gray-300 transition-colors"
              >
                続けて探す
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 