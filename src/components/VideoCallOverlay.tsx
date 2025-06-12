import React, { useState, useRef, useEffect } from 'react';
import { Minimize2, Maximize2, Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { VideoCallState } from '../types';

interface VideoCallOverlayProps {
  callState: VideoCallState;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  onEndCall: () => void;
  onToggleMinimize: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}

const VideoCallOverlay: React.FC<VideoCallOverlayProps> = ({
  callState,
  localVideoRef,
  remoteVideoRef,
  onEndCall,
  onToggleMinimize,
  onToggleMute,
  onToggleCamera
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const pipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Keep PIP within viewport bounds
      const maxX = window.innerWidth - 256; // 256px is PIP width
      const maxY = window.innerHeight - 192; // 192px is PIP height

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!callState.isMinimized) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  if (!callState.isActive) return null;

  return (
    <div 
      ref={pipRef}
      className={`fixed z-50 bg-black ${
        callState.isMinimized 
          ? 'w-64 h-48 rounded-lg shadow-2xl border-2 border-gray-600 cursor-move' 
          : 'inset-0'
      }`}
      style={callState.isMinimized ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: 'none'
      } : {}}
      onMouseDown={handleMouseDown}
    >
      {/* Remote video (full screen when not minimized) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Local video (Picture-in-Picture) - Flipped like selfie */}
      <div className={`absolute ${
        callState.isMinimized 
          ? 'top-2 right-2 w-16 h-12' 
          : 'top-4 right-4 w-32 h-24'
      } bg-gray-800 rounded-lg overflow-hidden shadow-lg`}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
      </div>

      {/* Drag indicator for minimized PIP */}
      {callState.isMinimized && (
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
          <div className="w-8 h-1 bg-gray-400 rounded-full opacity-60"></div>
        </div>
      )}

      {/* Controls */}
      <div className={`absolute ${
        callState.isMinimized 
          ? 'bottom-2 left-1/2 transform -translate-x-1/2 flex items-center space-x-1' 
          : 'bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4'
      }`}>
        {/* Minimize/Maximize button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMinimize();
          }}
          className={`bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors duration-200 ${
            callState.isMinimized ? 'p-1' : 'p-3'
          }`}
        >
          {callState.isMinimized ? (
            <Maximize2 className="w-3 h-3" />
          ) : (
            <Minimize2 className="w-5 h-5" />
          )}
        </button>

        {/* Mute button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className={`rounded-full transition-colors duration-200 ${
            callState.isMuted 
              ? 'bg-red-600 hover:bg-red-500 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          } ${callState.isMinimized ? 'p-1' : 'p-3'}`}
        >
          {callState.isMuted ? (
            <MicOff className={callState.isMinimized ? 'w-3 h-3' : 'w-5 h-5'} />
          ) : (
            <Mic className={callState.isMinimized ? 'w-3 h-3' : 'w-5 h-5'} />
          )}
        </button>

        {/* Camera button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCamera();
          }}
          className={`rounded-full transition-colors duration-200 ${
            !callState.isCameraOn 
              ? 'bg-red-600 hover:bg-red-500 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          } ${callState.isMinimized ? 'p-1' : 'p-3'}`}
        >
          {callState.isCameraOn ? (
            <Video className={callState.isMinimized ? 'w-3 h-3' : 'w-5 h-5'} />
          ) : (
            <VideoOff className={callState.isMinimized ? 'w-3 h-3' : 'w-5 h-5'} />
          )}
        </button>

        {/* End call button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEndCall();
          }}
          className={`bg-red-600 hover:bg-red-500 text-white rounded-full transition-colors duration-200 ${
            callState.isMinimized ? 'p-1' : 'p-3'
          }`}
        >
          <PhoneOff className={callState.isMinimized ? 'w-3 h-3' : 'w-5 h-5'} />
        </button>
      </div>

      {/* Call info (when not minimized) */}
      {!callState.isMinimized && (
        <div className="absolute top-4 left-4 text-white">
          <h3 className="text-lg font-semibold">Video Call</h3>
          <p className="text-sm opacity-75">Connected</p>
        </div>
      )}
    </div>
  );
};

export default VideoCallOverlay;