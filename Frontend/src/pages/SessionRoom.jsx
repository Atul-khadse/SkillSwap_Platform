import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { useAuth } from '../context/AuthContext';
import { sessionAPI, pairAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Video,
  Phone,
  Mic,
  MicOff,
  VideoOff,
  MessageCircle,
  Clock,
  X,
  Users,
  ScreenShare,
  ScreenShareOff,
} from 'lucide-react';

const SessionRoom = () => {
  const { pairId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [pairDetails, setPairDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [bothUsersPresent, setBothUsersPresent] = useState(false);

  // Refs
  const socketRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const localStreamRef = useRef();
  const peerRef = useRef();
  const screenStreamRef = useRef();
  const messagesEndRef = useRef();
  const typingTimeoutRef = useRef();
  const pairDetailsRef = useRef(null);  // <-- moved to top level

  useEffect(() => {
    if (user && pairId) {
      initSession();
    }
    return () => cleanup();
  }, [user, pairId]);

  const initSession = async () => {
    try {
      setLoading(true);
      await fetchPairDetails();
      await initSocket();
      await initMedia();
      await initSessionData();
      setLoading(false);
    } catch (error) {
      console.error('Error initializing session:', error);
      toast.error('Failed to initialize session');
      setLoading(false);
    }
  };

  const fetchPairDetails = async () => {
    try {
      const response = await pairAPI.getPair(pairId);
      setPairDetails(response.data);
      pairDetailsRef.current = response.data;
    } catch (error) {
      console.error('Error fetching pair details:', error);
      toast.error('Failed to load pair details');
    }
  };

  const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const initSocket = () => {
    return new Promise((resolve, reject) => {
      console.log('🔌 Connecting to Socket.io at:', SOCKET_URL);

      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Socket connected:', socketRef.current.id);
        socketRef.current.emit('join-room', {
          roomId: pairId,
          userId: user._id,
          userName: user.name,
        });
        resolve();
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        toast.error('Failed to connect to server. Trying to reconnect...');
        reject(error);
      });

      socketRef.current.on('room-users', (users) => {
        console.log('👥 Users in room:', users);
        if (users.length >= 2) {
          setBothUsersPresent(true);
          toast.success('Partner is in the session!');
          // Create WebRTC peer only when both are present
          if (!peerRef.current) {
            initWebRTC();
          }
        }
      });

      socketRef.current.on('user-joined', (userData) => {
        console.log('User joined:', userData);
        toast(`${userData.userName} joined the session`, {
          icon: '👋',
          duration: 3000,
        });
        // No need to reinit WebRTC here; room-users will handle it
      });

      socketRef.current.on('user-left', (userData) => {
        console.log('User left:', userData);
        toast(`${userData.userName} left the session`, {
          icon: '👋',
          duration: 3000,
        });
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }
        setBothUsersPresent(false);
      });

      socketRef.current.on('signal', (data) => {
        console.log('📡 Received WebRTC signal:', data.type);
        if (!peerRef.current) {
          console.log('Creating peer for incoming signal');
          initWebRTC();
        }
        // Small delay to ensure peer is ready
        setTimeout(() => {
          if (peerRef.current && !peerRef.current.destroyed) {
            peerRef.current.signal(data);
          } else {
            console.error('No peer available to process signal');
          }
        }, 500);
      });

      socketRef.current.on('receive-message', (message) => {
        setMessages((prev) => [
          ...prev,
          {
            ...message,
            sender: message.senderName === user.name ? 'You' : message.senderName,
          },
        ]);
      });

      socketRef.current.on('typing', ({ userName, isTyping }) => {
        if (userName !== user.name) {
          setTypingUsers((prev) => {
            if (isTyping && !prev.includes(userName)) return [...prev, userName];
            if (!isTyping) return prev.filter((name) => name !== userName);
            return prev;
          });
        }
      });

      socketRef.current.on('screen-sharing', ({ userId, isSharing }) => {
        console.log(`🎥 User ${userId} is ${isSharing ? 'sharing screen' : 'stopped sharing screen'}`);
      });

      socketRef.current.on('error', (error) => {
        console.error('⚠️ Socket error:', error);
      });
    });
  };

  const initMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Could not access camera/microphone. Please check permissions.');
      throw error;
    }
  };

  const getOtherUser = () => {
    const details = pairDetailsRef.current || pairDetails;
    if (!details || !user) return null;

    const user1Id = details.user1?._id || details.user1;
    const user2Id = details.user2?._id || details.user2;

    if (user1Id === user._id) {
      return details.user2 || { _id: user2Id, name: 'Partner' };
    } else {
      return details.user1 || { _id: user1Id, name: 'Partner' };
    }
  };

  const initWebRTC = () => {
    try {
      console.log('Initializing WebRTC...');
      if (!localStreamRef.current) {
        console.error('No local stream');
        return;
      }

      const otherUser = getOtherUser();
      if (!otherUser || !otherUser._id) {
        console.error('Could not determine other user');
        return;
      }

      const isInitiator = user._id < otherUser._id;
      console.log('Initiator:', isInitiator);

      peerRef.current = new Peer({
        initiator: isInitiator,
        trickle: true,
        stream: localStreamRef.current,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            // Add TURN servers here for production (see instructions below)
          ],
        },
      });

      peerRef.current.on('signal', (data) => {
        console.log('Signaling data:', data.type);
        if (socketRef.current?.connected) {
          socketRef.current.emit('signal', { roomId: pairId, data });
        }
      });

      peerRef.current.on('stream', (stream) => {
        console.log('Received remote stream');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(console.error);
        }
      });

      peerRef.current.on('connect', () => {
        console.log('✅ WebRTC connected');
        toast.success('Connected to partner!');
      });

      peerRef.current.on('iceStateChange', (state) => {
        console.log('ICE state:', state);
      });

      peerRef.current.on('error', (err) => {
        console.error('Peer error:', err);
        toast.error('Connection error. Please refresh.');
      });

      peerRef.current.on('close', () => {
        console.log('Peer closed');
        peerRef.current = null;
      });
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      toast.error('Failed to initialize connection');
    }
  };

  const initSessionData = async () => {
    try {
      const sessionsResponse = await sessionAPI.getSessionsByPair(pairId);
      const sessions = sessionsResponse.data || [];
      let activeSession = sessions.find((s) => s.status === 'in-progress');

      if (!activeSession) {
        const pairResponse = await pairAPI.getPair(pairId);
        const pairDetails = pairResponse.data;
        const otherUser = getOtherUser();

        let skillTaught = { name: 'General Skills', level: 'intermediate' };
        let skillLearned = { name: 'General Skills', level: 'beginner' };

        if (pairDetails.skill1To2 && pairDetails.skill2To1) {
          if (user._id === pairDetails.user1._id) {
            skillTaught = pairDetails.skill1To2;
            skillLearned = pairDetails.skill2To1;
          } else {
            skillTaught = pairDetails.skill2To1;
            skillLearned = pairDetails.skill1To2;
          }
        }

        const sessionData = {
          matchedPairId: pairId,
          title: `${user.name} & ${otherUser?.name} Session`,
          description: 'Real-time skill exchange session',
          scheduledTime: new Date(),
          duration: 60,
          skillTaught,
          skillLearned,
          teacher: user._id,
          student: otherUser?._id,
          status: 'in-progress',
        };

        console.log('Creating session:', sessionData);
        const newSession = await sessionAPI.createSession(sessionData);
        activeSession = newSession.data;
      }

      setSessionDetails(activeSession);
    } catch (error) {
      console.error('Session init error:', error);
      toast.error('Could not create session. Video may be limited.');
    }
  };

  // Chat functions (unchanged, but included for completeness)
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      roomId: pairId,
      userId: user._id,
      userName: user.name,
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit('send-message', messageData);
    setIsTyping(false);
    socketRef.current.emit('typing', {
      roomId: pairId,
      userId: user._id,
      userName: user.name,
      isTyping: false,
    });
    setNewMessage('');
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', {
        roomId: pairId,
        userId: user._id,
        userName: user.name,
        isTyping: true,
      });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('typing', {
        roomId: pairId,
        userId: user._id,
        userName: user.name,
        isTyping: false,
      });
    }, 2000);
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !isAudioOn;
      setIsAudioOn(!isAudioOn);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (!navigator.mediaDevices.getDisplayMedia) {
          toast.error('Screen sharing not supported');
          return;
        }
        toast('Select screen/window to share', { icon: '🖥️', duration: 3000 });
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always', frameRate: 30 },
          audio: false,
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track
        const senders = peerRef.current?._pc?.getSenders();
        const videoSender = senders?.find((s) => s.track?.kind === 'video');
        if (videoSender) videoSender.replaceTrack(screenTrack);

        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);

        socketRef.current?.emit('screen-sharing', {
          roomId: pairId,
          userId: user._id,
          isSharing: true,
        });

        screenTrack.onended = () => {
          if (isScreenSharing) toggleScreenShare();
        };
      } catch (error) {
        if (error.name !== 'NotAllowedError') {
          toast.error(`Screen sharing failed: ${error.message}`);
        }
        setIsScreenSharing(false);
      }
    } else {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        const senders = peerRef.current?._pc?.getSenders();
        const videoSender = senders?.find((s) => s.track?.kind === 'video');
        if (videoSender) videoSender.replaceTrack(videoTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setIsScreenSharing(false);
      socketRef.current?.emit('screen-sharing', {
        roomId: pairId,
        userId: user._id,
        isSharing: false,
      });
    }
  };

  const endSession = async () => {
    if (window.confirm('End session?')) {
      try {
        if (sessionDetails) {
          await sessionAPI.updateSessionStatus(sessionDetails._id, {
            status: 'completed',
            actualEndTime: new Date(),
          });
        }
        cleanup();
        navigate('/pairs');
        toast.success('Session ended');
      } catch (error) {
        console.error('Error ending session:', error);
        toast.error('Failed to end session');
      }
    }
  };

  const cleanup = () => {
    peerRef.current?.destroy();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    socketRef.current?.disconnect();
    clearTimeout(typingTimeoutRef.current);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-white">Initializing session...</p>
        </div>
      </div>
    );
  }

  const otherUser = getOtherUser();

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{sessionDetails?.title || 'Live Session'}</h1>
              <div className="flex items-center text-sm text-gray-300">
                <Users className="h-4 w-4 mr-1" />
                <span>With {otherUser?.name || 'Partner'}</span>
                <span className="mx-2">•</span>
                <Clock className="h-4 w-4 mr-1" />
                <span>Live Now</span>
              </div>
            </div>
          </div>
          <button
            onClick={endSession}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
          >
            <Phone className="h-4 w-4 mr-2 rotate-135" />
            End Session
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className={`flex-1 ${showChat ? 'lg:w-3/4' : 'w-full'} p-4`}>
          <div className="bg-gray-800 rounded-xl h-full overflow-hidden relative">
            <div className="grid grid-cols-1 md:grid-cols-2 h-full">
              {/* Local video */}
              <div className="relative p-4">
                <div className="bg-gray-900 rounded-lg h-full overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!isVideoOn && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <VideoOff className="h-16 w-16 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-3 py-1 rounded-lg text-sm text-white">
                  You {isScreenSharing && '(Sharing Screen)'}
                </div>
              </div>

              {/* Remote video */}
              <div className="relative p-4">
                <div className="bg-gray-900 rounded-lg h-full overflow-hidden">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!remoteVideoRef.current?.srcObject && (
                    <div className="absolute inset-0 bg-gray-800 flex flex-col items-center justify-center">
                      <Users className="h-16 w-16 text-gray-500 mb-4" />
                      <p className="text-gray-400">
                        {bothUsersPresent ? 'Connecting...' : `Waiting for ${otherUser?.name || 'partner'} to join...`}
                      </p>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-3 py-1 rounded-lg text-sm text-white">
                  {otherUser?.name || 'Partner'}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-2 bg-black bg-opacity-50 px-4 py-2 rounded-full">
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-full ${
                    isAudioOn ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                  title={isAudioOn ? 'Mute' : 'Unmute'}
                >
                  {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full ${
                    isVideoOn ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                  title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
                <button
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-full ${
                    isScreenSharing
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-600 text-white hover:bg-gray-500'
                  }`}
                  title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
                >
                  {isScreenSharing ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`p-3 rounded-full ${
                    showChat
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-600 text-white hover:bg-gray-500'
                  }`}
                  title={showChat ? 'Hide chat' : 'Show chat'}
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-full lg:w-1/4 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Chat</h2>
                <button onClick={() => setShowChat(false)} className="lg:hidden text-gray-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {typingUsers.length > 0 && (
                <div className="mt-2 text-sm text-primary-400">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs rounded-lg p-3 ${
                          msg.sender === 'You'
                            ? 'bg-primary-600 text-white rounded-br-none'
                            : 'bg-gray-700 text-white rounded-bl-none'
                        }`}
                      >
                        <div className="font-medium text-sm mb-1">{msg.sender}</div>
                        <p className="text-sm break-words">{msg.content}</p>
                        <div className="text-xs opacity-75 mt-1 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-4 border-t border-gray-700">
              <form onSubmit={sendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionRoom;