'use client';

import Image from 'next/image';
import { Camera, Edit2 } from 'lucide-react';

export default function ProfilePage() {
  // ダミーデータ
  const profile = {
    name: '太郎',
    age: 28,
    location: '東京',
    bio: '柴犬のポチと一緒に暮らしています。散歩が大好きです！',
    dogName: 'ポチ',
    dogBreed: '柴犬',
    dogAge: 3,
    dogBio: '人懐っこくて、他の犬とも仲良くできます。',
    image: '/placeholder-dog.jpg'
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-b-3xl shadow-lg">
          <div className="relative h-64">
            <Image
              src={profile.image}
              alt={profile.name}
              fill
              className="object-cover rounded-b-3xl"
            />
            <button className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg">
              <Camera className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold">{profile.name}, {profile.age}</h1>
                <p className="text-gray-500">{profile.location}</p>
              </div>
              <button className="bg-gray-100 p-2 rounded-full">
                <Edit2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">自己紹介</h2>
              <p className="text-gray-600">{profile.bio}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-2">愛犬の情報</h2>
              <div className="space-y-2">
                <p><span className="font-medium">名前：</span>{profile.dogName}</p>
                <p><span className="font-medium">犬種：</span>{profile.dogBreed}</p>
                <p><span className="font-medium">年齢：</span>{profile.dogAge}歳</p>
                <p><span className="font-medium">性格：</span>{profile.dogBio}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <button className="w-full bg-pink-500 text-white py-3 rounded-full font-bold hover:bg-pink-600 transition-colors">
            プロフィールを編集
          </button>
        </div>
      </div>
    </div>
  );
} 