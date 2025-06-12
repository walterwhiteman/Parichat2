import React, { useState } from 'react';
import { Heart, Smile, Download } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReaction: (messageId: string, emoji: string) => void;
  currentUserId: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onReaction,
  currentUserId
}) => {
  const [showReactions, setShowReactions] = useState(false);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const reactionEmojis = ['❤️', '😍', '😊', '😢', '😮', '👍'];
  const messageReactions = message.reactions || {};
  const hasReactions = Object.keys(messageReactions).length > 0;

  const handleReaction = (emoji: string) => {
    onReaction(message.id, emoji);
    setShowReactions(false);
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`max-w-xs lg:max-w-md relative ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2 shadow-sm ${
            isOwn
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
          }`}
        >
          {/* Sender name (for received messages) */}
          {!isOwn && (
            <div className="text-xs font-medium text-blue-600 mb-1">
              {message.senderName}
            </div>
          )}

          {/* Message content */}
          {message.type === 'text' && (
            <p className="text-sm leading-relaxed">{message.content}</p>
          )}

          {message.type === 'image' && (
            <div className="space-y-2">
              {message.content && (
                <p className="text-sm leading-relaxed">{message.content}</p>
              )}
              <img
                src={message.fileUrl}
                alt="Shared image"
                className="rounded-lg max-w-full h-auto"
              />
            </div>
          )}

          {message.type === 'file' && (
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.fileName}</p>
                {message.content && (
                  <p className="text-xs opacity-75">{message.content}</p>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
            {formatTime(message.timestamp)}
          </div>
        </div>

        {/* Reactions display */}
        {hasReactions && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(messageReactions).map(([userId, emoji]) => (
              <span
                key={userId}
                className={`text-xs bg-gray-100 rounded-full px-2 py-1 ${
                  userId === currentUserId ? 'bg-blue-100' : ''
                }`}
              >
                {emoji}
              </span>
            ))}
          </div>
        )}

        {/* Reaction picker */}
        {showReactions && (
          <div className="absolute top-0 left-0 right-0 -mt-12 bg-white rounded-full shadow-lg border border-gray-200 px-2 py-1 flex space-x-1 z-10">
            {reactionEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-lg hover:scale-125 transition-transform duration-150"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Reaction button (visible on hover) */}
        <button
          onClick={() => setShowReactions(!showReactions)}
          className={`absolute top-2 ${
            isOwn ? '-left-8' : '-right-8'
          } opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-100 hover:bg-gray-200 rounded-full p-1`}
        >
          <Smile className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default MessageBubble;