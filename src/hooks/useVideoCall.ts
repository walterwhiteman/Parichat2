import { useState, useRef, useCallback } from 'react';
import { VideoCallState } from '../types';

export const useVideoCall = () => {
  const [callState, setCallState] = useState<VideoCallState>({
    isActive: false,
    isMinimized: false,
    isMuted: false,
    isCameraOn: true
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const startCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      
      setCallState(prev => ({ 
        ...prev, 
        isActive: true, 
        localStream: stream 
      }));

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize WebRTC peer connection
      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });

    } catch (error) {
      console.error('Error starting video call:', error);
    }
  }, []);

  const endCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    localStreamRef.current = null;

    setCallState({
      isActive: false,
      isMinimized: false,
      isMuted: false,
      isCameraOn: true
    });
  }, []);

  const toggleMinimize = useCallback(() => {
    setCallState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = callState.isMuted;
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

  return {
    callState,
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleMinimize,
    toggleMute,
    toggleCamera
  };
};