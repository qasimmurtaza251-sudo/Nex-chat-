import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCheck,
  Download,
  FileText,
  Mail,
  MoreVertical,
  Phone,
  Play,
  Pause,
  Search,
  ShieldCheck,
  Smile,
  Trash2,
  Users,
  Video,
  Volume2,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Message } from '../types';
import { MessageInput } from './MessageInput';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ChatAreaProps {
  onOpenWallpaperModal: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ onOpenWallpaperModal }) => {
  const {
    currentUser,
    allUsers,
    activeChat,
    messages,
    typingUsers,
    isDarkMode,
    wallpaper,
    addReaction,
    startCall,
  } = useChat();
  const { switchUserByEmail } = useAuth();

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);
  const [searchInChatQuery, setSearchInChatQuery] = useState<string>('');
  const [showSearchInChat, setShowSearchInChat] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  if (!activeChat) {
    return (
      <main
        className={`flex-1 flex flex-col items-center justify-center p-8 text-center ${
          isDarkMode ? 'bg-[#222e35] text-gray-300' : 'bg-[#f0f2f5] text-gray-700'
        }`}
      >
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
          <Mail className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">EmailChat Web</h2>
        <p className="max-w-md text-sm text-gray-400 mb-6 leading-relaxed">
          Send & receive fast, secure messages using <strong>Email IDs</strong> instead of phone numbers. Select a chat from the sidebar or click "Chat by Email ID" to connect.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          End-to-End Encrypted via Email Identifier
        </div>
      </main>
    );
  }

  // Target Contact or Group metadata
  const contactUser = !activeChat.isGroup
    ? allUsers.find((u) => u.email.toLowerCase() === activeChat.email?.toLowerCase())
    : null;

  const typers = typingUsers[activeChat.id] || [];
  const isTyping = typers.length > 0;

  // Filter messages if search inside chat is open
  const filteredMessages = searchInChatQuery.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchInChatQuery.toLowerCase())
      )
    : messages;

  const handleToggleAudio = (msgId: string, audioUrl: string) => {
    if (playingAudioId === msgId) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const newAudio = new Audio(audioUrl);
      audioRef.current = newAudio;
      newAudio.play();
      setPlayingAudioId(msgId);
      newAudio.onended = () => setPlayingAudioId(null);
    }
  };

  const getInitials = (name: string, email?: string) => {
    if (name) return name.slice(0, 2).toUpperCase();
    if (email) return email.slice(0, 2).toUpperCase();
    return 'EC';
  };

  const formatMessageTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // WhatsApp wallpaper background styles
  const getWallpaperStyle = () => {
    if (wallpaper === 'emerald') {
      return isDarkMode
        ? 'bg-[#0b141a] bg-gradient-to-b from-[#0b141a] to-[#071015]'
        : 'bg-[#efeae2]';
    }
    if (wallpaper === 'midnight') {
      return 'bg-[#0f172a]';
    }
    if (wallpaper === 'slate') {
      return 'bg-[#182229]';
    }
    return isDarkMode ? 'bg-[#0b141a]' : 'bg-[#e5ddd5]';
  };

  return (
    <main className="flex-1 flex flex-col h-full min-w-0 relative">
      {/* Active Conversation Header */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b z-10 ${
          isDarkMode ? 'bg-[#202c33] border-[#222d34] text-white' : 'bg-[#f0f2f5] border-gray-200 text-gray-900'
        }`}
      >
        <div className="flex items-center space-x-3 min-w-0 cursor-pointer">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm relative flex-shrink-0"
            style={{
              backgroundColor:
                activeChat.avatarBgColor || (activeChat.isGroup ? '#6366f1' : '#10b981'),
            }}
          >
            {activeChat.isGroup ? (
              <Users className="w-5 h-5" />
            ) : (
              getInitials(activeChat.name, activeChat.email)
            )}
            {!activeChat.isGroup && contactUser?.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <h2 className="font-semibold text-sm truncate flex items-center gap-1.5">
              {activeChat.name}
              {activeChat.isGroup && (
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-normal">
                  {activeChat.members.length} members
                </span>
              )}
            </h2>
            <p className="text-xs text-emerald-400 truncate flex items-center gap-1">
              {isTyping ? (
                <span className="animate-pulse font-semibold">typing...</span>
              ) : activeChat.isGroup ? (
                <span className={`truncate text-gray-400`}>
                  {activeChat.members.join(', ')}
                </span>
              ) : contactUser?.isOnline ? (
                <span className="text-emerald-400 font-medium">Online</span>
              ) : (
                <span className="text-gray-400">{activeChat.email}</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowSearchInChat((p) => !p)}
            title="Search inside conversation"
            className={`p-2 rounded-full transition ${
              isDarkMode ? 'hover:bg-[#374248] text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <Search className="w-5 h-5" />
          </button>

          {!activeChat.isGroup && activeChat.email && (
            <>
              {activeChat.email.toLowerCase() !== currentUser?.email.toLowerCase() && (
                <button
                  onClick={() => switchUserByEmail(activeChat.email!)}
                  title={`Switch account to ${activeChat.name} to reply manually`}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 rounded-lg text-xs font-semibold transition shrink-0"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Reply as {activeChat.name.split(' ')[0]}</span>
                </button>
              )}

              <button
                onClick={() => startCall(activeChat.email!, 'audio')}
                title="Start Voice Call"
                className={`p-2 rounded-full transition ${
                  isDarkMode ? 'hover:bg-[#374248] text-gray-300' : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Phone className="w-5 h-5 text-emerald-400" />
              </button>

              <button
                onClick={() => startCall(activeChat.email!, 'video')}
                title="Start Video Call"
                className={`p-2 rounded-full transition ${
                  isDarkMode ? 'hover:bg-[#374248] text-gray-300' : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Video className="w-5 h-5 text-sky-400" />
              </button>
            </>
          )}

          <button
            onClick={onOpenWallpaperModal}
            title="Wallpaper Theme"
            className={`p-2 rounded-full transition ${
              isDarkMode ? 'hover:bg-[#374248] text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* In-Chat Search Bar Dropdown */}
      {showSearchInChat && (
        <div
          className={`px-4 py-2 border-b flex items-center justify-between ${
            isDarkMode ? 'bg-[#111b21] border-[#222d34]' : 'bg-gray-100 border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search in this conversation..."
              value={searchInChatQuery}
              onChange={(e) => setSearchInChatQuery(e.target.value)}
              className="bg-transparent text-xs w-full focus:outline-none"
            />
          </div>
          <button
            onClick={() => {
              setSearchInChatQuery('');
              setShowSearchInChat(false);
            }}
            className="text-xs text-emerald-500 font-semibold"
          >
            Done
          </button>
        </div>
      )}

      {/* Message List Scroll Container with WhatsApp Wallpaper */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-3 relative ${getWallpaperStyle()}`}
      >
        {/* Email Security Security Disclaimer Bubble */}
        <div className="flex justify-center my-2">
          <div
            className={`px-3 py-1.5 rounded-lg text-[11px] max-w-md text-center shadow-sm border ${
              isDarkMode
                ? 'bg-[#182229]/90 border-amber-500/30 text-amber-200/90'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            🔒 Messages and calls are encrypted with Email identity verification. No phone number is saved or required.
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No messages yet. Say hello to start the conversation!
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.senderEmail.toLowerCase() === currentUser.email.toLowerCase();

            return (
              <div
                key={msg.id}
                onMouseEnter={() => setHoveredMsgId(msg.id)}
                onMouseLeave={() => {
                  setHoveredMsgId(null);
                  setReactionPickerMsgId(null);
                }}
                className={`flex flex-col relative group ${
                  isMe ? 'items-end' : 'items-start'
                }`}
              >
                {/* Sender Name in Group */}
                {activeChat.isGroup && !isMe && (
                  <span className="text-[11px] font-bold text-emerald-400 mb-0.5 ml-1">
                    {msg.senderName} ({msg.senderEmail})
                  </span>
                )}

                {/* Reaction Picker Popover */}
                {hoveredMsgId === msg.id && (
                  <div
                    className={`absolute -top-8 z-20 flex items-center gap-1 px-2 py-1 rounded-full shadow-lg border animate-fade-in ${
                      isMe ? 'right-0' : 'left-0'
                    } ${isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-white border-gray-200'}`}
                  >
                    {EMOJI_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addReaction(msg.id, emoji)}
                        className="hover:scale-125 transition transform text-sm p-0.5"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3.5 py-2 text-xs md:text-sm shadow-md relative leading-relaxed ${
                    isMe
                      ? 'bg-[#005c4b] text-white rounded-tr-none'
                      : isDarkMode
                      ? 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                      : 'bg-white text-gray-900 rounded-tl-none'
                  }`}
                >
                  {/* Message Type Handling */}
                  {msg.type === 'system' ? (
                    <div className="text-center italic text-[11px] opacity-80">
                      {msg.content}
                    </div>
                  ) : msg.type === 'image' ? (
                    <div className="space-y-1">
                      <img
                        src={msg.content}
                        alt="Photo attachment"
                        className="rounded-lg max-h-60 w-full object-cover cursor-pointer hover:opacity-95 border border-black/10"
                        onClick={() => window.open(msg.content, '_blank')}
                      />
                      {msg.fileName && (
                        <p className="text-[11px] opacity-80 font-medium">{msg.fileName}</p>
                      )}
                    </div>
                  ) : msg.type === 'audio' ? (
                    /* Voice Note Audio Player */
                    <div className="flex items-center gap-3 py-1 min-w-[180px]">
                      <button
                        onClick={() => handleToggleAudio(msg.id, msg.content)}
                        className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-md transition"
                      >
                        {playingAudioId === msg.id ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="h-1.5 bg-black/20 rounded-full overflow-hidden mb-1">
                          <div
                            className={`h-full bg-emerald-400 transition-all ${
                              playingAudioId === msg.id ? 'w-2/3 animate-pulse' : 'w-0'
                            }`}
                          ></div>
                        </div>
                        <span className="text-[10px] opacity-80 font-mono">
                          🎙️ Voice note ({msg.audioDuration || 3}s)
                        </span>
                      </div>
                    </div>
                  ) : msg.type === 'file' ? (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-black/10 border border-black/10">
                      <FileText className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{msg.fileName || 'Attachment'}</p>
                        <p className="text-[10px] opacity-70">{msg.fileSize || 'Document'}</p>
                      </div>
                      <a
                        href={msg.content}
                        download={msg.fileName || 'file'}
                        className="p-1.5 hover:bg-black/20 rounded-full"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ) : (
                    /* Standard Text Content */
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  )}

                  {/* Reactions Badge */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {Object.entries(msg.reactions).map(([emoji, users]) => {
                        const userList = (users as string[]) || [];
                        return (
                          <span
                            key={emoji}
                            className="inline-flex items-center gap-0.5 text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full border border-white/10"
                          >
                            {emoji} {userList.length > 1 && userList.length}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Time & Read Checkmarks */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-75">
                    <span>{formatMessageTime(msg.timestamp)}</span>
                    {isMe && (
                      <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Component */}
      <MessageInput />
    </main>
  );
};
