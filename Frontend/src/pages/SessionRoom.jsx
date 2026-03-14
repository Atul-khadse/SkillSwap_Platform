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
  Paperclip,
  Calendar,
  Clock,
  X,
  Users,
  GraduationCap,
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
  
  // Refs
  const socketRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const localStreamRef = useRef();
  const peerRef = useRef();
  const screenStreamRef = useRef();
  const messagesEndRef = useRef();
  const typingTimeoutRef = useRef();

  useEffect(() => {
    if (user && pairId) {
      initSession();
    }
    
    return () => {
      cleanup();
    };
  }, [user, pairId]);

  const initSession = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch pair details
      await fetchPairDetails();
      
      // 2. Initialize Socket.io connection
      await initSocket();


        // 3. Wait for socket connection
    await waitForSocketConnection();
    console.log('✅ Socket connected');
      
      // 3. Initialize media devices
      await initMedia();
      
      // 4. Initialize WebRTC peer connection
       await initWebRTC();
      
      // 5. Create or fetch session
      await initSessionData();
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing session:', error);
      toast.error('Failed to initialize session');
      setLoading(false);
    }
  };


  // Add helper function to wait for socket connection
const waitForSocketConnection = async () => {
  return new Promise((resolve, reject) => {
    if (socketRef.current?.connected) {
      resolve();
    } else {
      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, 10000);
      
      socketRef.current?.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      socketRef.current?.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    }
  });
};

  const fetchPairDetails = async () => {
  try {
    const response = await pairAPI.getPair(pairId);
    setPairDetails(response.data);
    pairDetailsRef.current = response.data; // store in ref for synchronous access
  } catch (error) {
    console.error('Error fetching pair details:', error);
    toast.error('Failed to load pair details');
  }
};


// With this:
// const SOCKET_URL = import.meta.env.VITE_API_URL 
//   ? import.meta.env.VITE_API_URL.replace('https://', 'wss://').replace('http://', 'ws://')
//   : 'http://localhost:5000';


const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


// Then in initSocket function:
const initSocket = async () => {
  return new Promise((resolve, reject) => {
  console.log('🔌 Connecting to Socket.io at:', SOCKET_URL);
  
  socketRef.current = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000
  });

  // Socket event listeners
  socketRef.current.on('connect', () => {
    console.log('✅ Socket connected:', socketRef.current.id);
    
    // Join the room
    socketRef.current.emit('join-room', {
      roomId: pairId,
      userId: user._id,
      userName: user.name
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
    
    // Check if both users are present
    if (users.length >= 2) {
      console.log('✅ Both users are in the room');
      toast.success('Partner is in the session!');
    }
  });

  socketRef.current.on('user-joined', (userData) => {
   console.log('User joined:', userData);
  toast(`${userData.userName} joined the session`, {
    icon: '👋',
    duration: 3000
  });

    // When a user joins, reinitialize WebRTC if not already connected
    if (!peerRef.current) {
      console.log('Reinitializing WebRTC for new user');
      setTimeout(() => {
        initWebRTC();
      }, 1000);
    }
  });

  socketRef.current.on('user-left', (userData) => {
   console.log('User left:', userData);
  toast(`${userData.userName} left the session`, {
    icon: '👋',
    duration: 3000
  });
    
    // Cleanup peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  });

  socketRef.current.on('signal', (data) => {
    console.log('📡 Received WebRTC signal:', data.type);
    
    if (!peerRef.current) {
      console.log('Creating peer for incoming signal');
      initWebRTC();
    }
    
    setTimeout(() => {
      if (peerRef.current && !peerRef.current.destroyed) {
        console.log('Processing signal with peer');
        peerRef.current.signal(data);
      } else {
        console.error('No peer available to process signal');
      }
    }, 500);
  });
  
  // Chat messages
  socketRef.current.on('receive-message', (message) => {
    console.log('💬 Received chat message:', message);
    
    setMessages(prev => [...prev, {
      ...message,
      sender: message.senderName === user.name ? 'You' : message.senderName
    }]);
  });

  socketRef.current.on('typing', ({ userName, isTyping }) => {
    if (userName !== user.name) {
      setTypingUsers(prev => {
        if (isTyping && !prev.includes(userName)) {
          return [...prev, userName];
        } else if (!isTyping) {
          return prev.filter(name => name !== userName);
        }
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
    throw error; // rethrow so initSession catches it
  }
};

  const initWebRTC = async () => {
  try {
    console.log('Initializing WebRTC with user:', user._id);
    
    // Check if we have a stream
    if (!localStreamRef.current) {
      console.log('No local stream available for WebRTC');
      return;
    }

    // Determine who should be initiator based on user ID (so both don't try to initiate)
    // User with lower ID becomes initiator
    const otherUser = getOtherUser();
    if (!otherUser || !otherUser._id) {
    console.error('Could not determine other user');
    return;
  }
    const otherUserId = otherUser?._id;
    const isInitiator = user._id < otherUserId;
    
    console.log('WebRTC initiator decision:', {
      userId: user._id,
      otherUserId,
      isInitiator
    });

    // Create peer connection
    peerRef.current = new Peer({
      initiator: isInitiator,
      trickle: true,
      stream: localStreamRef.current,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    });

    const pairDetailsRef = useRef(null);

    // Peer event listeners
    peerRef.current.on('signal', (data) => {
      console.log('WebRTC signaling data (type):', data.type);
      
      // Send signaling data through socket
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('signal', {
          roomId: pairId,
          data: data
        });
      } else {
        console.error('Socket not connected for signaling');
      }
    });

    peerRef.current.on('stream', (stream) => {
      console.log('Received remote stream! Tracks:', 
        stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
      
      // Set remote video stream
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        
        // Try to play it
        remoteVideoRef.current.play().catch(e => {
          console.error('Error playing remote video:', e);
        });
      }
    });

    peerRef.current.on('connect', () => {
      console.log('✅ WebRTC connection established!');
      toast.success('Connected to partner!');
    });
    
    peerRef.current.on('iceStateChange', (state) => {
  console.log('ICE state:', state);
});

    peerRef.current.on('error', (error) => {
      console.error('❌ Peer error:', error);
      toast.error('Connection error. Please refresh.');
    });

    peerRef.current.on('close', () => {
      console.log('WebRTC connection closed');
      peerRef.current = null;
    });

  } catch (error) {
    console.error('Error initializing WebRTC:', error);
    toast.error('Failed to initialize connection');
  }
};

 const initSessionData = async () => {
  try {
    // Check if there's an active session
    const sessionsResponse = await sessionAPI.getSessionsByPair(pairId);
    const sessions = sessionsResponse.data || [];
    
    let activeSession = sessions.find(s => s.status === 'in-progress');
    
    if (!activeSession) {
      // Get pair details to determine skills
      const pairResponse = await pairAPI.getPair(pairId);
      const pairDetails = pairResponse.data;
      
      const otherUser = getOtherUser();
      
      // Determine which skill you're teaching based on the pair
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
      
      // Create a new session with skill data
      const sessionData = {
        matchedPairId: pairId,
        title: `${user.name} & ${otherUser?.name} Session`,
        description: 'Real-time skill exchange session',
        scheduledTime: new Date(),
        duration: 60,
        skillTaught: skillTaught,
        skillLearned: skillLearned,
        teacher: user._id,
        student: otherUser?._id,
        status: 'in-progress'
      };
      
      console.log('Creating session with data:', sessionData);
      
      const newSession = await sessionAPI.createSession(sessionData);
      activeSession = newSession.data;
    }
    
    setSessionDetails(activeSession);
  } catch (error) {
    console.error('Error initializing session data:', error);
    console.error('Error response:', error.response?.data);
    
    // Try creating session without skill data as fallback
    try {
      const otherUser = getOtherUser();
      const sessionData = {
        matchedPairId: pairId,
        title: `${user.name} & ${otherUser?.name} Session`,
        description: 'Real-time skill exchange session',
        scheduledTime: new Date(),
        duration: 60,
        teacher: user._id,
        student: otherUser?._id,
        status: 'in-progress'
      };
      
      console.log('Trying fallback session creation:', sessionData);
      const newSession = await sessionAPI.createSession(sessionData);
      setSessionDetails(newSession.data);
    } catch (fallbackError) {
      console.error('Fallback session creation also failed:', fallbackError);
      toast.error('Could not create session. Video/audio features may be limited.');
    }
  }
};

const getOtherUser = () => {
  // Use ref first (synchronous), fallback to state
  const details = pairDetailsRef.current || pairDetails;
  if (!details || !user) return null;

  console.log('Getting other user from pairDetails:', {
    details,
    user: user._id,
    user1: details.user1?._id || details.user1,
    user2: details.user2?._id || details.user2
  });

  const user1Id = details.user1?._id || details.user1;
  const user2Id = details.user2?._id || details.user2;

  if (user1Id === user._id) {
    return details.user2 || { _id: user2Id, name: 'Partner' };
  } else {
    return details.user1 || { _id: user1Id, name: 'Partner' };
  }
};

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

    // Emit message through socket
    socketRef.current.emit('send-message', messageData);
    
    // Clear typing indicator
    setIsTyping(false);
    socketRef.current.emit('typing', {
      roomId: pairId,
      userId: user._id,
      userName: user.name,
      isTyping: false
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
        isTyping: true
      });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('typing', {
        roomId: pairId,
        userId: user._id,
        userName: user.name,
        isTyping: false
      });
    }, 2000);
  };

  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  };

  const toggleAudio = async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
        setIsAudioOn(!isAudioOn);
      }
    }
  };

 const toggleScreenShare = async () => {
  if (!isScreenSharing) {
    try {
      // Check if browser supports screen sharing
      if (!navigator.mediaDevices.getDisplayMedia) {
        toast.error('Screen sharing is not supported in this browser');
        return;
      }

      // Show a toast to guide the user
      toast('Please select the screen/window you want to share when prompted', {
        icon: '🖥️',
        duration: 3000
      });

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          frameRate: { ideal: 30 }
        },
        audio: false
      }).catch(error => {
        console.error('User denied screen sharing or error:', error);
        toast.error('Screen sharing was cancelled or not permitted');
        throw error;
      });

      screenStreamRef.current = screenStream;
      
      const screenTrack = screenStream.getVideoTracks()[0];
      
      if (!screenTrack) {
        toast.error('No screen track available');
        return;
      }
      
      // Replace video track with screen track
      const senders = peerRef.current?._pc?.getSenders();
      if (senders) {
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      }
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      
      setIsScreenSharing(true);
      
      // Notify others
      if (socketRef.current) {
        socketRef.current.emit('screen-sharing', {
          roomId: pairId,
          userId: user._id,
          isSharing: true
        });
      }
      
      toast.success('Screen sharing started');
      
      // Handle when user stops sharing via browser UI
      screenTrack.onended = () => {
        console.log('Screen sharing ended by browser UI');
        if (isScreenSharing) {
          toggleScreenShare();
        }
      };
    } catch (error) {
      console.error('Error sharing screen:', error);
      // Don't show error toast if user cancelled
      if (error.name !== 'NotAllowedError') {
        toast.error(`Screen sharing failed: ${error.message}`);
      }
      setIsScreenSharing(false);
    }
  } else {
    // Stop screen sharing
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    // Restore camera video
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      const senders = peerRef.current?._pc?.getSenders();
      if (senders) {
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(videoTrack);
        }
      }
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    
    setIsScreenSharing(false);
    
    // Notify others
    if (socketRef.current) {
      socketRef.current.emit('screen-sharing', {
        roomId: pairId,
        userId: user._id,
        isSharing: false
      });
    }
    
    toast.success('Screen sharing stopped');
  }
};

  const endSession = async () => {
    if (window.confirm('Are you sure you want to end the session?')) {
      try {
        if (sessionDetails) {
          await sessionAPI.updateSessionStatus(sessionDetails._id, {
            status: 'completed',
            actualEndTime: new Date()
          });
        }
        
        cleanup();
        navigate('/pairs');
        toast.success('Session ended successfully');
      } catch (error) {
        console.error('Error ending session:', error);
        toast.error('Failed to end session');
      }
    }
  };






  const cleanup = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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
      {/* Session Header */}
      <div className="bg-gray-800 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">
                  {sessionDetails?.title || 'Live Session'}
                </h1>
                <div className="flex items-center text-sm text-gray-300">
                  <Users className="h-4 w-4 mr-1" />
                  <span>With {otherUser?.name || 'Partner'}</span>
                  <span className="mx-2">•</span>
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Live Now</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                {sessionDetails?.status || 'in-progress'}
              </div>
              <button
                onClick={endSession}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
              >
                <Phone className="h-4 w-4 mr-2 rotate-135" />
                End Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className={`flex-1 ${showChat ? 'lg:w-3/4' : 'w-full'} p-4`}>
          <div className="bg-gray-800 rounded-xl h-full overflow-hidden relative">
            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 h-full">
              {/* Your Video */}
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
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                  <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                    You {isScreenSharing && '(Sharing Screen)'}
                  </span>
                </div>
              </div>

              {/* Partner's Video */}
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
                      <p className="text-gray-400">Waiting for {otherUser?.name || 'partner'} to join...</p>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                  <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                    {otherUser?.name || 'Partner'}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-2 bg-black bg-opacity-50 px-4 py-2 rounded-full">
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-full ${isAudioOn ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-red-600 text-white hover:bg-red-700'}`}
                  title={isAudioOn ? 'Mute' : 'Unmute'}
                >
                  {isAudioOn ? (
                    <Mic className="h-5 w-5" />
                  ) : (
                    <MicOff className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full ${isVideoOn ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-red-600 text-white hover:bg-red-700'}`}
                  title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isVideoOn ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <VideoOff className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
                  title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
                >
                  {isScreenSharing ? (
                    <ScreenShareOff className="h-5 w-5" />
                  ) : (
                    <ScreenShare className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`p-3 rounded-full ${showChat ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
                  title={showChat ? 'Hide chat' : 'Show chat'}
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-full lg:w-1/4 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Chat</h2>
                <button
                  onClick={() => setShowChat(false)}
                  className="lg:hidden text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {typingUsers.length > 0 && (
                <div className="mt-2 text-sm text-primary-400">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs rounded-lg p-3 ${message.sender === 'You' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-gray-700 text-white rounded-bl-none'}`}
                      >
                        <div className="font-medium text-sm mb-1">
                          {message.sender}
                        </div>
                        <p className="text-sm break-words">{message.content}</p>
                        <div className="text-xs opacity-75 mt-1 text-right">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
              <form onSubmit={sendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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