'use client';

import { useState, useEffect } from 'react';
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
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Camera, Dog, Upload, UserCircle, CreditCard } from 'lucide-react';

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

// 身分証明書用のスキーマ
const idVerificationSchema = z.object({
  id_front_url: z.string().min(1, '身分証明書（表面）の写真は必須です'),
  id_back_url: z.string().min(1, '身分証明書（裏面）の写真は必須です'),
});

export function RegistrationForm() {
  const [step, setStep] = useState<'user' | 'dog' | 'verification'>('user');
  const [dogCount, setDogCount] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadingDog, setUploadingDog] = useState(false);
  const [uploadingIdFront, setUploadingIdFront] = useState(false);
  const [uploadingIdBack, setUploadingIdBack] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dogPhotoUrl, setDogPhotoUrl] = useState<string | null>(null);
  const [idFrontUrl, setIdFrontUrl] = useState<string | null>(null);
  const [idBackUrl, setIdBackUrl] = useState<string | null>(null);
  const [isFormMounted, setIsFormMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileCompleted, setIsProfileCompleted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userDogs, setUserDogs] = useState<any[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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

  const verificationForm = useForm<z.infer<typeof idVerificationSchema>>({
    resolver: zodResolver(idVerificationSchema),
    defaultValues: {
      id_front_url: '',
      id_back_url: '',
    },
  });

  // 初期ロード時にユーザーのプロフィール完了状態を確認
  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }

        // プロフィール情報の取得
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // 犬の情報を取得
        const { data: dogsData, error: dogsError } = await supabase
          .from('dogs')
          .select('*')
          .eq('owner_id', user.id);

        if (dogsError) throw dogsError;
        
        // 身分証明書の情報を取得
        const { data: idVerificationData, error: idVerificationError } = await supabase
          .from('id_verification')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // プロフィールが完了しているかチェック
        const isCompleted = profileData?.is_profile_completed && dogsData?.length > 0 && idVerificationData;
        setIsProfileCompleted(isCompleted);

        // データがある場合はフォームに設定
        if (profileData) {
          // ユーザーフォームの初期値を設定
          Object.keys(userForm.getValues()).forEach(key => {
            if (key in profileData && profileData[key] !== null) {
              userForm.setValue(key as any, profileData[key]);
            }
          });
          
          if (profileData.avatar_url) {
            setAvatarUrl(profileData.avatar_url);
          }
        }

        // 犬のデータがある場合は保存
        if (dogsData && dogsData.length > 0) {
          setUserDogs(dogsData);
        }

        // 身分証明書データがある場合は設定
        if (idVerificationData) {
          verificationForm.setValue('id_front_url', idVerificationData.id_front_url || '');
          verificationForm.setValue('id_back_url', idVerificationData.id_back_url || '');
          setIdFrontUrl(idVerificationData.id_front_url);
          setIdBackUrl(idVerificationData.id_back_url);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking profile status:', error);
        setIsLoading(false);
      }
    };

    checkProfileStatus();
  }, []);

  // 犬のIDが選択されたら、そのデータをフォームに設定
  useEffect(() => {
    if (selectedDogId && userDogs.length > 0) {
      const selectedDog = userDogs.find(dog => dog.id === selectedDogId);
      if (selectedDog) {
        // 犬フォームの初期値を設定
        Object.keys(dogForm.getValues()).forEach(key => {
          if (key in selectedDog && selectedDog[key] !== null) {
            dogForm.setValue(key as any, selectedDog[key]);
          }
        });
        
        // 写真がある場合は設定
        if (selectedDog.photos_urls && selectedDog.photos_urls.length > 0) {
          setDogPhotoUrl(selectedDog.photos_urls[0]);
        }
      }
    }
  }, [selectedDogId, userDogs]);

  // ステップ変更を監視して犬のフォームをリセット
  useEffect(() => {
    if (step === 'dog' && !isEditMode) {
      // マウント状態を設定
      setIsFormMounted(true);
      
      // 犬フォームをリセット
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
      
      // 写真もリセット
      setDogPhotoUrl(null);
    }
  }, [step, dogForm, isEditMode]);

  // 編集モードを開始する関数
  const startEditMode = () => {
    setIsEditMode(true);
    setStep('user');
  };

  // 編集完了時の関数
  const completeEdit = () => {
    setIsEditMode(false);
    router.push('/discovery');
  };

  // 犬を選択する関数
  const selectDogForEdit = (dogId: string) => {
    setSelectedDogId(dogId);
    setStep('dog');
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('画像を選択してください');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');
      
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;
      
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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');
      
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;
      
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

  const handleIdFrontUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingIdFront(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('画像を選択してください');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');
      
      // ファイル名をシンプルに
      const fileName = `id_front_${Date.now()}.${fileExt}`;
      
      console.log('Uploading ID front:', fileName);
      
      // まずはシンプルなパスでアップロード試行
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('idverification')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error details:', uploadError);
        
        // 失敗した場合、ユーザーIDをつけて再試行
        console.log('Retrying with user folder...');
        const folderPath = `${user.id}/${fileName}`;
        
        const { error: retryError, data: retryData } = await supabase.storage
          .from('idverification')
          .upload(folderPath, file);
          
        if (retryError) {
          console.error('Retry upload failed:', retryError);
          throw retryError;
        }
        
        const { data } = supabase.storage.from('idverification').getPublicUrl(folderPath);
        console.log('Public URL generated:', data.publicUrl);
        
        setIdFrontUrl(data.publicUrl);
        verificationForm.setValue('id_front_url', data.publicUrl);
      } else {
        // 直接アップロードが成功した場合
        const { data } = supabase.storage.from('idverification').getPublicUrl(fileName);
        console.log('Public URL generated:', data.publicUrl);
        
        setIdFrontUrl(data.publicUrl);
        verificationForm.setValue('id_front_url', data.publicUrl);
      }
    } catch (error) {
      console.error('Error uploading ID front:', error);
      alert('身分証明書（表面）のアップロードに失敗しました。もう一度お試しください。');
    } finally {
      setUploadingIdFront(false);
    }
  };

  const handleIdBackUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingIdBack(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('画像を選択してください');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');
      
      // ファイル名をシンプルに
      const fileName = `id_back_${Date.now()}.${fileExt}`;
      
      console.log('Uploading ID back:', fileName);
      
      // まずはシンプルなパスでアップロード試行
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('idverification')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error details:', uploadError);
        
        // 失敗した場合、ユーザーIDをつけて再試行
        console.log('Retrying with user folder...');
        const folderPath = `${user.id}/${fileName}`;
        
        const { error: retryError, data: retryData } = await supabase.storage
          .from('idverification')
          .upload(folderPath, file);
          
        if (retryError) {
          console.error('Retry upload failed:', retryError);
          throw retryError;
        }
        
        const { data } = supabase.storage.from('idverification').getPublicUrl(folderPath);
        console.log('Public URL generated:', data.publicUrl);
        
        setIdBackUrl(data.publicUrl);
        verificationForm.setValue('id_back_url', data.publicUrl);
      } else {
        // 直接アップロードが成功した場合
        const { data } = supabase.storage.from('idverification').getPublicUrl(fileName);
        console.log('Public URL generated:', data.publicUrl);
        
        setIdBackUrl(data.publicUrl);
        verificationForm.setValue('id_back_url', data.publicUrl);
      }
    } catch (error) {
      console.error('Error uploading ID back:', error);
      alert('身分証明書（裏面）のアップロードに失敗しました。もう一度お試しください。');
    } finally {
      setUploadingIdBack(false);
    }
  };

  const onUserSubmit = async (data: z.infer<typeof userSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');

      // プロフィールがすでに存在するか確認
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      let profileError;

      if (existingProfile) {
        // 既存のプロフィールを更新
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
        
        profileError = error;
      } else {
        // 新規プロフィールを作成
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
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
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        profileError = error;
      }

      if (profileError) throw profileError;

      if (isEditMode) {
        // 編集モードの場合は犬の選択画面へ
        setStep('dog');
        return;
      }

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
      
      setIsFormMounted(false);
      setDogPhotoUrl(null);
      setStep('dog');

    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const onDogSubmit = async (data: z.infer<typeof dogSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');

      if (isEditMode && selectedDogId) {
        // 編集モードの場合は更新
        const { error } = await supabase
          .from('dogs')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedDogId)
          .eq('owner_id', user.id);

        if (error) throw error;

        // 犬の情報を再取得
        const { data: dogsData } = await supabase
          .from('dogs')
          .select('*')
          .eq('owner_id', user.id);

        if (dogsData) setUserDogs(dogsData);

        // 次のステップへ
        if (isProfileCompleted) {
          completeEdit();
        } else {
          setStep('verification');
        }
        
        return;
      }

      // 通常の新規登録処理
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
        setStep('verification');
      }
    } catch (error) {
      console.error('Error creating dog profile:', error);
    }
  };

  const onVerificationSubmit = async (data: z.infer<typeof idVerificationSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');

      // 既存の身分証明書情報を確認
      const { data: existingVerification } = await supabase
        .from('id_verification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVerification) {
        // 既存データの更新
        const { error: updateError } = await supabase
          .from('id_verification')
          .update({
            id_front_url: data.id_front_url,
            id_back_url: data.id_back_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingVerification.id);

        if (updateError) throw updateError;
      } else {
        // 新規データの挿入
        const { error: insertError } = await supabase
          .from('id_verification')
          .insert({
            user_id: user.id,
            id_front_url: data.id_front_url,
            id_back_url: data.id_back_url,
            verified: false,
            submitted_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      // プロフィール完了フラグを設定
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_profile_completed: true,
          is_id_verified: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile completion status:', profileError);
      }

      // 登録完了後はdiscoveryページへリダイレクト
      router.push('/discovery');
    } catch (error) {
      console.error('Error submitting ID verification:', error);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'user':
        return 'プロフィール登録';
      case 'dog':
        return '愛犬情報登録';
      case 'verification':
        return '身分証明書の提出';
      default:
        return '';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'user':
        return 'あなたについて教えてください';
      case 'dog':
        return '愛犬の情報を入力してください';
      case 'verification':
        return '安全なサービス提供のため、身分証明書の提出をお願いします';
      default:
        return '';
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 'user':
        return <UserCircle size={32} className="text-gray-700" />;
      case 'dog':
        return <Dog size={32} className="text-gray-700" />;
      case 'verification':
        return <CreditCard size={32} className="text-gray-700" />;
      default:
        return null;
    }
  };

  // 読み込み中の表示
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // プロフィール完了済みで編集モードでない場合は完了メッセージとボタンを表示
  if (isProfileCompleted && !isEditMode) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-0 rounded-3xl overflow-hidden shadow-md">
          <div className="bg-gray-100 p-6 text-center text-gray-800">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-white bg-opacity-20 p-4">
                <UserCircle size={32} className="text-gray-700" />
              </div>
            </div>
            <h2 className="text-xl font-bold">プロフィール完了</h2>
            <p className="text-sm mt-1 text-gray-600">
              すべての登録情報が完了しています
            </p>
          </div>
          <CardContent className="p-6 bg-white">
            <div className="text-center">
              <p className="mb-6 text-gray-600">
                プロフィール情報と愛犬情報の登録が完了しています。編集が必要な場合は下のボタンをクリックしてください。
              </p>
              <Button
                onClick={startEditMode}
                className="bg-gray-800 hover:bg-gray-900 text-white rounded-full py-3 px-6"
              >
                プロフィールを編集する
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 編集モードで犬の選択画面
  if (isEditMode && step === 'dog' && !selectedDogId && userDogs.length > 0) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-0 rounded-3xl overflow-hidden shadow-md">
          <div className="bg-gray-100 p-6 text-center text-gray-800">
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-white bg-opacity-20 p-4">
                <Dog size={32} className="text-gray-700" />
              </div>
            </div>
            <h2 className="text-xl font-bold">愛犬情報の編集</h2>
            <p className="text-sm mt-1 text-gray-600">
              編集する愛犬を選択してください
            </p>
          </div>
          <CardContent className="p-6 bg-white">
            <div className="space-y-4">
              {userDogs.map(dog => (
                <div
                  key={dog.id}
                  onClick={() => selectDogForEdit(dog.id)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 mr-4 overflow-hidden">
                    {dog.photos_urls && dog.photos_urls.length > 0 ? (
                      <img src={dog.photos_urls[0]} alt={dog.name} className="w-full h-full object-cover" />
                    ) : (
                      <Dog className="w-full h-full p-2 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{dog.name}</h3>
                    <p className="text-sm text-gray-500">{dog.breed}</p>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('user')}
                  className="w-full border-gray-300 text-gray-800 rounded-full"
                >
                  戻る
                </Button>
                {isProfileCompleted && (
                  <Button
                    onClick={completeEdit}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-full"
                  >
                    編集を終了
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-0 rounded-3xl overflow-hidden shadow-md">
        <div className="bg-gray-100 p-6 text-center text-gray-800">
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-white bg-opacity-20 p-4">
              {getStepIcon()}
            </div>
          </div>
          <h2 className="text-xl font-bold">
            {getStepTitle()}
          </h2>
          <p className="text-sm mt-1 text-gray-600">
            {getStepDescription()}
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
          ) : step === 'dog' ? (
            <div key={`dog-form-container-${isFormMounted ? 'mounted' : 'reset'}`}>
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
                            value={field.value || ''}
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
                            value={field.value || ''}
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
                              value={field.value || 0}
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
                              value={field.value || 0}
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
                          <Select onValueChange={field.onChange} value={field.value || ''}>
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
                          <Select onValueChange={field.onChange} value={field.value || ''}>
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
                            value={field.value || ''}
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
                            value={String(field.value)}
                            onValueChange={(val) => field.onChange(val === 'true')}
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
                            value={String(field.value)}
                            onValueChange={(val) => field.onChange(val === 'true')}
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
            </div>
          ) : (
            <Form {...verificationForm}>
              <form onSubmit={verificationForm.handleSubmit(onVerificationSubmit)} className="space-y-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-4">
                    ユーザーの安全確保のため、身分証明書の提出をお願いしています。
                    提出された情報は厳重に管理され、身分確認以外の目的には使用されません。
                  </p>
                </div>
                
                <div className="flex flex-col space-y-6">
                  <div>
                    <FormLabel className="text-sm text-gray-600 block mb-2">
                      身分証明書（表面） <span className="text-red-500">*</span>
                    </FormLabel>
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                      {idFrontUrl ? (
                        <img src={idFrontUrl} alt="身分証明書（表面）" className="w-full h-full object-contain" />
                      ) : (
                        <CreditCard className="w-12 h-12 text-gray-400" />
                      )}
                      <input
                        type="file"
                        id="idFront"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleIdFrontUpload}
                        disabled={uploadingIdFront}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gray-500 bg-opacity-80 text-white text-xs font-medium text-center py-1">
                        {uploadingIdFront ? '読込中...' : '表面の写真を選択'}
                      </div>
                    </div>
                    {verificationForm.formState.errors.id_front_url && (
                      <p className="text-red-500 text-xs mt-1">
                        {verificationForm.formState.errors.id_front_url.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <FormLabel className="text-sm text-gray-600 block mb-2">
                      身分証明書（裏面） <span className="text-red-500">*</span>
                    </FormLabel>
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                      {idBackUrl ? (
                        <img src={idBackUrl} alt="身分証明書（裏面）" className="w-full h-full object-contain" />
                      ) : (
                        <CreditCard className="w-12 h-12 text-gray-400" />
                      )}
                      <input
                        type="file"
                        id="idBack"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleIdBackUpload}
                        disabled={uploadingIdBack}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gray-500 bg-opacity-80 text-white text-xs font-medium text-center py-1">
                        {uploadingIdBack ? '読込中...' : '裏面の写真を選択'}
                      </div>
                    </div>
                    {verificationForm.formState.errors.id_back_url && (
                      <p className="text-red-500 text-xs mt-1">
                        {verificationForm.formState.errors.id_back_url.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('dog')}
                    className="w-full border-gray-300 text-gray-800 rounded-full"
                  >
                    戻る
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white rounded-full">
                    登録完了
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