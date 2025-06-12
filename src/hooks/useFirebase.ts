import { useState, useEffect } from 'react';
import { ref, push, set, onValue, off, serverTimestamp, onDisconnect, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../config/firebase';
import { User, Message, Room } from '../types';

export const useFirebase = (roomId: string, userId: string, username: string) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!roomId || !userId) return;

    const roomRef = ref(database, `rooms/${roomId}`);
    const userRef = ref(database, `rooms/${roomId}/users/${userId}`);
    const usersRef = ref(database, `rooms/${roomId}/users`);

    // Check if room exists and user count
    const checkRoomAndJoin = async () => {
      try {
        const roomSnapshot = await get(roomRef);
        const roomData = roomSnapshot.val();
        
        if (roomData && roomData.users) {
          const existingUsers = Object.values(roomData.users) as User[];
          const onlineUsers = existingUsers.filter(user => user.isOnline);
          const existingUser = existingUsers.find(user => user.username === username);
          
          // If room is full (2 users) and this user is not one of them, don't allow entry
          if (onlineUsers.length >= 2 && !existingUser) {
            alert('Room is full. Only 2 users are allowed.');
            return;
          }
        }

        // Set user as online
        await set(userRef, {
          id: userId,
          username,
          isOnline: true,
          lastSeen: serverTimestamp(),
          isTyping: false
        });

        // Set user as offline when disconnected or page reloads
        await onDisconnect(userRef).set({
          id: userId,
          username,
          isOnline: false,
          lastSeen: serverTimestamp(),
          isTyping: false
        });

      } catch (error) {
        console.error('Error joining room:', error);
      }
    };

    checkRoomAndJoin();

    // Listen to room changes
    const unsubscribeRoom = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoom(data);
        
        // Update users
        const usersArray = Object.values(data.users || {}) as User[];
        setUsers(usersArray);

        // Update messages
        const messagesArray = Object.values(data.messages || {}) as Message[];
        messagesArray.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesArray);
      }
    });

    // Handle page reload/close - mark user as offline
    const handleBeforeUnload = () => {
      set(userRef, {
        id: userId,
        username,
        isOnline: false,
        lastSeen: serverTimestamp(),
        isTyping: false
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribeRoom();
      off(roomRef);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Mark user as offline when component unmounts
      set(userRef, {
        id: userId,
        username,
        isOnline: false,
        lastSeen: serverTimestamp(),
        isTyping: false
      });
    };
  }, [roomId, userId, username]);

  const sendMessage = async (content: string, type: 'text' | 'image' | 'file' = 'text', fileUrl?: string, fileName?: string) => {
    if (!roomId || !userId || (!content.trim() && !fileUrl)) return;

    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    const newMessage: any = {
      senderId: userId,
      senderName: username,
      content,
      timestamp: Date.now(),
      type
    };

    // Only add fileUrl and fileName if they are defined
    if (fileUrl) {
      newMessage.fileUrl = fileUrl;
    }
    if (fileName) {
      newMessage.fileName = fileName;
    }

    await push(messagesRef, newMessage);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileRef = storageRef(storage, `files/${roomId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const setTypingStatus = (typing: boolean) => {
    if (!roomId || !userId) return;
    const userRef = ref(database, `rooms/${roomId}/users/${userId}/isTyping`);
    set(userRef, typing);
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!roomId || !userId) return;
    const reactionRef = ref(database, `rooms/${roomId}/messages/${messageId}/reactions/${userId}`);
    set(reactionRef, emoji);
  };

  return {
    room,
    messages,
    users,
    sendMessage,
    uploadFile,
    setTypingStatus,
    addReaction
  };
};