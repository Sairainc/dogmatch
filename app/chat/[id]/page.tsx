'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Camera } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { fixImageUrl } from '@/utils/utils';

export default function ChatDetail() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [matchData, setMatchData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const matchId = params.id;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchChatData = async () => {
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

        // マッチング情報を取得
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('id', matchId)
          .single();

        if (matchError) throw matchError;
        setMatchData(match);

        // マッチしている相手のIDを特定
        const matchedUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

        // 相手のプロフィール情報を取得
        const { data: matchedProfile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            avatar_url,
            dogs (
              name
            )
          `)
          .eq('id', matchedUserId)
          .single();

        if (profileError) throw profileError;
        setMatchedUser(matchedProfile);

        // メッセージを取得
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);

        // 未読メッセージを既読に更新
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('match_id', matchId)
          .eq('sender_id', matchedUserId)
          .eq('is_read', false);

      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();

    // リアルタイムサブスクリプション（新しいメッセージを監視）
    const subscription = supabase
      .channel('messages_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      }, (payload) => {
        // 新しいメッセージが届いたらstateを更新
        setMessages((currentMessages) => [...currentMessages, payload.new]);
        
        // 自分が送信したメッセージでない場合は既読に更新
        if (payload.new.sender_id !== currentUser?.id) {
          supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', payload.new.id);
        }
      })
      .subscribe();

    // クリーンアップ関数
    return () => {
      subscription.unsubscribe();
    };
  }, [matchId]);

  // メッセージ送信時に自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser || !matchData) return;

    try {
      // メッセージを送信
      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: currentUser.id,
          content: message,
          created_at: new Date().toISOString(),
          is_read: false
        })
        .select();

      if (error) throw error;

      // マッチングの最終メッセージ日時を更新
      await supabase
        .from('matches')
        .update({
          last_message_at: new Date().toISOString()
        })
        .eq('id', matchId);

      // 入力フィールドをクリア
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今日';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨日';
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  // 日付ごとにメッセージをグループ化する
  const groupMessagesByDate = () => {
    const groups: { [key: string]: any[] } = {};
    
    messages.forEach(msg => {
      const date = new Date(msg.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    
    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      messages: msgs,
    }));
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
    <div className="h-screen flex flex-col bg-gray-100">
      {/* ヘッダー */}
      <div className="bg-white p-4 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.push('/chat')} className="text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        {matchedUser && (
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <img
                src={fixImageUrl(matchedUser.avatar_url)}
                alt={matchedUser.username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-profile.jpg';
                }}
              />
            </div>
            <div>
              <h3 className="font-medium">{matchedUser.username}</h3>
              {matchedUser.dogs && matchedUser.dogs.length > 0 && (
                <p className="text-xs text-gray-500">{matchedUser.dogs[0].name}</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4">
        {groupMessagesByDate().map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            <div className="text-center mb-4">
              <span className="inline-block bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                {formatMessageDate(group.messages[0].created_at)}
              </span>
            </div>
            
            {group.messages.map((msg: any, msgIndex: number) => {
              const isMine = msg.sender_id === currentUser?.id;
              
              return (
                <div 
                  key={msg.id} 
                  className={`mb-4 flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMine ? 'bg-pink-500 text-white' : 'bg-white text-gray-800'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <div className={`text-xs mt-1 ${isMine ? 'text-pink-200' : 'text-gray-500'}`}>
                      {formatMessageTime(msg.created_at)}
                      {isMine && (
                        <span className="ml-1">
                          {msg.is_read ? '既読' : '未読'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* メッセージ入力エリア */}
      <div className="bg-white p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 focus:outline-none"
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <button
            onClick={handleSendMessage}
            className="bg-pink-500 text-white p-2 rounded-full disabled:opacity-50"
            disabled={!message.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 