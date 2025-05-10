'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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

// バリデーションスキーマ
const userSchema = z.object({
  username: z.string().min(2, 'ユーザー名は2文字以上必要です'),
  bio: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  dog_owner_experience: z.string().optional(),
  preferred_dog_breeds: z.array(z.string()).optional(),
  preferred_dog_sizes: z.array(z.string()).optional(),
});

const dogSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  breed: z.string().optional(),
  age_years: z.number().min(0).optional(),
  age_months: z.number().min(0).max(11).optional(),
  gender: z.string().optional(),
  size: z.string().optional(),
  bio: z.string().optional(),
  is_vaccinated: z.boolean().optional(),
  is_neutered_spayed: z.boolean().optional(),
  temperament: z.array(z.string()).optional(),
});

export function RegistrationForm() {
  const [step, setStep] = useState<'user' | 'dog'>('user');
  const [dogCount, setDogCount] = useState(1);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      bio: '',
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
      is_vaccinated: false,
      is_neutered_spayed: false,
      temperament: [],
    },
  });

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
          preferred_dog_breeds: data.preferred_dog_breeds,
          preferred_dog_sizes: data.preferred_dog_sizes,
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
        dogForm.reset();
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error creating dog profile:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {step === 'user' ? 'ユーザー情報登録' : '愛犬情報登録'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'user' ? (
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                <FormField
                  control={userForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ユーザー名</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>自己紹介</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>生年月日</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>性別</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="性別を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">男性</SelectItem>
                          <SelectItem value="female">女性</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="prefecture"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>都道府県</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>市区町村</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  次へ
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...dogForm}>
              <form onSubmit={dogForm.handleSubmit(onDogSubmit)} className="space-y-4">
                <FormField
                  control={dogForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>愛犬の名前</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={dogForm.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>犬種</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={dogForm.control}
                    name="age_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>年齢（歳）</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dogForm.control}
                    name="age_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>月齢</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={dogForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>性別</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="性別を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">オス</SelectItem>
                          <SelectItem value="female">メス</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={dogForm.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>サイズ</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="サイズを選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">小型</SelectItem>
                          <SelectItem value="medium">中型</SelectItem>
                          <SelectItem value="large">大型</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={dogForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>愛犬の紹介</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={dogForm.control}
                    name="is_vaccinated"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ワクチン接種済み</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(value === 'true')}
                            defaultValue={field.value?.toString()}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="選択してください" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">はい</SelectItem>
                              <SelectItem value="false">いいえ</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dogForm.control}
                    name="is_neutered_spayed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>去勢・避妊済み</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(value === 'true')}
                            defaultValue={field.value?.toString()}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="選択してください" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">はい</SelectItem>
                              <SelectItem value="false">いいえ</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('user')}
                    className="w-full"
                  >
                    戻る
                  </Button>
                  <Button type="submit" className="w-full">
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