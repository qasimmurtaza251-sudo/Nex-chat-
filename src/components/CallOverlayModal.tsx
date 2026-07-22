import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export const CallOverlayModal: React.FC = () => {
  const { activeCall, answerCall, endCall, currentUser } = useChat();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callTimer, setCallTimer] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!activeCall) return;

    if (activeCall.status === 'connected' && activeCall.type === 'video') {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          console.log('Camera permission fallback');
        });
    }

    let interval: any;
    if (activeCall.status === 'connected') {
      interval = setInterval(() => {
        setCallTimer((p) => p + 1);
      }, 1000);
    }

    return () => {
      clearInterval(interval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [activeCall?.status, activeCall?.type]);

  if (!activeCall) return null;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isIncoming =
    activeCall.status === 'ringing' &&
    activeCall.callerEmail.toLowerCase() !== currentUser.email.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-fade-in text-white">
      <div className="w-full max-w-lg bg-[#111b21] rounded-3xl p-8 border border-gray-800 shadow-2xl flex flex-col items-center justify-between min-h-[480px]">
        {/* Top Header */}
        <div className="text-center space-y-1">
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/30">
            {activeCall.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
            EmailChat {activeCall.type.toUpperCase()} CALL
          </span>
          <p className="text-xs text-gray-400">
            {activeCall.status === 'ringing'
              ? isIncoming
                ? 'Incoming call...'
                : 'Ringing...'
              : `Connected (${formatTimer(callTimer)})`}
          </p>
        </div>

        {/* Video Frame or User Avatar */}
        <div className="w-full flex-1 flex flex-col items-center justify-center my-6 relative">
          {activeCall.status === 'connected' && activeCall.type === 'video' && !isVideoOff ? (
            <div className="w-full h-64 bg-slate-900 rounded-2xl overflow-hidden relative shadow-2xl border border-gray-800">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                You ({currentUser.email})
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-28 h-28 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-3xl text-white shadow-2xl ring-8 ring-emerald-500/20 animate-pulse">
                {activeCall.callerName.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold">{activeCall.callerName}</h3>
                <p className="text-xs text-emerald-400 font-mono mt-0.5">{activeCall.callerEmail}</p>
              </div>
            </div>
          )}
        </div>

        {/* Call Controls Bar */}
        <div className="flex items-center gap-6">
          {isIncoming ? (
            <>
              <button
                onClick={endCall}
                className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-xl transition transform active:scale-95 flex items-center justify-center"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                onClick={answerCall}
                className="p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-xl transition transform active:scale-95 flex items-center justify-center animate-bounce"
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsMuted((p) => !p)}
                className={`p-3.5 rounded-full shadow-lg transition ${
                  isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {activeCall.type === 'video' && (
                <button
                  onClick={() => setIsVideoOff((p) => !p)}
                  className={`p-3.5 rounded-full shadow-lg transition ${
                    isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              <button
                onClick={endCall}
                className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-2xl transition transform active:scale-95"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
