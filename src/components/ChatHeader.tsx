import React from 'react';
import { Video, LogOut, Users, Circle } from 'lucide-react';
import { User } from '../types';

interface ChatHeaderProps {
  roomId: string;
  users: User[];
  onVideoCall: () => void;
  onLeaveRoom: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  roomId,
  users,
  onVideoCall,
  onLeaveRoom
}) => {
  const onlineUsers = users.filter(user => user.isOnline);
  const typingUsers = users.filter(user => user.isTyping);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left side - App name and status */}
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Parichat</h1>
            <div className="flex items-center space-x-1 text-xs">
              <Circle className={`w-2 h-2 ${onlineUsers.length > 1 ? 'text-green-500 fill-current' : 'text-gray-400 fill-current'}`} />
              <span className="text-gray-500">
                {onlineUsers.length > 1 ? 'Both online' : `${onlineUsers.length} online`}
              </span>
              {typingUsers.length > 0 && (
                <span className="text-blue-500 ml-2">
                  {typingUsers[0].username} is typing...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onVideoCall}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
            title="Start video call"
          >
            <Video className="w-5 h-5" />
          </button>
          
          <button
            onClick={onLeaveRoom}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
            title="Leave room"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;