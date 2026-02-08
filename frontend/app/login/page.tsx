"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Stethoscope, Lock, Mail, Loader2, ArrowRight, User } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [fullName, setFullName] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/");
    } else {
      setIsPageLoading(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const loadingToast = toast.loading(isLogin ? "Logging in..." : "Creating account...");

    try {
      if (isLogin) {
        const formData = new FormData();
        formData.append("username", email);
        formData.append("password", password);

        // CHANGE URL IF DEPLOYED
        const res = await axios.post("http://localhost:8000/token", formData);
        
        localStorage.setItem("token", res.data.access_token);
        if(res.data.user_name) localStorage.setItem("userName", res.data.user_name);
        if(res.data.user_email) localStorage.setItem("userEmail", res.data.user_email);
        
        toast.dismiss(loadingToast);
        toast.success(`Welcome back, ${res.data.user_name || 'Doctor'}!`);
        
        setEmail("");
        setPassword("");

        setTimeout(() => router.push("/"), 1000);

      } else {
        await axios.post("http://localhost:8000/register", { 
          email, 
          password,
          full_name: fullName
        });
        
        toast.dismiss(loadingToast);
        toast.success("Account created! Please log in.");
        
        setEmail("");
        setPassword("");
        setFullName("");

        setIsLogin(true); 
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errorMessage = err.response?.data?.detail || "Something went wrong.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/20 mb-4">
            <Stethoscope className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLogin ? "Access your medical dashboard" : "Join MediScribe AI today"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                  placeholder="Dr. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                placeholder="doctor@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 mt-6"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail("");
                setPassword("");
                setFullName(""); 
              }}
              className="ml-2 font-bold text-blue-600 hover:underline focus:outline-none"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}