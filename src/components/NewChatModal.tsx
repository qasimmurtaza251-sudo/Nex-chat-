import React, { useState } from 'react';
import { Mail, Plus, Search, Users, X, Check } from 'lucide-react';
import { useChat } from '../context/ChatContext';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'chat' | 'group';
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
}) => {
  const { allUsers, currentUser, findOrCreateChat, createGroupChat, isDarkMode } = useChat();

  const [mode, setMode] = useState<'chat' | 'group'>(initialMode);
  const [emailQuery, setEmailQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedGroupEmails, setSelectedGroupEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleStartChat = async (targetEmail: string) => {
    setIsLoading(true);
    try {
      await findOrCreateChat(targetEmail);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedGroupEmails.length === 0) return;
    setIsLoading(true);
    try {
      await createGroupChat(groupName.trim(), selectedGroupEmails);
      setGroupName('');
      setSelectedGroupEmails([]);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectGroupEmail = (email: string) => {
    if (selectedGroupEmails.includes(email)) {
      setSelectedGroupEmails((prev) => prev.filter((e) => e !== email));
    } else {
      setSelectedGroupEmails((prev) => [...prev, email]);
    }
  };

  const otherUsers = allUsers.filter(
    (u) => u.email.toLowerCase() !== currentUser.email.toLowerCase()
  );

  const filteredUsers = otherUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(emailQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(emailQuery.toLowerCase())
  );

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
            {mode === 'chat' ? (
              <>
                <Mail className="w-5 h-5 text-emerald-500" />
                New Chat by Email ID
              </>
            ) : (
              <>
                <Users className="w-5 h-5 text-indigo-400" />
                Create New Group Chat
              </>
            )}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-500/20 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex border-b border-gray-700/30 text-xs font-semibold">
          <button
            onClick={() => setMode('chat')}
            className={`flex-1 py-2.5 text-center border-b-2 transition ${
              mode === 'chat'
                ? 'border-emerald-500 text-emerald-500 font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Direct Chat
          </button>
          <button
            onClick={() => setMode('group')}
            className={`flex-1 py-2.5 text-center border-b-2 transition ${
              mode === 'group'
                ? 'border-emerald-500 text-emerald-500 font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Group Chat
          </button>
        </div>

        <div className="p-5 space-y-4">
          {mode === 'group' && (
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Group Title</label>
              <input
                type="text"
                placeholder="e.g. Pakistan Tech Founders 🚀"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:border-emerald-500 ${
                  isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-gray-100 border-gray-300'
                }`}
              />
            </div>
          )}

          {/* Email Search Input */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">
              {mode === 'chat' ? 'Enter Friend\'s Email Address' : 'Select Email Members'}
            </label>
            <div
              className={`flex items-center px-3 py-2 rounded-lg border text-sm ${
                isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-gray-100 border-gray-300'
              }`}
            >
              <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
              <input
                type="email"
                placeholder="e.g. ali@gmail.com, sarah.dev@gmail.com..."
                value={emailQuery}
                onChange={(e) => setEmailQuery(e.target.value)}
                className="w-full bg-transparent focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Direct Custom Email Trigger Button if search has custom email */}
          {emailQuery.includes('@') && mode === 'chat' && (
            <div className="space-y-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-400">Target Email:</span>
                {allUsers.some((u) => u.email.toLowerCase() === emailQuery.trim().toLowerCase()) ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    ✓ Registered EmailChat User
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                    ✉️ New Email Address
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-300">
                {allUsers.some((u) => u.email.toLowerCase() === emailQuery.trim().toLowerCase())
                  ? 'This person is registered! Messages sent will be delivered to their inbox instantly.'
                  : 'Start chat now! When this person logs in or registers with this email, all sent messages will be waiting in their inbox.'}
              </p>
              <button
                onClick={() => handleStartChat(emailQuery.trim())}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-md transition"
              >
                <Mail className="w-4 h-4" />
                Start Real Chat with "{emailQuery.trim()}"
              </button>
            </div>
          )}

          {/* Directory List of Users */}
          <div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Available Email Contacts
            </span>
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {filteredUsers.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">
                  No directory match. Type any valid email above to connect!
                </p>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedGroupEmails.includes(user.email);
                  return (
                    <div
                      key={user.email}
                      onClick={() => {
                        if (mode === 'chat') {
                          handleStartChat(user.email);
                        } else {
                          toggleSelectGroupEmail(user.email);
                        }
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                        isDarkMode ? 'hover:bg-[#202c33]' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm flex-shrink-0"
                          style={{ backgroundColor: user.avatarBgColor || '#10b981' }}
                        >
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate">{user.name}</p>
                          <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-emerald-500 inline" />
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {mode === 'group' && (
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-gray-500'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Submit Group Button */}
          {mode === 'group' && (
            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedGroupEmails.length === 0 || isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md transition"
            >
              Create Group ({selectedGroupEmails.length} members)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
