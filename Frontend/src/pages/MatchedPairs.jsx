// pages/MatchedPairs.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userAPI, sessionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Users,
  Calendar,
  Video,
  MessageCircle,
  GraduationCap,
  Clock,
  Plus,
} from 'lucide-react';

const MatchedPairs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [selectedPair, setSelectedPair] = useState(null);
  const [sessionData, setSessionData] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    duration: 60,
    skillTaught: '',
    skillLearned: '',
  });

  useEffect(() => {
    if (user) {
      fetchMatchedPairs();
    }
  }, [user]);

  const fetchMatchedPairs = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUserPairs();
      
      if (response.data) {
        setPairs(response.data);
      }
    } catch (error) {
      console.error('Error fetching matched pairs:', error);
      toast.error('Failed to load matched pairs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      if (!selectedPair) return;

      const sessionPayload = {
        matchedPairId: selectedPair._id,
        title: sessionData.title,
        description: sessionData.description,
        scheduledTime: sessionData.scheduledTime,
        duration: sessionData.duration,
        skillTaught: selectedPair.skill1To2 || { name: sessionData.skillTaught },
        skillLearned: selectedPair.skill2To1 || { name: sessionData.skillLearned },
      };

      const response = await sessionAPI.createSession(sessionPayload);
      
      if (response.data) {
        toast.success('Session created successfully!');
        setShowCreateSession(false);
        setSessionData({
          title: '',
          description: '',
          scheduledTime: '',
          duration: 60,
          skillTaught: '',
          skillLearned: '',
        });
        // Refresh the pairs data
        fetchMatchedPairs();
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(error.response?.data?.message || 'Failed to create session');
    }
  };

  const startSession = (pair) => {
    // Navigate to video call room or session room
    navigate(`/session/${pair._id}`);
  };

  const getOtherUser = (pair) => {
    // Determine which user is the other user (not the current user)
    if (user && pair.user1) {
      return pair.user1._id === user._id ? pair.user2 : pair.user1;
    }
    return { name: 'Unknown User', avatar: '' };
  };

  const getSkillTaughtByCurrentUser = (pair) => {
    if (!user || !pair) return { name: '', level: '' };
    
    // Determine which skill the current user is teaching
    if (pair.user1 && pair.user1._id === user._id) {
      return pair.skill1To2 || { name: '', level: '' };
    } else if (pair.user2 && pair.user2._id === user._id) {
      return pair.skill2To1 || { name: '', level: '' };
    }
    return { name: '', level: '' };
  };

  const getSkillLearnedByCurrentUser = (pair) => {
    if (!user || !pair) return { name: '', level: '' };
    
    // Determine which skill the current user is learning
    if (pair.user1 && pair.user1._id === user._id) {
      return pair.skill2To1 || { name: '', level: '' };
    } else if (pair.user2 && pair.user2._id === user._id) {
      return pair.skill1To2 || { name: '', level: '' };
    }
    return { name: '', level: '' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning Partners</h1>
          <p className="text-gray-600 mt-2">Manage your active skill exchanges</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {pairs.length} active {pairs.length === 1 ? 'pair' : 'pairs'}
          </span>
        </div>
      </div>

      {pairs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <Users className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No active pairs</h3>
          <p className="mt-2 text-gray-500">
            You don't have any active learning partners yet.
          </p>
          <Link
            to="/explore"
            className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Find Partners
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pairs.map((pair) => {
            const otherUser = getOtherUser(pair);
            const skillTaught = getSkillTaughtByCurrentUser(pair);
            const skillLearned = getSkillLearnedByCurrentUser(pair);
            
            return (
              <div key={pair._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                        {otherUser.avatar ? (
                          <img
                            src={otherUser.avatar}
                            alt={otherUser.name}
                            className="h-16 w-16 rounded-full"
                          />
                        ) : (
                          <Users className="h-8 w-8 text-gray-500" />
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-900">{otherUser.name}</h3>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          Matched on {new Date(pair.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      pair.status === 'active' ? 'bg-green-100 text-green-800' :
                      pair.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pair.status.charAt(0).toUpperCase() + pair.status.slice(1)}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center text-sm font-medium text-green-800 mb-2">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        You Teach
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-green-900">{skillTaught.name}</span>
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {skillTaught.level}
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center text-sm font-medium text-blue-800 mb-2">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        You Learn
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-blue-900">{skillLearned.name}</span>
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {skillLearned.level}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Completed Sessions</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {pair.totalSessionsCompleted || 0}
                      </div>
                    </div>
                    {pair.nextSession && (
                      <div className="p-4 bg-primary-50 rounded-lg">
                        <div className="flex items-center text-sm text-primary-700 mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          Next Session
                        </div>
                        <div className="text-sm font-medium text-primary-900">
                          {new Date(pair.nextSession.date).toLocaleDateString()}
                        </div>
                        {pair.nextSession.topic && (
                          <div className="text-xs text-primary-600">
                            {pair.nextSession.topic}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={() => startSession(pair)}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:cursor-pointer hover:bg-gray-50 transition flex items-center justify-center"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Start Session
                    </button>
                    <Link
                      to={`/session/${pair._id}`}
                      className="flex-1 border border-gray-300 text-gray-700  py-2 px-4 rounded-lg hover:bg-gray-50  transition flex items-center justify-center"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      View Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedPair(pair);
                        setShowCreateSession(true);
                      }}
                      className="border hover:cursor-pointer border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition"
                      title="Schedule Session"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateSession && selectedPair && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-cyan-500  rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Schedule New Session
            </h3>
            
            <form onSubmit={handleCreateSession}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Title
                  </label>
                  <input
                    type="text"
                    value={sessionData.title}
                    onChange={(e) => setSessionData({ ...sessionData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Introduction to React Hooks"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={sessionData.description}
                    onChange={(e) => setSessionData({ ...sessionData, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="What will you cover in this session?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={sessionData.scheduledTime}
                      onChange={(e) => setSessionData({ ...sessionData, scheduledTime: e.target.value })}
                      className="w-full px-3 py-2 border hover:cursor-pointer border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <select
                      value={sessionData.duration}
                      onChange={(e) => setSessionData({ ...sessionData, duration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border hover:cursor-pointer border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                     
                      <option value="30">30 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                      <option value="120">120 min</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skill You'll Teach
                  </label>
                  <div className="px-3 py-2 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-900">{getSkillTaughtByCurrentUser(selectedPair).name}</span>
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {getSkillTaughtByCurrentUser(selectedPair).level}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skill You'll Learn
                  </label>
                  <div className="px-3 py-2 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-900">{getSkillLearnedByCurrentUser(selectedPair).name}</span>
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {getSkillLearnedByCurrentUser(selectedPair).level}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateSession(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 border hover:cursor-pointer hover:bg-gray-50 border-gray-300 text-gray-700 rounded-lg hover:bg-primary-700 transition"
                >
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchedPairs;