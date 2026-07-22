import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ActiveCall, Chat, Message, StatusItem, UserProfile, WsMessage } from '../types';
import { useAuth } from './AuthContext';

interface ChatContextType {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  statuses: StatusItem[];
  activeCall: ActiveCall | null;
  typingUsers: Record<string, string[]>; // chatId -> array of senderEmails typing
  isDarkMode: boolean;
  wallpaper: string;
  searchFilter: string;
  activeTab: 'chats' | 'status' | 'groups' | 'calls';
  isAuthenticated: boolean;
  
  // Actions
  loginUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupUser: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => void;
  setCurrentUserByEmail: (email: string, password?: string, name?: string) => Promise<void>;
  setActiveChat: (chat: Chat | null) => void;
  setSearchFilter: (query: string) => void;
  setActiveTab: (tab: 'chats' | 'status' | 'groups' | 'calls') => void;
  toggleDarkMode: () => void;
  setWallpaper: (wp: string) => void;
  sendMessage: (content: string, type?: Message['type'], extra?: Partial<Message>) => void;
  sendTyping: (isTyping: boolean) => void;
  addReaction: (messageId: string, emoji: string) => void;
  findOrCreateChat: (targetEmail: string) => Promise<Chat>;
  createGroupChat: (name: string, members: string[]) => Promise<Chat>;
  postStatus: (caption: string, mediaUrl?: string, bgColor?: string) => void;
  startCall: (targetEmail: string, type: 'audio' | 'video') => void;
  answerCall: () => void;
  endCall: () => void;
  markChatAsRead: (chatId: string) => void;
  playNotificationSound: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();

  const currentUser: UserProfile = auth.user || {
    email: 'qasimmurtaza251@gmail.com',
    name: 'Qasim Murtaza',
    about: 'Hey there! I am using EmailChat 🚀',
    avatarBgColor: '#10b981',
    isOnline: true,
    lastSeen: 'Online',
  };

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChatState] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [wallpaper, setWallpaper] = useState<string>('emerald'); // emerald, doodle, slate, midnight
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chats' | 'status' | 'groups' | 'calls'>('chats');

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Audio tone synth for incoming message pop
  const playNotificationSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const loginUser = (email: string, password: string) => {
    setActiveChatState(null);
    setMessages([]);
    return auth.login(email, password);
  };

  const signupUser = (email: string, password: string, name?: string) => {
    setActiveChatState(null);
    setMessages([]);
    return auth.signup(email, password, name);
  };

  const logoutUser = () => {
    setActiveChatState(null);
    setMessages([]);
    auth.logout();
  };

  // Helper for switching account
  const setCurrentUserByEmail = async (email: string, password?: string, name?: string) => {
    try {
      const pwd = password || '123456';
      let res = await auth.login(email, pwd);
      if (!res.success) {
        res = await auth.signup(email, pwd, name);
      }
      if (res.success) {
        setActiveChatState(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  // Fetch initial chats & messages when active user changes
  useEffect(() => {
    if (!currentUser.email) return;

    fetch(`/api/chats?email=${encodeURIComponent(currentUser.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setChats(data);
          if (!activeChat && data.length > 0) {
            setActiveChatState(data[0]);
          }
        }
      });

    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAllUsers(data);
      });

    fetch('/api/statuses')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStatuses(data);
      });
  }, [currentUser.email]);

  // Fetch messages when activeChat changes
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    fetch(`/api/messages/${activeChat.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMessages(data);
          markChatAsRead(activeChat.id);
        }
      });
  }, [activeChat?.id, currentUser.email]);

  // WebSocket Connection Lifecycle
  useEffect(() => {
    if (!currentUser.email) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      // Authenticate socket with email
      socket.send(
        JSON.stringify({
          type: 'auth',
          payload: { email: currentUser.email },
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);

        switch (msg.type) {
          case 'init_data': {
            if (msg.payload.chats) setChats(msg.payload.chats);
            if (msg.payload.users) setAllUsers(msg.payload.users);
            if (msg.payload.statuses) setStatuses(msg.payload.statuses);
            break;
          }

          case 'chat_message': {
            const { message, chat } = msg.payload;

            // Update chats list
            setChats((prev) => {
              const idx = prev.findIndex((c) => c.id === chat.id);
              if (idx > -1) {
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  lastMessage: chat.lastMessage,
                  unreadCount: chat.unreadCount,
                };
                // Move to top
                const [item] = updated.splice(idx, 1);
                return [item, ...updated];
              }
              return [chat, ...prev];
            });

            // Update current messages if it belongs to activeChat
            setMessages((prev) => {
              if (message.chatId === activeChat?.id) {
                if (message.senderEmail !== currentUser.email) {
                  playNotificationSound();
                }
                if (!prev.some((m) => m.id === message.id)) {
                  return [...prev, message];
                }
              }
              return prev;
            });
            break;
          }

          case 'typing': {
            const { chatId, senderEmail, isTyping } = msg.payload;
            if (senderEmail === currentUser.email) return;

            setTypingUsers((prev) => {
              const currentList = prev[chatId] || [];
              if (isTyping) {
                if (!currentList.includes(senderEmail)) {
                  return { ...prev, [chatId]: [...currentList, senderEmail] };
                }
              } else {
                return {
                  ...prev,
                  [chatId]: currentList.filter((e) => e !== senderEmail),
                };
              }
              return prev;
            });
            break;
          }

          case 'reaction': {
            const { messageId, reactions } = msg.payload;
            setMessages((prev) =>
              prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
            );
            break;
          }

          case 'create_chat': {
            const newChat: Chat = msg.payload;
            setChats((prev) => {
              if (prev.some((c) => c.id === newChat.id)) return prev;
              return [newChat, ...prev];
            });
            break;
          }

          case 'create_status': {
            const newStatus: StatusItem = msg.payload;
            setStatuses((prev) => [newStatus, ...prev.filter((s) => s.id !== newStatus.id)]);
            break;
          }

          case 'user_status': {
            const { email, isOnline, lastSeen } = msg.payload;
            setAllUsers((prev) =>
              prev.map((u) =>
                u.email.toLowerCase() === email.toLowerCase()
                  ? { ...u, isOnline, lastSeen }
                  : u
              )
            );
            break;
          }

          case 'call_signal': {
            const { chatId, callerEmail, callerName, targetEmail, type, action } = msg.payload;
            if (targetEmail && targetEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
              return;
            }

            if (action === 'ring' && callerEmail !== currentUser.email) {
              playNotificationSound();
              setActiveCall({
                id: `call-${Date.now()}`,
                chatId,
                callerEmail,
                callerName,
                receiverEmail: currentUser.email,
                isGroup: false,
                type,
                status: 'ringing',
                startedAt: new Date().toISOString(),
              });
            } else if (action === 'accept') {
              setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
            } else if (action === 'decline' || action === 'end') {
              setActiveCall(null);
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket receive error:', err);
      }
    };

    return () => {
      socket.close();
    };
  }, [currentUser.email, activeChat?.id]);

  // Actions
  const sendMessage = (content: string, type: Message['type'] = 'text', extra: Partial<Message> = {}) => {
    if (!activeChat || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'chat_message',
        payload: {
          chatId: activeChat.id,
          senderEmail: currentUser.email,
          senderName: currentUser.name,
          content,
          type,
          ...extra,
        },
      })
    );
  };

  const sendTyping = (isTyping: boolean) => {
    if (!activeChat || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'typing',
        payload: {
          chatId: activeChat.id,
          senderEmail: currentUser.email,
          isTyping,
        },
      })
    );
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!activeChat || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'reaction',
        payload: {
          chatId: activeChat.id,
          messageId,
          emoji,
          userEmail: currentUser.email,
        },
      })
    );
  };

  const findOrCreateChat = async (targetEmail: string): Promise<Chat> => {
    const res = await fetch('/api/chats/find-or-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: currentUser.email,
        targetEmail,
      }),
    });
    const chat: Chat = await res.json();
    setChats((prev) => {
      const exists = prev.find((c) => c.id === chat.id);
      if (exists) return prev;
      return [chat, ...prev];
    });
    setActiveChatState(chat);
    return chat;
  };

  const createGroupChat = async (name: string, members: string[]): Promise<Chat> => {
    const res = await fetch('/api/chats/group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        members,
        adminEmail: currentUser.email,
      }),
    });
    const groupChat: Chat = await res.json();
    setChats((prev) => [groupChat, ...prev]);
    setActiveChatState(groupChat);
    return groupChat;
  };

  const postStatus = (caption: string, mediaUrl?: string, bgColor?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'create_status',
        payload: {
          userEmail: currentUser.email,
          userName: currentUser.name,
          avatarBgColor: currentUser.avatarBgColor,
          caption,
          mediaUrl,
          bgColor,
        },
      })
    );
  };

  const startCall = (targetEmail: string, type: 'audio' | 'video') => {
    if (!activeChat || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    setActiveCall({
      id: `call-${Date.now()}`,
      chatId: activeChat.id,
      callerEmail: currentUser.email,
      callerName: currentUser.name,
      receiverEmail: targetEmail,
      isGroup: activeChat.isGroup,
      type,
      status: 'ringing',
      startedAt: new Date().toISOString(),
    });

    wsRef.current.send(
      JSON.stringify({
        type: 'call_signal',
        payload: {
          chatId: activeChat.id,
          callerEmail: currentUser.email,
          callerName: currentUser.name,
          targetEmail,
          type,
          action: 'ring',
        },
      })
    );
  };

  const answerCall = () => {
    if (!activeCall || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));

    wsRef.current.send(
      JSON.stringify({
        type: 'call_signal',
        payload: {
          chatId: activeCall.chatId,
          callerEmail: activeCall.callerEmail,
          targetEmail: activeCall.callerEmail,
          action: 'accept',
        },
      })
    );
  };

  const endCall = () => {
    if (!activeCall || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'call_signal',
        payload: {
          chatId: activeCall.chatId,
          callerEmail: currentUser.email,
          targetEmail: activeCall.callerEmail === currentUser.email ? activeCall.receiverEmail : activeCall.callerEmail,
          action: 'end',
        },
      })
    );

    setActiveCall(null);
  };

  const markChatAsRead = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            unreadCount: {
              ...c.unreadCount,
              [currentUser.email]: 0,
            },
          };
        }
        return c;
      })
    );
  };

  const toggleDarkMode = () => setIsDarkMode((p) => !p);

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        allUsers,
        chats,
        activeChat,
        messages,
        statuses,
        activeCall,
        typingUsers,
        isDarkMode,
        wallpaper,
        searchFilter,
        activeTab,
        isAuthenticated: auth.isAuthenticated,
        loginUser,
        signupUser,
        logoutUser,
        setCurrentUserByEmail,
        setActiveChat: (chat) => {
          setActiveChatState(chat);
          if (chat) markChatAsRead(chat.id);
        },
        setSearchFilter,
        setActiveTab,
        toggleDarkMode,
        setWallpaper,
        sendMessage,
        sendTyping,
        addReaction,
        findOrCreateChat,
        createGroupChat,
        postStatus,
        startCall,
        answerCall,
        endCall,
        markChatAsRead,
        playNotificationSound,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
