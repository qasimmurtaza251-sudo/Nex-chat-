import React, { useState } from 'react';
import {
  MessageSquare,
  CheckCheck,
  CircleDashed,
  Moon,
  Plus,
  Search,
  Sun,
  UserPlus,
  Users,
  Video,
  Volume2,
  Mail,
  User,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { useChat } from '../context/ChatContext';

interface SidebarProps {
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenAccountSwitcher: () => void;
  onOpenStatusModal: () => void;
  onOpenProfileSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenNewChat,
  onOpenNewGroup,
  onOpenAccountSwitcher,
  onOpenStatusModal,
  onOpenProfileSettings,
}) => {
  const {
    currentUser,
    allUsers,
    chats,
    activeChat,
    setActiveChat,
    isDarkMode,
    toggleDarkMode,
    searchFilter,
    setSearchFilter,
    activeTab,
    setActiveTab,
    typingUsers,
  } = useChat();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>('all');

  // Filter chats by search and active filter tab
  const filteredChats = chats.filter((chat) => {
    // Tab filtering
    if (activeTab === 'groups' && !chat.isGroup) return false;

    // Sub-filter buttons
    if (activeFilter === 'groups' && !chat.isGroup) return false;
    if (activeFilter === 'unread') {
      const count = chat.unreadCount[currentUser.email] || 0;
      if (count === 0) return false;
    }

    // Search query
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchName = chat.name.toLowerCase().includes(q);
      const matchEmail = chat.email?.toLowerCase().includes(q);
      const matchMembers = chat.members.some((m) => m.toLowerCase().includes(q));
      return matchName || matchEmail || matchMembers;
    }

    return true;
  });

  const getInitials = (name: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'EC';
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside
      className={`w-full md:w-96 flex-shrink-0 flex flex-col h-full border-r ${
        isDarkMode ? 'bg-[#111b21] text-[#e9edef] border-[#222d34]' : 'bg-white text-gray-900 border-gray-200'
      }`}
    >
      {/* Top Header */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b ${
          isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-gray-200'
        }`}
      >
        {/* User Profile Summary */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={onOpenProfileSettings || onOpenAccountSwitcher}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm relative overflow-hidden flex-shrink-0"
            style={{ backgroundColor: currentUser.avatarBgColor || '#10b981' }}
          >
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(currentUser.name, currentUser.email)
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full z-10"></span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate leading-tight flex items-center gap-1 group-hover:text-emerald-400 transition">
              {currentUser.name}
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            </span>
            <span className={`text-xs truncate flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Mail className="w-3 h-3 flex-shrink-0 text-emerald-500" />
              {currentUser.email}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-0.5">
          {onOpenProfileSettings && (
            <button
              onClick={onOpenProfileSettings}
              title="Profile & Camera Settings"
              className={`p-2 rounded-full transition ${
                isDarkMode ? 'hover:bg-[#374248] text-gray-300' : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              <Settings className="w-5 h-5 text-emerald-500" />
            </button>
          )}

          <button
            onClick={onOpenStatusModal}
            title="Status Updates / Stories"
            className={`p-2 rounded-full transition ${
              isDarkMode ? 'hover:bg-[#374248] text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <CircleDashed className="w-5 h-5 text-emerald-500" />
          </button>

          <button
            onClick={onOpenNewGroup}
            title="New Group Chat"
            className={`p-2 rounded-full transition ${
              isDarkMode ? 'hover:bg-[#374248] text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <Users className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenNewChat}
            title="New Email Chat"
            className={`p-2 rounded-full transition ${
              isDarkMode ? 'hover:bg-[#374248] text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <UserPlus className="w-5 h-5 text-emerald-500" />
          </button>

          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            className={`p-2 rounded-full transition ${
              isDarkMode ? 'hover:bg-[#374248] text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className={`flex border-b text-xs font-semibold ${isDarkMode ? 'bg-[#111b21] border-[#222d34]' : 'bg-white border-gray-200'}`}>
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition ${
            activeTab === 'chats'
              ? 'border-emerald-500 text-emerald-500 font-bold'
              : isDarkMode
              ? 'border-transparent text-gray-400 hover:text-gray-200'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chats ({chats.length})
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition ${
            activeTab === 'status'
              ? 'border-emerald-500 text-emerald-500 font-bold'
              : isDarkMode
              ? 'border-transparent text-gray-400 hover:text-gray-200'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <CircleDashed className="w-4 h-4" />
          Status
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition ${
            activeTab === 'groups'
              ? 'border-emerald-500 text-emerald-500 font-bold'
              : isDarkMode
              ? 'border-transparent text-gray-400 hover:text-gray-200'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Groups
        </button>
      </div>

      {/* Email Connection Banner */}
      <div className={`px-3 py-2 text-xs flex items-center justify-between border-b ${
        isDarkMode ? 'bg-[#202c33]/50 text-emerald-400 border-[#222d34]' : 'bg-emerald-50 text-emerald-800 border-emerald-100'
      }`}>
        <span className="flex items-center gap-1.5 truncate">
          <Mail className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          Connect with Email ID (No Phone Needed)
        </span>
        <button
          onClick={onOpenAccountSwitcher}
          className="text-[11px] font-semibold underline hover:text-emerald-300 flex-shrink-0"
        >
          Switch Email
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="p-2.5">
        <div
          className={`flex items-center px-3 py-2 rounded-lg text-sm ${
            isDarkMode ? 'bg-[#202c33] text-gray-200' : 'bg-[#f0f2f5] text-gray-800'
          }`}
        >
          <Search className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search chat or enter Email ID..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-transparent focus:outline-none placeholder-gray-400 text-xs md:text-sm"
          />
          {searchFilter && (
            <button onClick={() => setSearchFilter('')} className="text-gray-400 text-xs hover:text-gray-200">
              Clear
            </button>
          )}
        </div>

        {/* Quick Filter Pills */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              activeFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : isDarkMode
                ? 'bg-[#202c33] text-gray-300 hover:bg-[#2a3942]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              activeFilter === 'unread'
                ? 'bg-emerald-600 text-white'
                : isDarkMode
                ? 'bg-[#202c33] text-gray-300 hover:bg-[#2a3942]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setActiveFilter('groups')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              activeFilter === 'groups'
                ? 'bg-emerald-600 text-white'
                : isDarkMode
                ? 'bg-[#202c33] text-gray-300 hover:bg-[#2a3942]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Chat List Scroll Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-transparent">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDarkMode ? 'bg-[#202c33] text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
              <Mail className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold mb-1">No chats found</p>
            <p className={`text-xs mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchFilter
                ? `No conversation for "${searchFilter}"`
                : 'Start a conversation with anyone by their Email ID!'}
            </p>
            <button
              onClick={onOpenNewChat}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              Chat by Email ID
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = activeChat?.id === chat.id;
            const unread = chat.unreadCount[currentUser.email] || 0;
            const typers = typingUsers[chat.id] || [];
            const isTyping = typers.length > 0;

            // Target contact profile info
            const contactUser = !chat.isGroup
              ? allUsers.find((u) => u.email.toLowerCase() === chat.email?.toLowerCase())
              : null;

            return (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`flex items-center px-4 py-3 cursor-pointer transition relative ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-[#2a3942]'
                      : 'bg-emerald-50'
                    : isDarkMode
                    ? 'hover:bg-[#202c33]'
                    : 'hover:bg-gray-100'
                }`}
              >
                {/* Avatar Icon */}
                <div className="relative flex-shrink-0 mr-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-base shadow-sm"
                    style={{
                      backgroundColor:
                        chat.avatarBgColor || (chat.isGroup ? '#6366f1' : '#10b981'),
                    }}
                  >
                    {chat.isGroup ? (
                      <Users className="w-6 h-6" />
                    ) : (
                      getInitials(chat.name, chat.email)
                    )}
                  </div>
                  {!chat.isGroup && contactUser?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#111b21] rounded-full"></span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 border-b border-transparent pb-0.5">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-sm truncate flex items-center gap-1">
                      {chat.name}
                      {chat.isGroup && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">
                          Group
                        </span>
                      )}
                    </h3>
                    {chat.lastMessage && (
                      <span
                        className={`text-[11px] ml-2 flex-shrink-0 ${
                          unread > 0
                            ? 'text-emerald-500 font-semibold'
                            : isDarkMode
                            ? 'text-gray-400'
                            : 'text-gray-500'
                        }`}
                      >
                        {formatTimestamp(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <p
                      className={`truncate flex items-center gap-1 ${
                        isTyping
                          ? 'text-emerald-500 font-semibold italic'
                          : unread > 0
                          ? isDarkMode
                            ? 'text-gray-100 font-medium'
                            : 'text-gray-900 font-medium'
                          : isDarkMode
                          ? 'text-gray-400'
                          : 'text-gray-500'
                      }`}
                    >
                      {isTyping ? (
                        'Typing...'
                      ) : chat.lastMessage ? (
                        <>
                          {chat.lastMessage.senderEmail === currentUser.email && (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 inline" />
                          )}
                          <span className="truncate">{chat.lastMessage.content}</span>
                        </>
                      ) : (
                        <span className="italic opacity-70">
                          {chat.email ? chat.email : 'Tap to chat'}
                        </span>
                      )}
                    </p>

                    {unread > 0 && (
                      <span className="ml-2 bg-emerald-500 text-slate-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                        {unread}
                      </span>
                    )}
                  </div>

                  {!chat.isGroup && chat.email && (
                    <div className="mt-1 flex items-center text-[11px] text-gray-400 opacity-80">
                      <Mail className="w-3 h-3 mr-1 text-emerald-500" />
                      <span className="truncate">{chat.email}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
