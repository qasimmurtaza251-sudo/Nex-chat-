export type MessageType = 'text' | 'image' | 'audio' | 'file' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // email array
}

export interface Message {
  id: string;
  chatId: string;
  senderEmail: string;
  senderName: string;
  content: string; // text or media URL/base64
  fileName?: string;
  fileSize?: string;
  audioDuration?: number; // seconds
  type: MessageType;
  timestamp: string; // ISO string
  status: MessageStatus;
  reactions?: Record<string, string[]>; // emoji -> array of email strings
  replyToId?: string;
  replyToSnippet?: string;
}

export interface UserProfile {
  email: string;
  name: string;
  about: string;
  password?: string;
  avatarUrl?: string;
  avatarBgColor?: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface Chat {
  id: string;
  isGroup: boolean;
  name: string; // For 1-on-1, this is the contact's name or email; for groups, group title
  email?: string; // For 1-on-1, contact's email
  members: string[]; // Email IDs of members
  avatarUrl?: string;
  avatarBgColor?: string;
  groupAdmin?: string; // Email ID of admin if group
  lastMessage?: {
    content: string;
    senderEmail: string;
    timestamp: string;
    type: MessageType;
  };
  unreadCount: Record<string, number>; // email -> count
  pinned?: boolean;
  createdAt: string;
}

export interface StatusItem {
  id: string;
  userEmail: string;
  userName: string;
  avatarUrl?: string;
  avatarBgColor?: string;
  mediaUrl?: string;
  caption?: string;
  bgColor?: string; // background color for text status
  createdAt: string;
  viewers: string[]; // emails who viewed
}

export interface ActiveCall {
  id: string;
  chatId: string;
  callerEmail: string;
  callerName: string;
  receiverEmail?: string;
  isGroup: boolean;
  type: 'audio' | 'video';
  status: 'ringing' | 'connected' | 'ended';
  startedAt: string;
}

export interface WsMessage {
  type:
    | 'auth'
    | 'chat_message'
    | 'typing'
    | 'message_status'
    | 'reaction'
    | 'user_status'
    | 'create_chat'
    | 'create_status'
    | 'init_data'
    | 'call_signal';
  payload: any;
}
