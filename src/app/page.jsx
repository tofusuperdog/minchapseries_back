'use client';
import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const errorTimeoutRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const showErrorMsg = (msg) => {
    setError(msg);
    setErrorVisible(true);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorVisible(false);
    }, 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorVisible(false);

    if (!username.trim() || !password.trim()) {
      showErrorMsg('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน');
      return;
    }

    setIsLoading(true);

    const { data, error: dbError } = await supabase
      .from('user')
      .select('*')
      .eq('username', username.trim())
      .eq('password', password.trim())
      .single();

    if (dbError || !data) {
      showErrorMsg('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      setIsLoading(false);
      return;
    }

    // Store user data in auth context
    login(data);
    router.push('/dashboard');
  };

  return (
    <>
      {/* Error Notification */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${errorVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-[#D24949] text-white px-6 py-3.5 rounded shadow-2xl flex items-center space-x-4 w-max min-w-[300px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 20H2L12 2ZM11 16V18H13V16H11ZM11 10V14H13V10H11Z"/>
          </svg>
          <span className="font-medium tracking-wide">{error}</span>
        </div>
      </div>

      {/* Mobile & Tablet Not Supported Message */}
      <div className="flex lg:hidden min-h-screen items-center justify-center bg-gradient-to-br from-[#11154D] to-[#291337]">
        <div className="text-center px-6 flex flex-col items-center">
          <div className="relative w-[280px] h-[80px] mb-8">
            <Image
              src="/minchap_tiktok.svg"
              alt="minChap TikTok"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">ไม่รองรับการใช้งานบนอุปกรณ์นี้</h1>
          <p className="text-gray-300 font-light mb-8">กรุณาเข้าใช้งานผ่านคอมพิวเตอร์ (PC) เท่านั้น</p>
          <a 
            href="https://www.minchapseries.com" 
            className="px-6 py-2.5 bg-[#6a90f1] hover:bg-[#567ce2] transition-colors rounded text-white font-medium text-[15px]"
          >
            กลับสู่หน้าหลัก
          </a>
        </div>
      </div>

      {/* PC UI */}
      <div className="hidden lg:flex min-h-screen items-center justify-center bg-gradient-to-br from-[#11154D] to-[#291337] relative">
        <div className="flex items-center justify-center max-w-5xl w-full">
          {/* Left Side: Logo & Subtitle */}
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative w-[360px] h-[100px] flex items-center justify-center">
              <Image
                src="/Minchaplogo.webp"
                alt="minChap Logo"
                fill
                sizes="320px"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <p className="text-base font-light text-gray-200 tracking-wide mt-[-12px]">
              TikTok Minis CMS
            </p>
          </div>

          {/* Vertical Divider */}
          <div className="h-[320px] w-px bg-white/30 mx-8"></div>

          {/* Right Side: Login Form */}
          <div className="flex flex-col justify-center flex-1 px-12">
            <h2 className="text-2xl font-bold text-white text-center mb-10 tracking-wide">
              ยินดีต้อนรับ
            </h2>

            <form onSubmit={handleLogin} className="w-full max-w-[320px] mx-auto space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-light text-gray-200 mb-1.5">
                  ชื่อผู้ใช้งาน
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  className="w-full h-11 px-3 bg-[#d9d9d9] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#709bf0]"
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-light text-gray-200 mb-1.5">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full h-11 px-3 pr-10 bg-[#d9d9d9] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#709bf0]"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.5 6.5m3.378 3.378a3 3 0 004.243 4.243m0 0L17.5 17.5m-3.379-3.379L6.5 6.5m0 0L3 3m3.5 3.5L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message is now handled via top notification */}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center w-full h-11 bg-[#6a90f1] hover:bg-[#567ce2] transition-colors rounded text-white font-medium text-[15px] cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Version String bottom right */}
        <div className="absolute bottom-6 right-8 text-sm text-gray-300 font-light">
          v0.01.00
        </div>
      </div>
    </>
  );
}
