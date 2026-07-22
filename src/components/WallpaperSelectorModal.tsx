import React from 'react';
import { Sparkles, X, Check } from 'lucide-react';
import { useChat } from '../context/ChatContext';

interface WallpaperSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WALLPAPERS = [
  { id: 'emerald', name: 'WhatsApp Emerald', bg: 'bg-[#0b141a]', border: 'border-emerald-500' },
  { id: 'doodle', name: 'Classic Doodle Light', bg: 'bg-[#efeae2]', border: 'border-amber-500' },
  { id: 'slate', name: 'Dark Slate', bg: 'bg-[#182229]', border: 'border-slate-500' },
  { id: 'midnight', name: 'Midnight Navy', bg: 'bg-[#0f172a]', border: 'border-indigo-500' },
];

export const WallpaperSelectorModal: React.FC<WallpaperSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { wallpaper, setWallpaper, isDarkMode } = useChat();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border ${
          isDarkMode ? 'bg-[#111b21] border-[#222d34] text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        <div
          className={`px-5 py-4 flex items-center justify-between border-b ${
            isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-gray-200'
          }`}
        >
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Chat Wallpaper Theme
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-500/20 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-gray-400">
            Choose a background theme for your conversation area:
          </p>

          <div className="grid grid-cols-2 gap-3">
            {WALLPAPERS.map((wp) => {
              const isSelected = wallpaper === wp.id;
              return (
                <div
                  key={wp.id}
                  onClick={() => {
                    setWallpaper(wp.id);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col items-center justify-center h-24 ${wp.bg} ${
                    isSelected ? 'ring-2 ring-emerald-500 border-transparent shadow-lg' : 'border-gray-700/40 hover:scale-105'
                  }`}
                >
                  <span className="text-xs font-bold text-white shadow-sm mb-1">{wp.name}</span>
                  {isSelected && (
                    <span className="p-1 bg-emerald-500 text-slate-950 rounded-full">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
