import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_CHATS, INITIAL_MESSAGES, INITIAL_STATUSES, SEED_USERS } from './src/data/initialData';
import { Chat, Message, StatusItem, UserProfile, WsMessage } from './src/types';

// Gemini AI Client setup for auto-replying on behalf of offline contacts
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-Memory Stores (can be modified by clients in real time)
let usersStore: UserProfile[] = [...SEED_USERS];
let chatsStore: Chat[] = [...INITIAL_CHATS];
let messagesStore: Record<string, Message[]> = { ...INITIAL_MESSAGES };
let statusesStore: StatusItem[] = [...INITIAL_STATUSES];

// Connected WebSocket clients mapping: userEmail -> Set<WebSocket>
const connectedClients = new Map<string, Set<WebSocket>>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // REST APIs
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', appName: 'EmailChat' });
  });

  // Get or search users by query
  app.get('/api/users', (req, res) => {
    const query = (req.query.q as string || '').toLowerCase();
    if (!query) {
      return res.json(usersStore);
    }
    const filtered = usersStore.filter(
      (u) => u.email.toLowerCase().includes(query) || u.name.toLowerCase().includes(query)
    );
    res.json(filtered);
  });

  // Register or login user by email and password
  app.post('/api/users/login', (req, res) => {
    const { email, password, name, about, isSignup } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid Email ID is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let existing = usersStore.find((u) => u.email.toLowerCase() === cleanEmail);

    if (isSignup) {
      if (existing) {
        return res.status(400).json({ error: 'An account with this Email ID already exists. Please Sign In instead.' });
      }

      if (!password || password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
      }

      // Create new user
      const colors = ['#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444'];
      const randomBg = colors[Math.floor(Math.random() * colors.length)];
      existing = {
        email: cleanEmail,
        password: password,
        name: name ? name.trim() : cleanEmail.split('@')[0],
        about: about || 'Hey there! I am using EmailChat 🚀',
        avatarBgColor: randomBg,
        isOnline: true,
        lastSeen: 'Online',
      };
      usersStore.push(existing);

      // User account registered successfully

    } else {
      // Login flow
      if (!existing) {
        return res.status(404).json({ error: 'Email ID not found. Please Sign Up to create an account.' });
      }

      // Password verification
      if (password) {
        if (existing.password && existing.password !== password) {
          return res.status(401).json({ error: 'Incorrect password! Please check your password and try again.' });
        }
        // If account had no password previously set, assign this password
        if (!existing.password) {
          existing.password = password;
        }
      }

      existing.isOnline = true;
      existing.lastSeen = 'Online';
      if (name) existing.name = name;
    }

    // Return user info (sanitize password from response if needed or include)
    res.json({ user: existing });
  });

  // Update user profile (name, about, avatarUrl)
  app.post('/api/users/profile', (req, res) => {
    const { email, name, about, avatarUrl } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid Email ID is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = usersStore.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name !== undefined && name.trim()) existing.name = name.trim();
    if (about !== undefined) existing.about = about.trim();
    if (avatarUrl !== undefined) existing.avatarUrl = avatarUrl;

    res.json({ success: true, user: existing });
  });

  // Get user's chats
  app.get('/api/chats', (req, res) => {
    const email = (req.query.email as string || '').toLowerCase();
    if (!email) {
      return res.json(chatsStore);
    }
    const userChats = chatsStore.filter((c) =>
      c.members.some((m) => m.toLowerCase() === email)
    );
    res.json(userChats);
  });

  // Get messages for a chat
  app.get('/api/messages/:chatId', (req, res) => {
    const { chatId } = req.params;
    const msgs = messagesStore[chatId] || [];
    res.json(msgs);
  });

  // Get statuses
  app.get('/api/statuses', (_req, res) => {
    res.json(statusesStore);
  });

  // Create or find a 1-on-1 chat by contact Email ID
  app.post('/api/chats/find-or-create', (req, res) => {
    const { userEmail, targetEmail } = req.body;
    if (!userEmail || !targetEmail) {
      return res.status(400).json({ error: 'Both userEmail and targetEmail are required' });
    }

    const u1 = userEmail.trim().toLowerCase();
    const u2 = targetEmail.trim().toLowerCase();

    // Check if target user exists in store, if not, create placeholder user profile
    let targetUser = usersStore.find((u) => u.email.toLowerCase() === u2);
    if (!targetUser) {
      targetUser = {
        email: u2,
        name: u2.split('@')[0],
        about: 'Available on EmailChat',
        avatarBgColor: '#06b6d4',
        isOnline: false,
        lastSeen: 'Recently',
      };
      usersStore.push(targetUser);
    }

    // Existing 1-on-1 chat check
    let existingChat = chatsStore.find(
      (c) =>
        !c.isGroup &&
        c.members.length === 2 &&
        c.members.some((m) => m.toLowerCase() === u1) &&
        c.members.some((m) => m.toLowerCase() === u2)
    );

    if (!existingChat) {
      existingChat = {
        id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        isGroup: false,
        name: targetUser.name,
        email: u2,
        members: [u1, u2],
        avatarBgColor: targetUser.avatarBgColor || '#10b981',
        unreadCount: { [u1]: 0, [u2]: 0 },
        createdAt: new Date().toISOString(),
      };
      chatsStore.unshift(existingChat);
      messagesStore[existingChat.id] = [];

      // Broadcast new chat event via WS
      broadcastToMembers(existingChat.members, {
        type: 'create_chat',
        payload: existingChat,
      });
    }

    res.json(existingChat);
  });

  // Create a group chat
  app.post('/api/chats/group', (req, res) => {
    const { name, members, adminEmail } = req.body;
    if (!name || !members || !Array.isArray(members) || members.length < 2) {
      return res.status(400).json({ error: 'Group name and at least 2 member emails are required' });
    }

    const cleanAdmin = (adminEmail || members[0]).toLowerCase();
    const cleanMembers = Array.from(new Set(members.map((m: string) => m.toLowerCase())));

    if (!cleanMembers.includes(cleanAdmin)) {
      cleanMembers.push(cleanAdmin);
    }

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
    const randomBg = colors[Math.floor(Math.random() * colors.length)];

    const unreadMap: Record<string, number> = {};
    cleanMembers.forEach((m) => {
      unreadMap[m] = 0;
    });

    const newGroup: Chat = {
      id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      isGroup: true,
      name: name.trim(),
      members: cleanMembers,
      avatarBgColor: randomBg,
      groupAdmin: cleanAdmin,
      unreadCount: unreadMap,
      createdAt: new Date().toISOString(),
      lastMessage: {
        content: `Group "${name}" created by ${cleanAdmin}`,
        senderEmail: cleanAdmin,
        timestamp: new Date().toISOString(),
        type: 'system',
      },
    };

    chatsStore.unshift(newGroup);
    messagesStore[newGroup.id] = [
      {
        id: `sys-${Date.now()}`,
        chatId: newGroup.id,
        senderEmail: cleanAdmin,
        senderName: 'System',
        content: `Group "${name}" created. Admin: ${cleanAdmin}`,
        type: 'system',
        timestamp: new Date().toISOString(),
        status: 'read',
      },
    ];

    // Broadcast new group to all members
    broadcastToMembers(cleanMembers, {
      type: 'create_chat',
      payload: newGroup,
    });

    res.json(newGroup);
  });

  // HTTP Server & WebSocket Server setup
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Broadcast WS helper function
  function broadcastToMembers(memberEmails: string[], wsMsg: WsMessage) {
    const stringified = JSON.stringify(wsMsg);
    memberEmails.forEach((email) => {
      const clean = email.toLowerCase();
      const clientSockets = connectedClients.get(clean);
      if (clientSockets) {
        clientSockets.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(stringified);
          }
        });
      }
    });
  }

  // Trigger Gemini AI & Smart Auto-Reply on behalf of offline contacts
  async function triggerAutoReply(chat: Chat, recipientEmail: string, userMessageContent: string, senderName: string) {
    const cleanRecipient = recipientEmail.toLowerCase();
    const recipientUser = usersStore.find((u) => u.email.toLowerCase() === cleanRecipient);
    const recipientName = recipientUser?.name || cleanRecipient.split('@')[0];

    // Show typing status after 1s
    setTimeout(() => {
      broadcastToMembers(chat.members, {
        type: 'typing',
        payload: { chatId: chat.id, senderEmail: cleanRecipient, isTyping: true },
      });
    }, 1000);

    // Generate & send reply after 2.5s
    setTimeout(async () => {
      let replyText = '';

      if (process.env.GEMINI_API_KEY) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: `You are ${recipientName} (${cleanRecipient}), a user on EmailChat app. ${senderName} sent you this chat message: "${userMessageContent}". Write a short, natural, friendly 1-sentence reply in the exact same language (e.g. Roman Urdu, Urdu, or English) that ${senderName} wrote in. Keep it casual like a real human messaging back. Do not include quotes or prefixes.`,
          });
          if (response && response.text) {
            replyText = response.text.trim().replace(/^["']|["']$/g, '');
          }
        } catch (err) {
          console.error('Gemini auto reply error:', err);
        }
      }

      if (!replyText) {
        const lower = userMessageContent.toLowerCase();
        if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('salam') || lower.includes('assalam')) {
          replyText = `Walaikum Assalam! How are you doing?`;
        } else if (lower.includes('kaise') || lower.includes('kya haal') || lower.includes('how are you')) {
          replyText = `Main bilkul theek hoon! Aap batao, kya chal raha hai?`;
        } else if (lower.includes('kahan') || lower.includes('where')) {
          replyText = `Main abhi EmailChat par hi online hoon!`;
        } else {
          replyText = `Thanks for your message! Got it. 😊`;
        }
      }

      // Stop typing
      broadcastToMembers(chat.members, {
        type: 'typing',
        payload: { chatId: chat.id, senderEmail: cleanRecipient, isTyping: false },
      });

      const autoMsg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        chatId: chat.id,
        senderEmail: cleanRecipient,
        senderName: recipientName,
        content: replyText,
        type: 'text',
        timestamp: new Date().toISOString(),
        status: 'delivered',
      };

      if (!messagesStore[chat.id]) {
        messagesStore[chat.id] = [];
      }
      messagesStore[chat.id].push(autoMsg);

      chat.lastMessage = {
        content: replyText,
        senderEmail: cleanRecipient,
        timestamp: autoMsg.timestamp,
        type: 'text',
      };

      chat.members.forEach((m) => {
        const cleanM = m.toLowerCase();
        if (cleanM !== cleanRecipient) {
          chat.unreadCount[cleanM] = (chat.unreadCount[cleanM] || 0) + 1;
        }
      });

      broadcastToMembers(chat.members, {
        type: 'chat_message',
        payload: {
          message: autoMsg,
          chat,
        },
      });
    }, 2500);
  }

  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    let currentUserEmail: string | null = null;

    ws.on('message', (rawMsg) => {
      try {
        const parsed: WsMessage = JSON.parse(rawMsg.toString());

        switch (parsed.type) {
          case 'auth': {
            const email = (parsed.payload.email as string || '').toLowerCase();
            if (email) {
              currentUserEmail = email;
              if (!connectedClients.has(email)) {
                connectedClients.set(email, new Set());
              }
              connectedClients.get(email)!.add(ws);

              // Update online status in user store
              const u = usersStore.find((usr) => usr.email.toLowerCase() === email);
              if (u) {
                u.isOnline = true;
                u.lastSeen = 'Online';
              }

              // Send initial state back to newly authenticated client
              const userChats = chatsStore.filter((c) =>
                c.members.some((m) => m.toLowerCase() === email)
              );

              ws.send(
                JSON.stringify({
                  type: 'init_data',
                  payload: {
                    chats: userChats,
                    users: usersStore,
                    statuses: statusesStore,
                  },
                })
              );

              // Notify contacts that this user is online
              broadcastUserStatus(email, true);
            }
            break;
          }

          case 'chat_message': {
            const { chatId, senderEmail, senderName, content, type, fileName, fileSize, audioDuration, replyToId } = parsed.payload;
            if (!chatId || !senderEmail || !content) return;

            const chat = chatsStore.find((c) => c.id === chatId);
            if (!chat) return;

            const newMsg: Message = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              chatId,
              senderEmail: senderEmail.toLowerCase(),
              senderName: senderName || senderEmail.split('@')[0],
              content,
              type: type || 'text',
              fileName,
              fileSize,
              audioDuration,
              timestamp: new Date().toISOString(),
              status: 'delivered',
              replyToId,
            };

            if (!messagesStore[chatId]) {
              messagesStore[chatId] = [];
            }
            messagesStore[chatId].push(newMsg);

            // Update last message in chat
            chat.lastMessage = {
              content: type === 'image' ? '📷 Photo' : type === 'audio' ? '🎙️ Voice note' : type === 'file' ? `📁 ${fileName || 'File'}` : content,
              senderEmail: senderEmail.toLowerCase(),
              timestamp: newMsg.timestamp,
              type: newMsg.type,
            };

            // Increment unread count for recipients
            chat.members.forEach((m) => {
              const cleanM = m.toLowerCase();
              if (cleanM !== senderEmail.toLowerCase()) {
                chat.unreadCount[cleanM] = (chat.unreadCount[cleanM] || 0) + 1;
              }
            });

            // Broadcast message to all chat members
            broadcastToMembers(chat.members, {
              type: 'chat_message',
              payload: {
                message: newMsg,
                chat,
              },
            });

            // If 1-on-1 chat and recipient is not online in WS, generate intelligent auto-reply
            if (!chat.isGroup && chat.members.length === 2) {
              const cleanSender = senderEmail.toLowerCase();
              const recipientEmail = chat.members.find((m) => m.toLowerCase() !== cleanSender);
              if (recipientEmail) {
                const recipientSockets = connectedClients.get(recipientEmail.toLowerCase());
                const isRecipientConnected = recipientSockets && Array.from(recipientSockets).some((s) => s.readyState === WebSocket.OPEN);

                if (!isRecipientConnected) {
                  triggerAutoReply(chat, recipientEmail, content, newMsg.senderName);
                }
              }
            }
            break;
          }

          case 'typing': {
            const { chatId, senderEmail, isTyping } = parsed.payload;
            const chat = chatsStore.find((c) => c.id === chatId);
            if (chat) {
              broadcastToMembers(chat.members, {
                type: 'typing',
                payload: { chatId, senderEmail, isTyping },
              });
            }
            break;
          }

          case 'reaction': {
            const { chatId, messageId, emoji, userEmail } = parsed.payload;
            const msgs = messagesStore[chatId];
            if (msgs) {
              const msg = msgs.find((m) => m.id === messageId);
              if (msg) {
                if (!msg.reactions) msg.reactions = {};
                if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

                const userIndex = msg.reactions[emoji].indexOf(userEmail);
                if (userIndex > -1) {
                  msg.reactions[emoji].splice(userIndex, 1);
                  if (msg.reactions[emoji].length === 0) {
                    delete msg.reactions[emoji];
                  }
                } else {
                  msg.reactions[emoji].push(userEmail);
                }

                const chat = chatsStore.find((c) => c.id === chatId);
                if (chat) {
                  broadcastToMembers(chat.members, {
                    type: 'reaction',
                    payload: { chatId, messageId, reactions: msg.reactions },
                  });
                }
              }
            }
            break;
          }

          case 'create_status': {
            const { userEmail, userName, caption, mediaUrl, bgColor, avatarBgColor } = parsed.payload;
            const newStatus: StatusItem = {
              id: `status-${Date.now()}`,
              userEmail: userEmail.toLowerCase(),
              userName,
              avatarBgColor,
              caption,
              mediaUrl,
              bgColor: bgColor || '#047857',
              createdAt: new Date().toISOString(),
              viewers: [],
            };
            statusesStore.unshift(newStatus);

            // Broadcast to all connected clients
            const broadcastMsg = JSON.stringify({
              type: 'create_status',
              payload: newStatus,
            });

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(broadcastMsg);
              }
            });
            break;
          }

          case 'call_signal': {
            const { targetEmail, chatId, callerEmail, callerName, type, action } = parsed.payload;
            const chat = chatsStore.find((c) => c.id === chatId);
            if (chat) {
              broadcastToMembers(chat.members, {
                type: 'call_signal',
                payload: {
                  chatId,
                  callerEmail,
                  callerName,
                  targetEmail,
                  type,
                  action, // 'ring', 'accept', 'decline', 'end'
                },
              });
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      if (currentUserEmail) {
        const userSet = connectedClients.get(currentUserEmail);
        if (userSet) {
          userSet.delete(ws);
          if (userSet.size === 0) {
            connectedClients.delete(currentUserEmail);

            // Mark offline
            const u = usersStore.find((usr) => usr.email.toLowerCase() === currentUserEmail);
            if (u) {
              u.isOnline = false;
              u.lastSeen = `Last seen at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            }
            broadcastUserStatus(currentUserEmail, false);
          }
        }
      }
    });
  });

  function broadcastUserStatus(email: string, isOnline: boolean) {
    const statusMsg = JSON.stringify({
      type: 'user_status',
      payload: {
        email,
        isOnline,
        lastSeen: isOnline ? 'Online' : `Last seen ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      },
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(statusMsg);
      }
    });
  }

  // Vite development middleware vs production static server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`EmailChat Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
