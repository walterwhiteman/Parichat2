export interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen: number;
  isTyping?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  reactions?: { [userId: string]: string };
}

export interface Room {
  id: string;
  users: { [userId: string]: User };
  messages: { [messageId: string]: Message };
  createdAt: number;
}

export interface VideoCallState {
  isActive: boolean;
  isMinimized: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  remoteStream?: MediaStream;
  localStream?: MediaStream;
}