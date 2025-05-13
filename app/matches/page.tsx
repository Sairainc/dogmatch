'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Camera, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { fixImageUrl } from '@/utils/utils';

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchMatches = async () => {
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

        // マッチしているユーザーを取得
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (matchesError) throw matchesError;

        // マッチングのないケース
        if (!matchesData || matchesData.length === 0) {
          setMatches([]);
          setIsLoading(false);
          return;
        }

        // マッチしている相手のプロフィール情報を取得
        const matchedUserIds = matchesData.map(match => 
          match.user1_id === user.id ? match.user2_id : match.user1_id
        );

        const { data: matchedProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            bio,
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
          .in('id', matchedUserIds);

        if (profilesError) throw profilesError;

        // 年齢計算とマッチング情報を組み合わせる
        const formattedMatches = matchesData.map(match => {
          const matchedUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          const profile = matchedProfiles?.find(p => p.id === matchedUserId);
          
          if (!profile) return null;
          
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
          
          // 犬の情報
          const dog = profile.dogs && profile.dogs.length > 0 ? profile.dogs[0] : null;
          
          return {
            matchId: match.id,
            userId: profile.id,
            name: profile.username,
            age,
            bio: profile.bio,
            prefecture: profile.prefecture,
            city: profile.city,
            avatar: profile.avatar_url,
            dogName: dog?.name || '',
            dogBreed: dog?.breed || '',
            dogImage: dog?.photos_urls && dog?.photos_urls.length > 0 ? dog.photos_urls[0] : null,
            matchedAt: new Date(match.created_at)
          };
        }).filter(Boolean);

        setMatches(formattedMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleChatClick = (matchId: string) => {
    router.push(`/chat/${matchId}`);
  };

  const handleProfileClick = (userId: string) => {
    router.push(`/discovery/${userId}`);
  };

  // マッチした日時のフォーマット
  const formatMatchDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return '今日';
    } else if (diffInDays === 1) {
      return '昨日';
    } else if (diffInDays < 7) {
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      return `${days[date.getDay()]}曜日`;
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        <p className="mt-4 text-gray-600">マッチング情報を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto flex items-center">
          <button onClick={() => router.push('/discovery')} className="text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-center flex-1">マッチ</h1>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-4">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-pink-100 rounded-full p-4 mb-4">
              <Heart className="w-10 h-10 text-pink-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">まだマッチしていません</h3>
            <p className="text-gray-500">
              ディスカバリーページでいいねをして、マッチングを待ちましょう！
            </p>
            <button
              onClick={() => router.push('/discovery')}
              className="mt-6 bg-pink-500 text-white py-2 px-6 rounded-full font-medium hover:bg-pink-600 transition-colors"
            >
              ディスカバリーページへ
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {matches.map((match) => (
              <div 
                key={match.matchId} 
                className="bg-white rounded-xl overflow-hidden shadow-md"
              >
                <div
                  className="relative aspect-square cursor-pointer"
                  onClick={() => handleProfileClick(match.userId)}
                >
                  <img
                    src={fixImageUrl(match.avatar)}
                    alt={match.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                          </svg>
                        </div>
                      `;
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-white">
                    <p className="font-semibold">{match.name}, {match.age}</p>
                    <p className="text-xs truncate">{match.dogName}</p>
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      {formatMatchDate(match.matchedAt)}にマッチ
                    </p>
                    <button 
                      onClick={() => handleChatClick(match.matchId)}
                      className="bg-pink-500 text-white p-2 rounded-full"
                      aria-label="メッセージを送る"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 