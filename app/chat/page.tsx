'use client';

import { useEffect, useState } from 'react';
import { Search, Camera, Heart } from 'lucide-react';
import { fixImageUrl } from '@/utils/utils';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function ChatPage() {
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
          .order('last_message_at', { ascending: false });

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
            avatar_url,
            dogs (
              name
            )
          `)
          .in('id', matchedUserIds);

        if (profilesError) throw profilesError;

        // 各マッチングの最新メッセージを取得
        const matchPromises = matchesData.map(async (match) => {
          // 最新メッセージを取得
          const { data: latestMessage, error: messageError } = await supabase
            .from('messages')
            .select('*')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (messageError && messageError.code !== 'PGRST116') {
            console.error('Error fetching latest message:', messageError);
          }

          // 相手のプロフィール情報を見つける
          const matchedUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          const matchedProfile = matchedProfiles?.find(profile => profile.id === matchedUserId);

          if (!matchedProfile) return null;

          // 未読メッセージ数を取得
          const { count: unreadCount, error: unreadError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', match.id)
            .eq('sender_id', matchedUserId)
            .eq('is_read', false);

          if (unreadError) {
            console.error('Error fetching unread count:', unreadError);
          }

          // 犬の名前を取得
          const dogName = matchedProfile.dogs && matchedProfile.dogs.length > 0
            ? matchedProfile.dogs[0].name
            : '';

          return {
            id: match.id,
            matchedUserId: matchedUserId,
            name: matchedProfile.username,
            dogName: dogName,
            lastMessage: latestMessage ? latestMessage.content : 'メッセージはまだありません',
            timestamp: latestMessage 
              ? formatTimestamp(new Date(latestMessage.created_at))
              : formatTimestamp(new Date(match.created_at)),
            image: matchedProfile.avatar_url,
            unread: unreadCount || 0,
          };
        });

        const matchResults = await Promise.all(matchPromises);
        setMatches(matchResults.filter(Boolean));
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // タイムスタンプのフォーマット関数
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // 今日の場合は時間を表示
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (diffInDays === 1) {
      return '昨日';
    } else if (diffInDays < 7) {
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      return `${days[date.getDay()]}曜日`;
    } else {
      // 1週間以上前は日付表示
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  // チャット詳細ページへの遷移
  const handleChatClick = (matchId: string) => {
    router.push(`/chat/${matchId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        <p className="mt-4 text-gray-600">チャット情報を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-4 sticky top-0 z-10">
          <div className="relative">
            <input
              type="text"
              placeholder="チャットを検索"
              className="w-full bg-gray-100 rounded-full py-2 px-4 pl-10 focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
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
          <div className="divide-y divide-gray-200">
            {matches.map((match) => (
              <div key={match.id} className="bg-white p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleChatClick(match.id)}>
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden">
                    <img
                      src={fixImageUrl(match.image)}
                      alt={match.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-200 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg></div>`;
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{match.name}</h3>
                        <p className="text-sm text-gray-500">{match.dogName}</p>
                      </div>
                      <span className="text-xs text-gray-500">{match.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{match.lastMessage}</p>
                  </div>
                  {match.unread > 0 && (
                    <div className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {match.unread}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 