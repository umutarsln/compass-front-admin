"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Store, Eye, EyeOff, Lock, Server, HelpCircle, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login, isLoggingIn, loginError } = useAuth()
  const { toast } = useToast()

  // Hata mesajlarını toast olarak göster
  useEffect(() => {
    if (loginError) {
      const status = (loginError as any)?.response?.status
      const message =
        (loginError as any)?.response?.data?.message ||
        (loginError as any)?.message ||
        "Bir hata oluştu"

      // Sadece 500+ server hatalarını göster
      if (status && status >= 500) {
        toast({
          variant: "destructive",
          title: "Sunucu Hatası",
          description: message || "Sunucu hatası oluştu. Lütfen tekrar deneyin.",
        })
      }
      // 4xx hataları için genel mesaj
      else if (status && status >= 400 && status < 500) {
        toast({
          variant: "destructive",
          title: "Giriş Hatası",
          description: "Email veya şifre hatalı. Lütfen tekrar deneyin.",
        })
      }
    }
  }, [loginError, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      login({ email, password })
    } catch (err: any) {
      // Hata toast ile gösterilecek (useEffect'te)
    }
  }

  return (
    <div className="bg-[#f6f6f8] font-display antialiased min-h-screen flex flex-col items-center justify-center p-4">
      {/* Main Container */}
      <div className="w-full max-w-[480px] flex flex-col gap-6">
        {/* Logo Section */}
        <div className="flex justify-center mb-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <Store className="text-3xl" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e5e7eb] overflow-hidden">
          <div className="p-8 sm:p-10 flex flex-col gap-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-[#111318] text-2xl font-bold tracking-tight">
                Admin Access
              </h1>
              <p className="text-[#616f89] text-sm">
                Please enter your credentials to access the dashboard.
              </p>
            </div>

            {/* Form */}
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[#111318] text-sm font-medium leading-normal"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg text-[#111318] focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dbdfe6] bg-white focus:border-primary h-12 px-4 text-base font-normal placeholder:text-[#9ca3af] box-border"
                  placeholder="name@company.com"
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[#111318] text-sm font-medium leading-normal"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative w-full">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-lg text-[#111318] focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dbdfe6] bg-white focus:border-primary h-12 pl-4 pr-12 text-base font-normal placeholder:text-[#9ca3af] box-border"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-12 flex items-center justify-center pr-4 cursor-pointer text-[#616f89] hover:text-primary transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Options Row */}
              {/* <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                    style={{ accentColor: "#135bec" }}
                  />
                  <span className="text-sm text-[#616f89] group-hover:text-[#111318] transition-colors">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-sm font-medium text-primary hover:text-blue-700 transition-colors"
                >
                  Forgot Password?
                </a>
              </div> */}

              {/* Submit Button */}
              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-12 min-h-12 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed box-border"
                >
                  {isLoggingIn ? "Signing In..." : "Sign In"}
                  {!isLoggingIn && (
                    <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-0.5 transition-transform" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Banner */}
          <div className="bg-gray-50 px-8 py-4 border-t border-[#e5e7eb] flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-[#616f89]">
              <Lock className="w-4 h-4" />
              <span>Secure 256-bit SSL Encrypted Connection</span>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex items-center justify-center gap-6">
          <a
            href="#"
            className="text-sm text-[#616f89] hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Server className="w-[18px] h-[18px]" />
            System Status
          </a>
          <span className="text-gray-300">|</span>
          <a
            href="#"
            className="text-sm text-[#616f89] hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <HelpCircle className="w-[18px] h-[18px]" />
            Help Support
          </a>
        </div>
      </div>

      {/* Background Decoration Pattern */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cdefs%3E%3Cpattern id=\"grid\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"%3E%3Cpath d=\"M 20 0 L 0 0 0 20\" fill=\"none\" stroke=\"%23000\" stroke-width=\"0.5\" opacity=\"0.1\"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\"100%25\" height=\"100%25\" fill=\"url(%23grid)\" /%3E%3C/svg%3E')",
          backgroundSize: "20px 20px",
        }}
      />
    </div>
  )
}
