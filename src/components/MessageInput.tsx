import React, { useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Mic,
  Paperclip,
  Send,
  Smile,
  Square,
  Trash2,
  X,
  FileText,
} from 'lucide-react';
import { useChat } from '../context/ChatContext';

const QUICK_EMOJIS = ['😊', '😂', '❤️', '👍', '🔥', '🎉', '🙏', '😍', '👏', '🚀'];

export const MessageInput: React.FC = () => {
  const { sendMessage, sendTyping, isDarkMode } = useChat();

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<{
    file: File;
    url: string;
    type: 'image' | 'file';
  } | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    sendTyping(e.target.value.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim() && !attachment) return;

    if (attachment) {
      if (attachment.type === 'image') {
        sendMessage(attachment.url, 'image', {
          fileName: attachment.file.name,
          fileSize: `${(attachment.file.size / 1024).toFixed(1)} KB`,
        });
      } else {
        sendMessage(attachment.url, 'file', {
          fileName: attachment.file.name,
          fileSize: `${(attachment.file.size / 1024).toFixed(1)} KB`,
        });
      }
      setAttachment(null);
    }

    if (text.trim()) {
      sendMessage(text.trim(), 'text');
      setText('');
      sendTyping(false);
    }

    setShowEmojiPicker(false);
  };

  // Image / File Picker Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setAttachment({
        file,
        url,
        type: isImage ? 'image' : 'file',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Voice Note Recorder Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const audioBase64 = reader.result as string;
          sendMessage(audioBase64, 'audio', {
            audioDuration: recordingDuration || 3,
            fileName: 'Voice_Note.webm',
          });
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access is needed to record voice notes!');
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null; // Don't trigger send callback
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      className={`px-4 py-3 relative border-t flex flex-col gap-2 ${
        isDarkMode ? 'bg-[#202c33] border-[#222d34]' : 'bg-[#f0f2f5] border-gray-200'
      }`}
    >
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, true)}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="*"
        className="hidden"
        onChange={(e) => handleFileChange(e, false)}
      />

      {/* Quick Emoji Bar Overlay */}
      {showEmojiPicker && (
        <div
          className={`p-3 rounded-xl shadow-xl flex items-center gap-2 border flex-wrap transition-all ${
            isDarkMode ? 'bg-[#111b21] border-[#222d34]' : 'bg-white border-gray-200'
          }`}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setText((prev) => prev + emoji);
                sendTyping(true);
              }}
              className="text-xl p-1.5 hover:scale-125 transition transform"
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => setShowEmojiPicker(false)}
            className="ml-auto text-xs text-gray-400 hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment Preview Box */}
      {attachment && (
        <div
          className={`p-2.5 rounded-lg border flex items-center justify-between ${
            isDarkMode ? 'bg-[#111b21] border-[#222d34] text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {attachment.type === 'image' ? (
              <img
                src={attachment.url}
                alt="Preview"
                className="w-12 h-12 object-cover rounded-md border"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{attachment.file.name}</p>
              <p className="text-[11px] text-gray-400">
                {(attachment.file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={() => setAttachment(null)}
            className="p-1 hover:bg-red-500/20 text-red-400 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Recording Wave Banner */}
      {isRecording ? (
        <div className="flex items-center justify-between px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 animate-pulse">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-red-500" />
            <span className="text-xs font-bold font-mono">
              Recording Voice Note: {formatSeconds(recordingDuration)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelRecording}
              className="p-1.5 hover:bg-red-500/20 rounded-full text-red-400 text-xs flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={stopAndSendRecording}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-500"
            >
              <Send className="w-3.5 h-3.5" /> Send Voice
            </button>
          </div>
        </div>
      ) : (
        /* Standard Input Row */
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((p) => !p)}
            className={`p-2.5 rounded-full transition ${
              isDarkMode ? 'hover:bg-[#374248] text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Emoji Picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className={`p-2.5 rounded-full transition ${
              isDarkMode ? 'hover:bg-[#374248] text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Attach Photo"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-2.5 rounded-full transition ${
              isDarkMode ? 'hover:bg-[#374248] text-gray-300' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Attach File"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div
            className={`flex-1 rounded-2xl px-4 py-2 border transition ${
              isDarkMode
                ? 'bg-[#2a3942] border-transparent text-white focus-within:border-emerald-500'
                : 'bg-white border-gray-300 text-gray-900 focus-within:border-emerald-500'
            }`}
          >
            <textarea
              rows={1}
              placeholder="Type a message (Send via Email ID)..."
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent resize-none focus:outline-none text-sm max-h-24 py-1"
            />
          </div>

          {text.trim() || attachment ? (
            <button
              onClick={handleSend}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition transform active:scale-95 flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              title="Hold/Click to record voice note"
              className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition transform active:scale-95 flex-shrink-0"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
