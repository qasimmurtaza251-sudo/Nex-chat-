import React, { useState } from 'react';
import { CircleDashed, Image, Plus, Send, X, Eye } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { StatusItem } from '../types';

interface StatusViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_COLORS = ['#047857', '#4f46e5', '#be185d', '#b45309', '#0369a1', '#6b21a8'];

export const StatusViewerModal: React.FC<StatusViewerModalProps> = ({ isOpen, onClose }) => {
  const { statuses, postStatus, currentUser, isDarkMode } = useChat();

  const [activeStatus, setActiveStatus] = useState<StatusItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [selectedColor, setSelectedColor] = useState(STATUS_COLORS[0]);

  if (!isOpen) return null;

  const handleCreateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim()) return;

    postStatus(newCaption.trim(), undefined, selectedColor);
    setNewCaption('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-lg h-[550px] rounded-2xl shadow-2xl overflow-hidden flex flex-col border ${
          isDarkMode ? 'bg-[#111b21] border-[#222d34] text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3.5 flex items-center justify-between border-b ${
            isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CircleDashed className="w-5 h-5 text-emerald-500 animate-spin-slow" />
            <h3 className="font-bold text-sm">Status Updates / Stories</h3>
          </div>
          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow"
              >
                <Plus className="w-4 h-4" /> Add Status
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-500/20 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isCreating ? (
          /* Create New Status View */
          <div
            className="flex-1 p-6 flex flex-col justify-between"
            style={{ backgroundColor: selectedColor }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/80 font-bold uppercase tracking-wider">
                Create Text Status
              </span>
              <button
                onClick={() => setIsCreating(false)}
                className="text-white text-xs underline"
              >
                Cancel
              </button>
            </div>

            <textarea
              rows={4}
              placeholder="Type a status message... (e.g. Launched new app! Comment 'I'm Interested')"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              className="w-full bg-transparent text-white placeholder-white/60 text-xl font-bold text-center focus:outline-none resize-none"
            />

            <div>
              <div className="flex justify-center gap-2 mb-4">
                {STATUS_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      selectedColor === color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <button
                onClick={handleCreateStatus}
                disabled={!newCaption.trim()}
                className="w-full py-3 bg-white text-slate-950 hover:bg-gray-100 disabled:opacity-50 text-sm font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Post Status
              </button>
            </div>
          </div>
        ) : activeStatus ? (
          /* Single Status Viewer */
          <div
            className="flex-1 p-6 flex flex-col justify-between text-white relative"
            style={{ backgroundColor: activeStatus.bgColor || '#047857' }}
          >
            {/* Top Bar with User Info */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm border-2 border-white"
                  style={{ backgroundColor: activeStatus.avatarBgColor || '#10b981' }}
                >
                  {activeStatus.userName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm">{activeStatus.userName}</p>
                  <p className="text-[11px] text-white/80">{activeStatus.userEmail}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveStatus(null)}
                className="p-1 hover:bg-white/20 rounded-full text-xs font-semibold underline"
              >
                Back to All
              </button>
            </div>

            {/* Status Content */}
            <div className="text-center px-4 my-auto">
              {activeStatus.mediaUrl && (
                <img
                  src={activeStatus.mediaUrl}
                  alt="Status media"
                  className="max-h-60 rounded-xl mx-auto mb-4 border border-white/20 shadow-xl"
                />
              )}
              <p className="text-xl font-bold leading-relaxed">{activeStatus.caption}</p>
            </div>

            {/* Viewers Footer */}
            <div className="flex items-center justify-center gap-2 text-xs text-white/80">
              <Eye className="w-4 h-4" />
              <span>
                Viewed by {activeStatus.viewers.length} contacts
              </span>
            </div>
          </div>
        ) : (
          /* List of Statuses */
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Recent Updates
            </span>

            {statuses.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No status updates yet. Be the first to share one!
              </div>
            ) : (
              statuses.map((status) => (
                <div
                  key={status.id}
                  onClick={() => setActiveStatus(status)}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition ${
                    isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-100'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-full p-0.5 border-2 border-emerald-500 mr-3 flex-shrink-0"
                  >
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: status.avatarBgColor || '#10b981' }}
                    >
                      {status.userName.slice(0, 2).toUpperCase()}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{status.userName}</p>
                    <p className="text-xs text-emerald-400 truncate font-medium">
                      "{status.caption}"
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {status.userEmail} • {new Date(status.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
