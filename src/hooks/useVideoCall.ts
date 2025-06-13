// src/hooks/useVideoCall.ts
import { useState, useRef, useCallback, useEffect } from 'react';
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
  serverTimestamp // IMPORTANT: Ensure serverTimestamp is imported
} from 'firebase/firestore';
import { VideoCallState } from '../types'; // Ensure your VideoCallState type is correct

// VideoCallState type definition (ensure this matches types.ts)
// export interface VideoCallState {
//   isActive: boolean;
//   isMinimized: boolean;
//   isMuted: boolean;
//   isCameraOn: boolean;
//   localStream?: MediaStream;
//   remoteStream?: MediaStream;
//   status?: 'pending' | 'active' | 'ended';
// }


export const useVideoCall = (roomId: string, userId: string) => {
  console.log('useVideoCall hook initialized for Room:', roomId, 'User:', userId);

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
  const currentCallDocRef = useRef<any>(null);

  const callsCollection = collection(db, 'calls');

  const getIceServers = useCallback(() => ([
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:relay1.expressturn.com:3480',
      username: '000000002065154288',
      credential: 'JxT1ZAOBKteZXNPBBNdcCU+7gFA='
    }
  ]), []);


  const startCall = useCallback(async (calleeId: string) => {
    console.log('startCall called with calleeId:', calleeId);
    if (callState.isActive) {
      console.warn('Call is already active. Preventing new call initiation.');
      return;
    }
    if (!roomId || !userId || !calleeId) {
      console.error('Missing roomId, userId, or calleeId for startCall');
      return;
    }

    try {
      setCallState(prev => ({ ...prev, isActive: true, status: 'pending' }));
      console.log('1. Call state set to active/pending.');

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setCallState(prev => ({ ...prev, localStream: stream }));
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('2. Local video stream set.');
      }

      const callDoc = doc(callsCollection); // Create a new document reference
      currentCallDocRef.current = callDoc;
      console.log('3. Created Firestore call document reference:', callDoc.id);

      await setDoc(callDoc, {
        callerId: userId,
        calleeId: calleeId,
        roomId: roomId,
        status: 'pending',
        createdAt: serverTimestamp(), // Ensure serverTimestamp is correctly used
      });
      console.log('4. Call document created in Firestore with ID:', callDoc.id);

      const offerCandidates = collection(callDoc, 'offerCandidates');
      const answerCandidates = collection(callDoc, 'answerCandidates');

      peerConnection.current = new RTCPeerConnection({
        iceServers: getIceServers()
      });
      console.log('5. RTCPeerConnection initialized.');

      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });
      console.log('6. Local tracks added to peer connection.');

      peerConnection.current.ontrack = (event) => {
        console.log('7. Remote track event received:', event);
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          setCallState(prev => ({ ...prev, remoteStream: remoteStream }));
          // Note: localVideoRef.current.srcObject should be set by the useEffect below
          // if (remoteVideoRef.current) {
          //   remoteVideoRef.current.srcObject = remoteStream;
          // }
          console.log('7a. Remote stream attached.');
        } else {
          console.warn('7b. Remote track event has no stream.');
        }
      };

      peerConnection.current.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log('8. Local ICE candidate:', event.candidate.toJSON());
          await addDoc(offerCandidates, event.candidate.toJSON());
        }
      };
      console.log('9. ICE candidate listener attached.');

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      console.log('10. SDP offer created and set as local description.');

      await updateDoc(callDoc, { offer: { type: offer.type, sdp: offer.sdp } });
      console.log('11. SDP offer updated in Firestore.');

      onSnapshot(callDoc, async (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && !peerConnection.current?.currentRemoteDescription) {
          console.log('12. Received answer from Firestore:', data.answer);
          const answerDescription = new RTCSessionDescription(data.answer);
          await peerConnection.current?.setRemoteDescription(answerDescription);
          setCallState(prev => ({ ...prev, status: 'active' }));
          console.log('12a. Remote description (answer) set. Call active.');
        }
      });
      console.log('13. Listening for answer in Firestore.');

      onSnapshot(answerCandidates, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            if (peerConnection.current && candidate) {
              await peerConnection.current.addIceCandidate(candidate);
              console.log('14. Added remote ICE candidate from Firestore:', candidate.toJSON());
            } else {
              console.warn('14a. Failed to add remote ICE candidate (PC or candidate missing).');
            }
          }
        });
      });
      console.log('15. Listening for answer ICE candidates.');

      console.log('Call initiation sequence completed.');

    } catch (error) {
      console.error('CRITICAL ERROR during startCall:', error);
      setCallState(prev => ({ ...prev, isActive: false, status: 'ended' }));
      endCall();
    }
  }, [roomId, userId, getIceServers, callState.isActive, endCall]);


  const answerCall = useCallback(async (callDocId: string) => {
    console.log('answerCall called for doc ID:', callDocId);
    if (callState.isActive) {
      console.warn('Already in a call. Preventing answering new call.');
      return;
    }
    if (!roomId || !userId || !callDocId) {
      console.error('Missing roomId, userId, or callDocId for answerCall');
      return;
    }

    try {
      setCallState(prev => ({ ...prev, isActive: true, status: 'active' }));
      console.log('A1. Call state set to active for answering.');

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setCallState(prev => ({ ...prev, localStream: stream }));
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('A2. Local video stream set for answering.');
      }

      const callDoc = doc(callsCollection, callDocId);
      currentCallDocRef.current = callDoc;
      console.log('A3. Firestore call document reference set for answering:', callDoc.id);

      const offerCandidates = collection(callDoc, 'offerCandidates');
      const answerCandidates = collection(callDoc, 'answerCandidates');

      peerConnection.current = new RTCPeerConnection({
        iceServers: getIceServers()
      });
      console.log('A4. RTCPeerConnection initialized for answering.');

      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });
      console.log('A5. Local tracks added to peer connection for answering.');

      peerConnection.current.ontrack = (event) => {
        console.log('A6. Remote track event received for answering:', event);
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          setCallState(prev => ({ ...prev, remoteStream: remoteStream }));
          // if (remoteVideoRef.current) {
          //   remoteVideoRef.current.srcObject = remoteStream;
          // }
          console.log('A6a. Remote stream attached for answering.');
        } else {
          console.warn('A6b. Remote track event has no stream for answering.');
        }
      };

      peerConnection.current.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log('A7. Local ICE candidate for answering:', event.candidate.toJSON());
          await addDoc(answerCandidates, event.candidate.toJSON());
        }
      };
      console.log('A8. ICE candidate listener attached for answering.');

      const callSnapshot = await getDoc(callDoc);
      const callData = callSnapshot.data();
      if (!callData?.offer) {
        console.error('A9. No offer found in call document for answering.');
        throw new Error('No offer found to answer.');
      }
      const offerDescription = new RTCSessionDescription(callData.offer);
      await peerConnection.current.setRemoteDescription(offerDescription);
      console.log('A10. Received offer and set as remote description for answering.');

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      console.log('A11. SDP answer created and set as local description for answering.');

      await updateDoc(callDoc, {
        answer: { type: answer.type, sdp: answer.sdp },
        status: 'active'
      });
      console.log('A12. SDP answer updated in Firestore for answering.');

      onSnapshot(offerCandidates, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            if (peerConnection.current && candidate) {
              await peerConnection.current.addIceCandidate(candidate);
              console.log('A13. Added remote ICE candidate from Firestore for answering:', candidate.toJSON());
            } else {
              console.warn('A13a. Failed to add remote ICE candidate (PC or candidate missing) for answering.');
            }
          }
        });
      });
      console.log('A14. Listening for offer ICE candidates for answering.');

      console.log('Call answering sequence completed.');

    } catch (error) {
      console.error('CRITICAL ERROR during answerCall:', error);
      setCallState(prev => ({ ...prev, isActive: false, status: 'ended' }));
      endCall();
    }
  }, [roomId, userId, getIceServers, callState.isActive, endCall]);


  const endCall = useCallback(async () => {
    console.log('endCall called.');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      console.log('Local stream tracks stopped.');
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
      console.log('Peer connection closed.');
    }

    localStreamRef.current = null;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
      console.log('Remote video element cleared.');
    }

    if (currentCallDocRef.current) {
      try {
        await deleteDoc(currentCallDocRef.current);
        console.log('Call document deleted from Firestore:', currentCallDocRef.current.id);
      } catch (error) {
        console.error('Error deleting call document:', error);
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
    console.log('Call state reset to inactive.');
  }, []); // No dependencies needed for endCall if it cleans itself up


  const toggleMinimize = useCallback(() => {
    console.log('toggleMinimize called.');
    setCallState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  const toggleMute = useCallback(() => {
    console.log('toggleMute called. Current muted state:', callState.isMuted);
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = callState.isMuted; // If currently muted, enabling (so flip)
        setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
        console.log('Audio track enabled status:', audioTrack.enabled);
      } else {
        console.warn('No audio track found to toggle mute.');
      }
    }
  }, [callState.isMuted]);

  const toggleCamera = useCallback(() => {
    console.log('toggleCamera called. Current camera state:', callState.isCameraOn);
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !callState.isCameraOn;
        setCallState(prev => ({ ...prev, isCameraOn: !prev.isCameraOn }));
        console.log('Video track enabled status:', videoTrack.enabled);
      } else {
        console.warn('No video track found to toggle camera.');
      }
    }
  }, [callState.isCameraOn]);


  // IMPORTANT: Listener for incoming calls (for the callee)
  // This useEffect will run when the component mounts and listens for call offers directed to this userId.
  // It only listens if the userId is available.
  useEffect(() => {
    let unsubscribe: () => void;
    if (userId) {
      console.log('Setting up listener for incoming calls for userId:', userId);
      const q = query(callsCollection,
        where('calleeId', '==', userId),
        where('status', '==', 'pending')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const callData = change.doc.data();
            const callId = change.doc.id;
            console.log(`Incoming call from ${callData.callerId} (Call ID: ${callId}). Call data:`, callData);
            // You would typically show a UI element here to ask the user to answer
            // For now, let's auto-answer for testing. In a real app, you'd show a modal.
            if (!callState.isActive) { // Only auto-answer if not already in a call
                console.log('Auto-answering incoming call...');
                answerCall(callId);
            } else {
                console.warn('Already in a call, ignoring new incoming call.');
            }
          } else if (change.type === 'removed' && change.doc.data().status === 'pending') {
            console.log('Pending incoming call was removed (caller might have hung up).');
            // If the call was pending and removed, and we're not active in a call, clean up.
            if (!callState.isActive && currentCallDocRef.current?.id === change.doc.id) {
                endCall(); // Clean up if caller hung up before we answered
            }
          }
        });
      }, (error) => {
        console.error('Error listening for incoming calls:', error);
      });
    }

    return () => {
        if (unsubscribe) {
            console.log('Cleaning up incoming call listener.');
            unsubscribe();
        }
    };
  }, [userId, callState.isActive, callsCollection, answerCall, endCall]); // Add answerCall, endCall, callsCollection to dependencies

  // Effects for managing streams in video elements
  // These effects ensure srcObject is set correctly based on callState.localStream/remoteStream
  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      console.log('Setting localVideoRef.current.srcObject to localStream.');
      localVideoRef.current.srcObject = callState.localStream;
    }
    // Cleanup function for local stream if the component unmounts or stream changes
    return () => {
      if (localVideoRef.current && localVideoRef.current.srcObject === callState.localStream) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [callState.localStream, localVideoRef]); // Depend on stream and ref

  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      console.log('Setting remoteVideoRef.current.srcObject to remoteStream.');
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
    // Cleanup function for remote stream
    return () => {
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject === callState.remoteStream) {
        remoteVideoRef.current.srcObject = null;
      }
    };
  }, [callState.remoteStream, remoteVideoRef]); // Depend on stream and ref


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
