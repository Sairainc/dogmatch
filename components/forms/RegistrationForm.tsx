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
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-white rounded-3xl shadow-xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-pink-500 to-pink-400 pb-8 pt-8 text-white">
          <div className="flex justify-center mb-6">
            {step === 'user' ? (
              <div className="rounded-full bg-white bg-opacity-20 p-5">
                <UserCircle size={40} className="text-white" />
              </div>
            ) : (
              <div className="rounded-full bg-white bg-opacity-20 p-5">
                <Dog size={40} className="text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {step === 'user' ? 'プロフィール登録' : '愛犬情報登録'}
          </CardTitle>
          <p className="text-center text-white text-opacity-90 mt-2">
            {step === 'user' 
              ? 'あなたについて教えてください' 
              : '愛犬の情報を入力してください'}
          </p>
        </CardHeader>

        <CardContent className="pt-8 px-8 pb-8">
          {step === 'user' ? (
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-6">
                <div className="flex justify-center mb-8">
                  <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-pink-100">
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
                    <div className="absolute bottom-0 left-0 right-0 bg-pink-500 bg-opacity-80 text-white text-xs font-medium text-center py-1.5">
                      {uploading ? '読込中...' : '写真を選択'}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6">
                  <FormField
                    control={userForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">ユーザー名 <span className="text-pink-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all"
                            placeholder="例：田中太郎"
                          />
                        </FormControl>
                        <FormMessage className="text-pink-500 text-sm" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={userForm.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">生年月日 <span className="text-pink-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all"
                          />
                        </FormControl>
                        <FormMessage className="text-pink-500 text-sm" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={userForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">性別 <span className="text-pink-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all">
                              <SelectValue placeholder="性別を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-gray-200">
                            <SelectItem value="male">男性</SelectItem>
                            <SelectItem value="female">女性</SelectItem>
                            <SelectItem value="other">その他</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-pink-500 text-sm" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={userForm.control}
                      name="prefecture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">都道府県 <span className="text-pink-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all"
                              placeholder="例：東京都"
                            />
                          </FormControl>
                          <FormMessage className="text-pink-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={userForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">市区町村 <span className="text-pink-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all"
                              placeholder="例：渋谷区"
                            />
                          </FormControl>
                          <FormMessage className="text-pink-500 text-sm" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={userForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">自己紹介</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all min-h-[120px]"
                            placeholder="あなた自身や愛犬との生活について教えてください"
                          />
                        </FormControl>
                        <FormMessage className="text-pink-500 text-sm" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="text-right text-xs text-gray-500 mt-2">
                  <span className="text-pink-500">*</span> は必須項目です
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-400 hover:from-pink-600 hover:to-pink-500 text-white py-3 rounded-xl font-medium text-base shadow-md transition-all hover:shadow-lg mt-6">
                  次へ
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...dogForm}>
              <form onSubmit={dogForm.handleSubmit(onDogSubmit)} className="space-y-6">
                <div className="flex justify-center mb-8">
                  <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-pink-100">
                    {dogPhotoUrl ? (
                      <img src={dogPhotoUrl} alt="愛犬の写真" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-10 h-10 text-gray-400" />
                    )}
                    <input
                      type="file"
                      id="dogPhoto"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleDogPhotoUpload}
                      disabled={uploadingDog}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-pink-500 bg-opacity-80 text-white text-xs font-medium text-center py-1.5">
                      {uploadingDog ? '読込中...' : '愛犬の写真を選択'}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6">
                  <FormField
                    control={dogForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">愛犬の名前 <span className="text-pink-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all"
                            placeholder="例：ポチ"
                          />
                        </FormControl>
                        <FormMessage className="text-pink-500 text-sm" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dogForm.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">犬種 <span className="text-pink-500">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all"
                            placeholder="例：柴犬"
                          />
                        </FormControl>
                        <FormMessage className="text-pink-500 text-sm" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={dogForm.control}
                      name="age_years"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">年齢（歳）<span className="text-pink-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all"
                            />
                          </FormControl>
                          <FormMessage className="text-pink-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={dogForm.control}
                      name="age_months"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">月齢</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="11" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all"
                            />
                          </FormControl>
                          <FormMessage className="text-pink-500 text-sm" />
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
                          <FormLabel className="text-gray-700 font-medium">性別 <span className="text-pink-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all">
                                <SelectValue placeholder="性別を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-gray-200">
                              <SelectItem value="male">オス</SelectItem>
                              <SelectItem value="female">メス</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-pink-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={dogForm.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">サイズ <span className="text-pink-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all">
                                <SelectValue placeholder="サイズを選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl border-gray-200">
                              <SelectItem value="small">小型</SelectItem>
                              <SelectItem value="medium">中型</SelectItem>
                              <SelectItem value="large">大型</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-pink-500 text-sm" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={dogForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">愛犬の紹介</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all min-h-[120px]"
                            placeholder="愛犬の性格や好きなこと、特徴などを書いてください"
                          />
                        </FormControl>
                        <FormMessage className="text-pink-500 text-sm" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={dogForm.control}
                      name="is_vaccinated"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">ワクチン接種済み <span className="text-pink-500">*</span></FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => field.onChange(value === 'true')}
                              defaultValue={field.value?.toString()}
                            >
                              <SelectTrigger className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all">
                                <SelectValue placeholder="選択してください" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-200">
                                <SelectItem value="true">はい</SelectItem>
                                <SelectItem value="false">いいえ</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage className="text-pink-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={dogForm.control}
                      name="is_neutered_spayed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">去勢・避妊済み <span className="text-pink-500">*</span></FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => field.onChange(value === 'true')}
                              defaultValue={field.value?.toString()}
                            >
                              <SelectTrigger className="rounded-xl p-3 border-gray-200 focus:border-pink-500 focus:ring focus:ring-pink-100 transition-all">
                                <SelectValue placeholder="選択してください" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-200">
                                <SelectItem value="true">はい</SelectItem>
                                <SelectItem value="false">いいえ</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage className="text-pink-500 text-sm" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="text-right text-xs text-gray-500 mt-2">
                  <span className="text-pink-500">*</span> は必須項目です
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('user')}
                    className="w-full border-gray-300 text-gray-700 rounded-xl py-3 font-medium hover:bg-gray-50 transition-all"
                  >
                    戻る
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-pink-500 to-pink-400 hover:from-pink-600 hover:to-pink-500 text-white py-3 rounded-xl font-medium shadow-md transition-all hover:shadow-lg">
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