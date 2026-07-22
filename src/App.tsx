import React, { useState } from 'react';
import { AccountSwitcherModal } from './components/AccountSwitcherModal';
import { CallOverlayModal } from './components/CallOverlayModal';
import { ChatArea } from './components/ChatArea';
import { LoginScreen } from './components/LoginScreen';
import { NewChatModal } from './components/NewChatModal';
import { Sidebar } from './components/Sidebar';
import { StatusViewerModal } from './components/StatusViewerModal';
import { UserProfileSettings } from './components/UserProfileSettings';
import { WallpaperSelectorModal } from './components/WallpaperSelectorModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';

function MainLayout() {
  const { isDarkMode, activeChat } = useChat();

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatMode, setNewChatMode] = useState<'chat' | 'group'>('chat');
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);

  return (
    <div
      className={`w-full h-screen flex flex-col overflow-hidden font-sans antialiased select-none ${
        isDarkMode ? 'bg-[#111b21] text-[#e9edef]' : 'bg-gray-100 text-gray-900'
      }`}
    >
      {/* App Container */}
      <div className="w-full h-full flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            activeChat ? 'hidden md:flex' : 'flex'
          } w-full md:w-96 flex-shrink-0 h-full`}
        >
          <Sidebar
            onOpenNewChat={() => {
              setNewChatMode('chat');
              setIsNewChatOpen(true);
            }}
            onOpenNewGroup={() => {
              setNewChatMode('group');
              setIsNewChatOpen(true);
            }}
            onOpenAccountSwitcher={() => setIsAccountSwitcherOpen(true)}
            onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
            onOpenStatusModal={() => setIsStatusModalOpen(true)}
          />
        </div>

        {/* Chat Area */}
        <div
          className={`${
            !activeChat ? 'hidden md:flex' : 'flex'
          } flex-1 h-full min-w-0`}
        >
          <ChatArea onOpenWallpaperModal={() => setIsWallpaperModalOpen(true)} />
        </div>
      </div>

      {/* Interactive Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        mode={newChatMode}
      />

      <AccountSwitcherModal
        isOpen={isAccountSwitcherOpen}
        onClose={() => setIsAccountSwitcherOpen(false)}
      />

      <UserProfileSettings
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
      />

      <StatusViewerModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />

      <CallOverlayModal />

      <WallpaperSelectorModal
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
      />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  return (
    <ChatProvider>
      <MainLayout />
    </ChatProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
