'use client';

import Image from 'next/image';
import { Lock } from 'lucide-react';

export default function HotLikesPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Lock className="w-8 h-8 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-800">ホットLike</h1>
          </div>
          
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-4">
              あなたにLikeを送った人を確認するには、プレミアム会員になる必要があります。
            </p>
            <button className="bg-pink-500 text-white px-8 py-3 rounded-full font-bold hover:bg-pink-600 transition-colors">
              プレミアム会員になる
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 