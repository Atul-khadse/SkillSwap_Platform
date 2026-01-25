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
      initSocket();
      
      // 3. Initialize media devices
      await initMedia();
      
      // 4. Initialize WebRTC peer connection
      initWebRTC();
      
      // 5. Create or fetch session
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
    } catch (error) {
      console.error('Error fetching pair details:', error);
      toast.error('Failed to load pair details');
    }
  };

  const SOCKET_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';


  const initSocket = () => {
    // Connect to Socket.io server
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    // Socket event listeners
    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      
      // Join the room
      socketRef.current.emit('join-room', {
        roomId: pairId,
        userId: user._id,
        userName: user.name
      });
    });

    socketRef.current.on('room-users', (users) => {
      console.log('Users in room:', users);
    });

    socketRef.current.on('user-joined', (userData) => {
      console.log('User joined:', userData);
      toast.info(`${userData.userName} joined the session`);
    });

    socketRef.current.on('user-left', (userData) => {
      console.log('User left:', userData);
      toast.info(`${userData.userName} left the session`);
      
      // Cleanup peer connection if user left
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    });

    socketRef.current.on('signal', (data) => {
      console.log('Received signal:', data.type);
      if (peerRef.current) {
        peerRef.current.signal(data);
      }
    });
    
    // Chat messages
    socketRef.current.on('receive-message', (message) => {
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
      console.log(`User ${userId} is ${isSharing ? 'sharing screen' : 'stopped sharing screen'}`);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error('Connection error');
    });
  };

  const initMedia = async () => {
    try {
      // Get user media (video and audio)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      localStreamRef.current = stream;
      
      // Set video element source
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Could not access camera/microphone. Please check permissions.');
    }
  };

  const initWebRTC = () => {
    // Create peer connection
    peerRef.current = new Peer({
      initiator: true,
      trickle: true,
      stream: localStreamRef.current,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      }
    });

    // Peer event listeners
    peerRef.current.on('signal', (data) => {
      // Send signaling data through socket
      socketRef.current.emit('signal', {
        roomId: pairId,
        data: data
      });
    });

    peerRef.current.on('stream', (stream) => {
      // Set remote video stream
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    peerRef.current.on('error', (error) => {
      console.error('Peer error:', error);
      toast.error('Connection error. Please try again.');
    });

    peerRef.current.on('close', () => {
      console.log('Peer connection closed');
      peerRef.current = null;
    });

    peerRef.current.on('connect', () => {
      console.log('WebRTC connection established');
    });
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
    if (!pairDetails || !user) return null;
    
    if (pairDetails.user1._id === user._id) {
      return pairDetails.user2;
    } else {
      return pairDetails.user1;
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