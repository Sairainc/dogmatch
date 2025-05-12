import { RegistrationForm } from '@/components/forms/RegistrationForm'
import Image from 'next/image'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-gray-100 py-10 relative overflow-hidden">
      {/* 装飾要素 */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-pink-100 opacity-50" />
      <div className="absolute top-1/3 -left-20 w-40 h-40 rounded-full bg-pink-100 opacity-30" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-pink-100 opacity-20" />
      
      {/* メインコンテンツ */}
      <div className="relative z-10">
        <RegistrationForm />
      </div>
    </div>
  )
} 