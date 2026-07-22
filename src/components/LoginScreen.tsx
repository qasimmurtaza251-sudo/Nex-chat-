import React, { useState } from 'react';
import { Mail, Lock, User, LogIn, UserPlus, Eye, EyeOff, ShieldCheck, CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login, signup } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFoundEmail, setNotFoundEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setNotFoundEmail(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both Email ID and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeTab === 'login') {
        const res = await login(email.trim(), password.trim());
        if (!res.success) {
          setError(res.error || 'Failed to sign in. Please check your credentials.');
          if (res.error?.toLowerCase().includes('not found') || res.error?.toLowerCase().includes('sign up')) {
            setNotFoundEmail(email.trim());
          }
        } else {
          setSuccess('Login successful! Redirecting...');
        }
      } else {
        const res = await signup(email.trim(), password.trim(), name.trim() || undefined);
        if (!res.success) {
          setError(res.error || 'Failed to register account.');
        } else {
          setSuccess('Account created successfully! Welcome to EmailChat.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchToSignUp = () => {
    setActiveTab('signup');
    setError(null);
    setNotFoundEmail(null);
  };

  return (
    <div className="min-h-screen bg-[#0c1317] text-gray-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-black">
      {/* Background Subtle Gradient Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* App Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 mb-2">
            <MessageSquare className="w-9 h-9 text-slate-950" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            EmailChat
          </h1>
          <p className="text-xs text-emerald-400 font-medium">
            Connect & Chat with Anyone using their Email ID
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#111b21] border border-[#222d34] rounded-2xl p-6 shadow-2xl space-y-5">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#202c33] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setSuccess(null);
                setNotFoundEmail(null);
              }}
              className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-emerald-600 text-white font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setError(null);
                setSuccess(null);
                setNotFoundEmail(null);
              }}
              className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'signup'
                  ? 'bg-emerald-600 text-white font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl space-y-2 animate-fadeIn">
              <div className="flex items-start gap-2">
                <span className="font-bold shrink-0">⚠️ Error:</span>
                <span>{error}</span>
              </div>
              {notFoundEmail && (
                <button
                  type="button"
                  onClick={switchToSignUp}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition text-[11px]"
                >
                  Create Account for {notFoundEmail} Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'signup' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-300">
                  Full Name / Display Name
                </label>
                <div className="flex items-center px-3.5 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl focus-within:border-emerald-500 transition">
                  <User className="w-4 h-4 text-emerald-500 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    required={activeTab === 'signup'}
                    placeholder="e.g. Your Display Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-300">
                Email Address ID
              </label>
              <div className="flex items-center px-3.5 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl focus-within:border-emerald-500 transition">
                <Mail className="w-4 h-4 text-emerald-500 mr-2.5 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="e.g. your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-300">
                Password
              </label>
              <div className="flex items-center px-3.5 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-xl focus-within:border-emerald-500 transition">
                <Lock className="w-4 h-4 text-emerald-500 mr-2.5 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-white ml-2 shrink-0 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !password.trim()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : activeTab === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In to EmailChat
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account & Enter
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Real-time messaging platform powered by Email ID
        </p>
      </div>
    </div>
  );
};
