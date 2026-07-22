import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, User, Info, Check, X, ShieldCheck, RefreshCw, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

interface UserProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileSettings: React.FC<UserProfileSettingsProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const { isDarkMode } = useChat();

  const [displayName, setDisplayName] = useState('');
  const [aboutBio, setAboutBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [avatarBgColor, setAvatarBgColor] = useState('#10b981');

  // Camera capture state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const presetColors = ['#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444', '#64748b'];

  useEffect(() => {
    if (user && isOpen) {
      setDisplayName(user.name || '');
      setAboutBio(user.about || 'Hey there! I am using EmailChat 🚀');
      setAvatarUrl(user.avatarUrl);
      setAvatarBgColor(user.avatarBgColor || '#10b981');
      setIsCameraActive(false);
      setCameraError(null);
      setIsSaved(false);
    }
  }, [user, isOpen]);

  // Clean up camera stream when modal closes or camera component unmounts
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);

      // Give DOM time to mount video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.error('Video play error:', err));
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(err.message || 'Unable to access camera. Please allow camera permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 300, video.videoHeight || 300);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Crop square center frame
      const startX = ((video.videoWidth || size) - size) / 2;
      const startY = ((video.videoHeight || size) - size) / 2;
      ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setAvatarUrl(dataUrl);
    }

    stopCameraStream();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size is too large. Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(undefined);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSaving(true);
    try {
      await updateUser({
        name: displayName.trim(),
        about: aboutBio.trim(),
        avatarUrl: avatarUrl,
        avatarBgColor: avatarBgColor,
      });
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
          isDarkMode ? 'bg-[#111b21] border-[#222d34] text-[#e9edef]' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-gray-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-base">Profile Settings</h3>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-1 rounded-full hover:bg-gray-500/20 transition text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Avatar Picture Section */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative group">
              {/* Avatar Preview */}
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-lg border-4 border-emerald-500/30 overflow-hidden relative"
                style={{ backgroundColor: avatarBgColor }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name.slice(0, 2).toUpperCase()
                )}
              </div>

              {/* Verified Badge Overlay */}
              <div className="absolute bottom-1 right-1 p-1.5 bg-emerald-500 text-slate-950 rounded-full shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Live Camera Viewfinder Modal/Overlay inside Profile Card */}
            {isCameraActive && (
              <div className="w-full bg-black/90 p-3 rounded-xl flex flex-col items-center space-y-2 border border-emerald-500/40">
                <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 animate-pulse" />
                  Live Camera Viewfinder
                </p>
                <div className="w-48 h-48 rounded-xl overflow-hidden bg-black border-2 border-emerald-500 relative flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Snap Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {cameraError && (
              <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg text-center">
                {cameraError}
              </p>
            )}

            {/* Avatar Control Buttons */}
            {!isCameraActive && (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={startCamera}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition ${
                    isDarkMode
                      ? 'bg-[#202c33] border-[#2a3942] hover:border-emerald-500 text-emerald-400'
                      : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Camera Photo
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition ${
                    isDarkMode
                      ? 'bg-[#202c33] border-[#2a3942] hover:border-emerald-500 text-gray-200'
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  Upload Image
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Color Accent Picker for Initial Avatar */}
            {!avatarUrl && (
              <div className="flex items-center space-x-1.5 pt-1">
                <Palette className="w-3.5 h-3.5 text-gray-400 mr-1" />
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarBgColor(color)}
                    className={`w-5 h-5 rounded-full transition transform hover:scale-110 ${
                      avatarBgColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111b21]' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>

          <hr className={isDarkMode ? 'border-[#222d34]' : 'border-gray-200'} />

          {/* User Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                Your Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border font-medium focus:outline-none focus:border-emerald-500 ${
                  isDarkMode ? 'bg-[#202c33] border-[#2a3942] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
              <p className="text-[10px] text-gray-500 mt-1">
                This name is visible to all users you connect with on EmailChat.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-500" />
                About / Status Bio
              </label>
              <input
                type="text"
                value={aboutBio}
                onChange={(e) => setAboutBio(e.target.value)}
                placeholder="Hey there! I am using EmailChat 🚀"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border font-medium focus:outline-none focus:border-emerald-500 ${
                  isDarkMode ? 'bg-[#202c33] border-[#2a3942] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">
                Email Address (Account ID)
              </label>
              <div
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border font-mono opacity-70 ${
                  isDarkMode ? 'bg-[#202c33]/50 border-[#2a3942] text-emerald-400' : 'bg-gray-100 border-gray-300 text-emerald-700'
                }`}
              >
                {user.email}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving || !displayName.trim()}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                Saved Successfully!
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Profile Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
