import React, { useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import VideoCallOverlay from './VideoCallOverlay';
import { useFirebase } from '../hooks/useFirebase';
import { useVideoCall } from '../hooks/useVideoCall';

interface ChatRoomProps {
  roomId: string;
  userId: string;
  username: string;
  onLeaveRoom: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
  roomId,
  userId,
  username,
  onLeaveRoom
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    users,
    sendMessage,
    uploadFile,
    setTypingStatus,
    addReaction
  } = useFirebase(roomId, userId, username);

  const {
    callState,
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleMinimize,
    toggleMute,
    toggleCamera
  } = useVideoCall();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const fileUrl = await uploadFile(file);
      const fileType = file.type.startsWith('image/') ? 'image' : 'file';
      await sendMessage('', fileType, fileUrl, file.name);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <ChatHeader
        roomId={roomId}
        users={users}
        onVideoCall={startCall}
        onLeaveRoom={onLeaveRoom}
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">Welcome to Parichat! 💕</p>
              <p className="text-sm">Start your conversation...</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === userId}
              onReaction={addReaction}
              currentUserId={userId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        onTyping={setTypingStatus}
      />

      {/* Video call overlay */}
      <VideoCallOverlay
        callState={callState}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        onEndCall={endCall}
        onToggleMinimize={toggleMinimize}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
      />
    </div>
  );
};

export default ChatRoom;
