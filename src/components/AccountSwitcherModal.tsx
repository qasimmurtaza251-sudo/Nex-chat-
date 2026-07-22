import React, { useState } from 'react';
import { Eye, EyeOff, Lock, LogIn, LogOut, Mail, ShieldCheck, User, UserPlus, X } from 'lucide-react';
import { useChat } from '../context/ChatContext';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, allUsers, loginUser, signupUser, logoutUser, setCurrentUserByEmail, isDarkMode } = useChat();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both Email and Password.');
      return;
    }

    setIsLoading(true);
    try {
      if (activeTab === 'login') {
        const res = await loginUser(email.trim(), password.trim());
        if (!res.success) {
          setError(res.error || 'Login failed. Check your password.');
        } else {
          setSuccess('Login successful!');
          setEmail('');
          setPassword('');
          setTimeout(() => onClose(), 600);
        }
      } else {
        const res = await signupUser(email.trim(), password.trim(), name.trim() || undefined);
        if (!res.success) {
          setError(res.error || 'Signup failed.');
        } else {
          setSuccess('Account created successfully!');
          setEmail('');
          setPassword('');
          setName('');
          setTimeout(() => onClose(), 600);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${
          isDarkMode ? 'bg-[#111b21] border-[#222d34] text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b ${
            isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-gray-200'
          }`}
        >
          <h3 className="font-bold text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Email & Password Authentication
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-500/20 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Active Logged In User Card */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              isDarkMode ? 'bg-[#202c33] border-emerald-500/40' : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm flex-shrink-0"
                style={{ backgroundColor: currentUser.avatarBgColor || '#10b981' }}
              >
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs flex items-center gap-1 truncate">
                  {currentUser.name}
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                </p>
                <p className="text-[11px] text-emerald-400 font-mono truncate">{currentUser.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-2.5 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg flex items-center gap-1 transition flex-shrink-0"
              title="Logout session"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>

          {/* Login / Sign Up Tabs */}
          <div className="flex rounded-lg bg-black/20 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 rounded-md transition flex items-center justify-center gap-1.5 ${
                activeTab === 'login'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 rounded-md transition flex items-center justify-center gap-1.5 ${
                activeTab === 'signup'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up (Register)
            </button>
          </div>

          {/* Alert Error / Success */}
          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}
          {success && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
              <span className="font-bold">Success:</span> {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {activeTab === 'signup' && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Full Display Name
                </label>
                <div
                  className={`flex items-center px-3 py-2 rounded-lg border text-xs ${
                    isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-gray-100 border-gray-300'
                  }`}
                >
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <input
                    type="text"
                    required={activeTab === 'signup'}
                    placeholder="e.g. Ali Raza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                Email Address
              </label>
              <div
                className={`flex items-center px-3 py-2 rounded-lg border text-xs ${
                  isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-gray-100 border-gray-300'
                }`}
              >
                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="email"
                  required
                  placeholder="e.g. realperson@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                Password
              </label>
              <div
                className={`flex items-center px-3 py-2 rounded-lg border text-xs ${
                  isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-gray-100 border-gray-300'
                }`}
              >
                <Lock className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="text-gray-400 hover:text-gray-200 ml-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-md transition"
            >
              {activeTab === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In with Password
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account & Register
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
