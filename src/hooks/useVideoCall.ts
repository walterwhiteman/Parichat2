// src/hooks/useVideoCall.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import { db } from '../config/firebase'; // Import your Firestore instance
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  deleteDoc,
  query, // Make sure query is imported
  where, // Make sure where is imported
  serverTimestamp // Make sure serverTimestamp is imported
} from 'firebase/firestore';
// import { VideoCallState } from '../types'; // Ensure your VideoCallState type is correct

// Define your VideoCallState type to include streams
// Make sure your types.ts has this or similar:
export interface VideoCallState {
  isActive: boolean;
  isMinimized: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  status?: 'pending' | 'active' | 'ended'; // Add status for call management
}


export const useVideoCall = (roomId: string, userId: string) => {
  const [callState, setCallState] = useState<VideoCallState>({
    isActive: false,
    isMinimized: false,
    isMuted: false,
    isCameraOn: true,
    localStream: undefined,
    remoteStream: undefined,
    status: undefined // Initialize status
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentCallDocRef = useRef<any>(null); // Reference to the active call document in Firestore

  // Firestore collections for signaling
  const callsCollection = collection(db, 'calls');


  // --- Helper to get STUN/TURN servers ---
  const getIceServers = useCallback(() => ([
    { urls: 'stun:stun.l.google.com:19302' }, // Google's free STUN server

    // YOUR PROVIDED TURN SERVER CREDENTIALS
    {
      urls: 'turn:relay1.expressturn.com:3480',
      username: '000000002065154288',
      credential: 'JxT1ZAOBKteZXNPBBNdcCU+7gFA='
    }
  ]), []);

  // ... (rest of your useVideoCall hook remains the same as I provided previously)
  // Ensure the startCall, answerCall, endCall, and useEffect listeners are also present.
};
