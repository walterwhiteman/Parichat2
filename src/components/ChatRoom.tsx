// src/components/ChatRoom.tsx

import React, { useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import VideoCallOverlay from './VideoCallOverlay';
import { useFirebase } from '../hooks/useFirebase';
import { useVideoCall } from '../hooks/useVideoCall'; // Ensure this import is correct

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

  // CORRECTED LINE HERE: Pass roomId and userId to useVideoCall
  const {
    callState,
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleMinimize,
    toggleMute,
    toggleCamera,
    answerCall // Make sure to destructure answerCall if you're using it
  } = useVideoCall(roomId, userId); // <--- ADDED roomId and userId arguments

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
        // IMPORTANT: The startCall function now needs a calleeId argument.
        // You'll need to decide how to get the other user's ID in a 1-to-1 chat.
        // For now, I'm passing a placeholder. You'll need to adapt this.
        // Example: If you have an `otherUserId` from your `users` list:
        onVideoCall={() => {
            const otherUser = users.find(user => user.id !== userId);
            if (otherUser) {
                startCall(otherUser.id);
            } else {
                console.warn("No other user in the room to call!");
            }
        }}
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
        // You'll need to pass 'answerCall' and potentially 'incomingCall' state
        // to VideoCallOverlay or manage the incoming call UI directly in ChatRoom.
      />
    </div>
  );
};

export default ChatRoom;
