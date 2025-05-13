'use client';

import { Search, Camera } from 'lucide-react';
import { fixImageUrl } from '@/utils/utils';

export default function ChatPage() {
  // ダミーデータ
  const matches = [
    {
      id: 1,
      name: '花子',
      dogName: 'マロン',
      lastMessage: 'こんにちは！',
      timestamp: '10:30',
      image: '/placeholder-dog.jpg',
      unread: 2
    },
    {
      id: 2,
      name: '次郎',
      dogName: 'ココ',
      lastMessage: '散歩に行きましょう！',
      timestamp: '昨日',
      image: '/placeholder-dog.jpg',
      unread: 0
    }
  ];

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

        <div className="divide-y divide-gray-200">
          {matches.map((match) => (
            <div key={match.id} className="bg-white p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden">
                  <img
                    src={fixImageUrl(match.image)}
                    alt={match.name}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
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
      </div>
    </div>
  );
} 