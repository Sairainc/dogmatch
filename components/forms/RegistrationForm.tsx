'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Camera, Dog, Upload, UserCircle } from 'lucide-react';

// バリデーションスキーマ
const userSchema = z.object({
  username: z.string().min(2, 'ユーザー名は2文字以上必要です'),
  bio: z.string().optional(),
  date_of_birth: z.string().min(1, '生年月日は必須です'),
  gender: z.string().min(1, '性別を選択してください'),
  prefecture: z.string().min(1, '都道府県は必須です'),
  city: z.string().min(1, '市区町村は必須です'),
  dog_owner_experience: z.string().optional(),
  avatar_url: z.string().optional(),
  preferred_dog_breeds: z.array(z.string()).optional(),
  preferred_dog_sizes: z.array(z.string()).optional(),
});

const dogSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  breed: z.string().min(1, '犬種は必須です'),
  age_years: z.number().min(0, '0以上を入力してください'),
  age_months: z.number().min(0, '0以上を入力してください').max(11, '11以下を入力してください'),
  gender: z.string().min(1, '性別を選択してください'),
  size: z.string().min(1, 'サイズを選択してください'),
  bio: z.string().optional(),
  photos_urls: z.array(z.string()).optional(),
  is_vaccinated: z.boolean(),
  is_neutered_spayed: z.boolean(),
  temperament: z.array(z.string()).optional(),
});

export function RegistrationForm() {
  const [step, setStep] = useState<'user' | 'dog'>('user');
  const [dogCount, setDogCount] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadingDog, setUploadingDog] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dogPhotoUrl, setDogPhotoUrl] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      bio: '',
      date_of_birth: '',
      gender: '',
      prefecture: '',
      city: '',
      dog_owner_experience: '',
      avatar_url: '',
      preferred_dog_breeds: [],
      preferred_dog_sizes: [],
    },
  });

  const dogForm = useForm<z.infer<typeof dogSchema>>({
    resolver: zodResolver(dogSchema),
    defaultValues: {
      name: '',
      breed: '',
      age_years: 0,
      age_months: 0,
      gender: '',
      size: '',
      bio: '',
      photos_urls: [],
      is_vaccinated: false,
      is_neutered_spayed: false,
      temperament: [],
    },
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('画像を選択してください');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);
      userForm.setValue('avatar_url', data.publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDogPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingDog(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('画像を選択してください');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `dogs/${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('dogs')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('dogs').getPublicUrl(filePath);
      
      setDogPhotoUrl(data.publicUrl);
      const currentPhotos = dogForm.getValues('photos_urls') || [];
      dogForm.setValue('photos_urls', [...currentPhotos, data.publicUrl]);
    } catch (error) {
      console.error('Error uploading dog photo:', error);
    } finally {
      setUploadingDog(false);
    }
  };

  const onUserSubmit = async (data: z.infer<typeof userSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');

      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          bio: data.bio,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          prefecture: data.prefecture,
          city: data.city,
          dog_owner_experience: data.dog_owner_experience,
          avatar_url: data.avatar_url,
          preferred_dog_breeds: data.preferred_dog_breeds,
          preferred_dog_sizes: data.preferred_dog_sizes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      setStep('dog');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const onDogSubmit = async (data: z.infer<typeof dogSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');

      const { error } = await supabase
        .from('dogs')
        .insert({
          owner_id: user.id,
          ...data,
        });

      if (error) throw error;

      if (dogCount > 1) {
        setDogCount(prev => prev - 1);
        setDogPhotoUrl(null);
        dogForm.reset({
          name: '',
          breed: '',
          age_years: 0,
          age_months: 0,
          gender: '',
          size: '',
          bio: '',
          photos_urls: [],
          is_vaccinated: false,
          is_neutered_spayed: false,
          temperament: [],
        });
      } else {
        // プロフィール完了フラグを設定
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_profile_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (profileError) {
          console.error('Error updating profile completion status:', profileError);
        }

        // 登録完了後はdiscoveryページへリダイレクト
        router.push('/discovery');
      }
    } catch (error) {
      console.error('Error creating dog profile:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-0 rounded-3xl overflow-hidden shadow-md">
        <div className="bg-gray-100 p-6 text-center text-gray-800">
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-white bg-opacity-20 p-4">
              {step === 'user' 
                ? <UserCircle size={32} className="text-gray-700" />
                : <Dog size={32} className="text-gray-700" />
              }
            </div>
          </div>
          <h2 className="text-xl font-bold">
            {step === 'user' ? 'プロフィール登録' : '愛犬情報登録'}
          </h2>
          <p className="text-sm mt-1 text-gray-600">
            {step === 'user' ? 'あなたについて教えてください' : '愛犬の情報を入力してください'}
          </p>
        </div>

        <CardContent className="p-6 bg-white">
          {step === 'user' ? (
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="プロフィール画像" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                    <input
                      type="file"
                      id="avatar"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-500 bg-opacity-80 text-white text-xs font-medium text-center py-1">
                      {uploading ? '読込中...' : '写真を選択'}
                    </div>
                  </div>
                </div>

                <FormField
                  control={userForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-600">
                        ユーザー名 <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          className="bg-white border border-gray-300 rounded-md text-gray-800 h-12 px-4"
                          placeholder="例：田中太郎"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-600">
                        生年月日 <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          className="bg-white border border-gray-300 rounded-md text-gray-800 h-12 px-4"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-600">
                        性別 <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border border-gray-300 rounded-md text-gray-800 h-12 px-4">
                            <SelectValue placeholder="性別を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">男性</SelectItem>
                          <SelectItem value="female">女性</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={userForm.control}
                    name="prefecture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-600">
                          都道府県 <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            className="bg-white border border-gray-300 rounded-md text-gray-800 h-12 px-4"
                            placeholder="例：東京都"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={userForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-600">
                          市区町村 <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            className="bg-white border border-gray-300 rounded-md text-gray-800 h-12 px-4"
                            placeholder="例：渋谷区"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={userForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-600">自己紹介</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          className="bg-white border border-gray-300 rounded-md text-gray-800 min-h-[100px] px-4 py-3"
                          placeholder="あなた自身や愛犬との生活について教えてください"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-full py-3 mt-4">
                  次へ
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...dogForm}>
              <form onSubmit={dogForm.handleSubmit(onDogSubmit)} className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                    {dogPhotoUrl ? (
                      <img src={dogPhotoUrl} alt="愛犬の写真" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400" />
                    )}
                    <input
                      type="file"
                      id="dogPhoto"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleDogPhotoUpload}
                      disabled={uploadingDog}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gray-500 bg-opacity-80 text-white text-xs font-medium text-center py-1">
                      {uploadingDog ? '読込中...' : '愛犬の写真を選択'}
                    </div>
                  </div>
                </div>

                <FormField
                  control={dogForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-600">
                        愛犬の名前 <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          className="bg-white border border-gray-300 rounded-md text-gray-800 h-12 px-4"
                          placeholder="例：ポチ"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={dogForm.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-600">
                        犬種 <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          className="bg-white border border-gray-300 rounded-md text-gray-800 h-12 px-4"
                          placeholder="例：柴犬"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={dogForm.control}
                    name="age_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-600">
                          年齢（歳）<span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            className="bg-white border border-gray-300 rounded-md text-gray-800 h-12 px-4"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dogForm.control}
                    name="age_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-600">月齢</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="11" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            className="bg-white border border-gray-300 rounded-md text-gray-800 h-12 px-4"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={dogForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-600">
                          性別 <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white border border-gray-300 rounded-md text-gray-800 h-12 px-4">
                              <SelectValue placeholder="性別を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">オス</SelectItem>
                            <SelectItem value="female">メス</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dogForm.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-600">
                          サイズ <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white border border-gray-300 rounded-md text-gray-800 h-12 px-4">
                              <SelectValue placeholder="サイズを選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="small">小型</SelectItem>
                            <SelectItem value="medium">中型</SelectItem>
                            <SelectItem value="large">大型</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={dogForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-600">愛犬の紹介</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          className="bg-white border border-gray-300 rounded-md text-gray-800 min-h-[100px] px-4 py-3"
                          placeholder="愛犬の性格や好きなこと、特徴などを書いてください"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={dogForm.control}
                    name="is_vaccinated"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-600">
                          ワクチン接種済み <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === 'true')}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white border border-gray-300 rounded-md text-gray-800 h-12 px-4">
                              <SelectValue placeholder="選択してください" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">はい</SelectItem>
                            <SelectItem value="false">いいえ</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dogForm.control}
                    name="is_neutered_spayed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-600">
                          去勢・避妊済み <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === 'true')}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white border border-gray-300 rounded-md text-gray-800 h-12 px-4">
                              <SelectValue placeholder="選択してください" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">はい</SelectItem>
                            <SelectItem value="false">いいえ</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('user')}
                    className="w-full border-gray-300 text-gray-800 rounded-full"
                  >
                    戻る
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-full">
                    {dogCount > 1 ? '次の愛犬を登録' : '登録完了'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 