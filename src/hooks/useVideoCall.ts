// src/hooks/useVideoCall.ts
import { useState, useRef, useCallback, useEffect } from 'react';

// Import db from config/firebase
import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

import { VideoCallState } from '../types';

export const useVideoCall = (roomId: string, userId: string) => {
  const [callState, setCallState] = useState<VideoCallState>({
    isActive: false,
    isMinimized: false,
    isMuted: false,
    isCameraOn: true,
    localStream: undefined,
    remoteStream: undefined,
    status: undefined
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentCallDocRef = useRef<any>(null); // Reference to the active call document in Firestore

  const callsCollection = collection(db, 'calls');

  const getIceServers = useCallback(() => ([
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:relay1.expressturn.com:3480', // Use your TURN server
      username: '000000002065154288',            // Use your TURN username
      credential: 'JxT1ZAOBKteZXNPBBNdcCU+7gFA='  // Use your TURN credential
    }
  ]), []);

  const startCall = useCallback(async (calleeId: string) => {
    if (callState.isActive) return;
    try {
      setCallState(prev => ({ ...prev, isActive: true, status: 'pending' }));

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setCallState(prev => ({ ...prev, localStream: stream }));

      const callDoc = doc(callsCollection);
      currentCallDocRef.current = callDoc;

      await setDoc(callDoc, {
        callerId: userId,
        calleeId: calleeId,
        roomId: roomId,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      const offerCandidates = collection(callDoc, 'offerCandidates');
      const answerCandidates = collection(callDoc, 'answerCandidates');

      peerConnection.current = new RTCPeerConnection({
        iceServers: getIceServers()
      });

      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          setCallState(prev => ({ ...prev, remoteStream: remoteStream }));
        }
      };

      peerConnection.current.onicecandidate = async (event) => {
        if (event.candidate) {
          await addDoc(offerCandidates, event.candidate.toJSON());
        }
      };

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      await updateDoc(callDoc, { offer: { type: offer.type, sdp: offer.sdp } });

      onSnapshot(callDoc, async (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && !peerConnection.current?.currentRemoteDescription) {
          const answerDescription = new RTCSessionDescription(data.answer);
          await peerConnection.current?.setRemoteDescription(answerDescription);
          setCallState(prev => ({ ...prev, status: 'active' }));
        }
      });

      onSnapshot(answerCandidates, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            if (peerConnection.current && candidate) {
              await peerConnection.current.addIceCandidate(candidate);
            }
          }
        });
      });
    } catch (error) {
      console.error('Error starting call:', error);
      setCallState(prev => ({ ...prev, isActive: false, status: 'ended' }));
      endCall();
    }
  }, [roomId, userId, getIceServers, callState.isActive, endCall]);

  const answerCall = useCallback(async (callDocId: string) => {
    if (callState.isActive) return;
    try {
      setCallState(prev => ({ ...prev, isActive: true, status: 'active' }));

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setCallState(prev => ({ ...prev, localStream: stream }));

      const callDoc = doc(callsCollection, callDocId);
      currentCallDocRef.current = callDoc;

      const offerCandidates = collection(callDoc, 'offerCandidates');
      const answerCandidates = collection(callDoc, 'answerCandidates');

      peerConnection.current = new RTCPeerConnection({
        iceServers: getIceServers()
      });

      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          setCallState(prev => ({ ...prev, remoteStream: remoteStream }));
        }
      };

      peerConnection.current.onicecandidate = async (event) => {
        if (event.candidate) {
          await addDoc(answerCandidates, event.candidate.toJSON());
        }
      };

      const callSnapshot = await getDoc(callDoc);
      const callData = callSnapshot.data();
      if (!callData?.offer) {
        throw new Error('No offer found to answer.');
      }
      const offerDescription = new RTCSessionDescription(callData.offer);
      await peerConnection.current.setRemoteDescription(offerDescription);

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      await updateDoc(callDoc, {
        answer: { type: answer.type, sdp: answer.sdp },
        status: 'active'
      });

      onSnapshot(offerCandidates, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            if (peerConnection.current && candidate) {
              await peerConnection.current.addIceCandidate(candidate);
            }
          }
        });
      });
    } catch (error) {
      console.error('Error answering call:', error);
      setCallState(prev => ({ ...prev, isActive: false, status: 'ended' }));
      endCall();
    }
  }, [roomId, userId, getIceServers, callState.isActive, endCall]);

  const endCall = useCallback(async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    localStreamRef.current = null;

    if (currentCallDocRef.current) {
      try {
        await deleteDoc(currentCallDocRef.current);
      } catch (error) {
        console.error('Error deleting call doc:', error);
      }
      currentCallDocRef.current = null;
    }

    setCallState({
      isActive: false,
      isMinimized: false,
      isMuted: false,
      isCameraOn: true,
      localStream: undefined,
      remoteStream: undefined,
      status: 'ended'
    });
  }, []);

  const toggleMinimize = useCallback(() => {
    setCallState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !callState.isMuted;
        setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
      }
    }
  }, [callState.isMuted]);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !callState.isCameraOn;
        setCallState(prev => ({ ...prev, isCameraOn: !prev.isCameraOn }));
      }
    }
  }, [callState.isCameraOn]);

  // Listener for incoming calls (for the callee)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (userId) {
      const q = query(callsCollection,
        where('calleeId', '==', userId),
        where('status', '==', 'pending')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const callData = change.doc.data();
            const callId = change.doc.id;
            if (!callState.isActive) {
              answerCall(callId);
            }
          } else if (change.type === 'removed' && change.doc.data().status === 'pending') {
            if (!callState.isActive && currentCallDocRef.current?.id === change.doc.id) {
              endCall();
            }
          }
        });
      });
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId, callState.isActive, callsCollection, answerCall, endCall]);

  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
    return () => {
      if (localVideoRef.current && localVideoRef.current.srcObject === callState.localStream) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [callState.localStream, localVideoRef]);

  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
    return () => {
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject === callState.remoteStream) {
        remoteVideoRef.current.srcObject = null;
      }
    };
  }, [callState.remoteStream, remoteVideoRef]);

  return {
    callState,
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleMinimize,
    toggleMute,
    toggleCamera,
    answerCall
  };
};
