// pages/MatchedPairs.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userAPI, sessionAPI, ratingAPI } from '../services/api';
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



  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingPartner, setRatingPartner] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [hasRated, setHasRated] = useState(false);


  // Check if already rated when modal opens
  useEffect(() => {
    if (ratingPartner && user) {
      const checkRating = async () => {
        try {
          const res = await ratingAPI.checkUserRating(ratingPartner._id);
          setHasRated(res.data.rated);
        } catch (error) {
          console.error('Check rating error', error);
        }
      };
      checkRating();
    }
  }, [ratingPartner]);


  const handleRatePartner = (partner) => {
    setRatingPartner(partner);
    setShowRatingModal(true);
  };


  const handleSubmitRating = async () => {
    try {
      await ratingAPI.submitRating({
        ratedUserId: ratingPartner._id,
        score: ratingScore,
        comment: ratingComment
      });
      toast.success('Rating submitted!');
      setShowRatingModal(false);
      setRatingPartner(null);
      setRatingScore(5);
      setRatingComment('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    }
  };

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
    if (!user || !pair) return { name: 'Unknown', level: '' };

    let skill;
    if (pair.user1 && pair.user1._id === user._id) {
      skill = pair.skill1To2;
    } else if (pair.user2 && pair.user2._id === user._id) {
      skill = pair.skill2To1;
    } else {
      return { name: 'Unknown', level: '' };
    }

    // Handle if skill is a string (fallback) or missing
    if (!skill) return { name: 'Not specified', level: '' };
    if (typeof skill === 'string') {
      return { name: skill, level: '' };
    }
    return {
      name: skill.name || 'Unnamed',
      level: skill.level || ''
    };
  };

  const getSkillLearnedByCurrentUser = (pair) => {
    if (!user || !pair) return { name: 'Unknown', level: '' };

    let skill;
    if (pair.user1 && pair.user1._id === user._id) {
      skill = pair.skill2To1;
    } else if (pair.user2 && pair.user2._id === user._id) {
      skill = pair.skill1To2;
    } else {
      return { name: 'Unknown', level: '' };
    }

    if (!skill) return { name: 'Not specified', level: '' };
    if (typeof skill === 'string') {
      return { name: skill, level: '' };
    }
    return {
      name: skill.name || 'Unnamed',
      level: skill.level || ''
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ec5f1]"></div>
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
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${pair.status === 'active' ? 'bg-green-100 text-green-800' :
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
                    <button
                      onClick={() => handleRatePartner(otherUser)}
                      className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition"
                    >
                      Rate Partner
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
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-hidden">
          {/* Animated Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-3xl transition-opacity"
            onClick={() => setShowCreateSession(false)}
          />

          {/* Attractive UI Elements: Animated Blobs */}
          <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-cyan-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />

          {/* Integrated Dot Pattern Background */}
          <div className="absolute inset-0 z-0 opacity-100 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#cbd5e1 1.5px, transparent 1.5px)`,
              backgroundSize: '24px 24px'
            }}>
          </div>

          {/* Modal Container */}
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full border border-white/50 overflow-hidden transform transition-all animate-in zoom-in duration-300">

            {/* Decorative Header Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />

            <div className="relative p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Schedule New Session
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Set a time to exchange your expertise.</p>
                </div>
              </div>

              <form onSubmit={handleCreateSession} className="relative">
                <div className="space-y-5">
                  {/* Session Title */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                      Session Title
                    </label>
                    <input
                      type="text"
                      value={sessionData.title}
                      onChange={(e) => setSessionData({ ...sessionData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:border-transparent transition-all outline-none text-gray-900 placeholder:text-gray-400"
                      placeholder="e.g., Introduction to React Hooks"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                      Description
                    </label>
                    <textarea
                      value={sessionData.description}
                      onChange={(e) => setSessionData({ ...sessionData, description: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:border-transparent transition-all outline-none text-gray-900 resize-none"
                      placeholder="What will you cover in this session?"
                    />
                  </div>

                  {/* Grid for Time and Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                        Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={sessionData.scheduledTime}
                        onChange={(e) => setSessionData({ ...sessionData, scheduledTime: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 transition-all outline-none hover:cursor-pointer text-gray-900 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                        Duration
                      </label>
                      <select
                        value={sessionData.duration}
                        onChange={(e) => setSessionData({ ...sessionData, duration: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 transition-all outline-none hover:cursor-pointer text-gray-900 text-sm appearance-none"
                      >
                        <option value="30">30 min</option>
                        <option value="60">60 min</option>
                        <option value="90">90 min</option>
                        <option value="120">120 min</option>
                      </select>
                    </div>
                  </div>

                  {/* Skills Info Blocks */}
                  <div className="space-y-3 pt-2">
                    <div className="group p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl transition-all hover:bg-emerald-50">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Teaching</p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-900">{getSkillTaughtByCurrentUser(selectedPair).name}</span>
                        <span className="text-[10px] bg-emerald-200/50 text-emerald-800 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                          {getSkillTaughtByCurrentUser(selectedPair).level}
                        </span>
                      </div>
                    </div>

                    <div className="group p-4 bg-cyan-50/50 border border-cyan-100 rounded-2xl transition-all hover:bg-cyan-50">
                      <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1">Learning</p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-cyan-900">{getSkillLearnedByCurrentUser(selectedPair).name}</span>
                        <span className="text-[10px] bg-cyan-200/50 text-cyan-800 px-2.5 py-1 rounded-full font-bold border border-cyan-200">
                          {getSkillLearnedByCurrentUser(selectedPair).level}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowCreateSession(false)}
                    className="flex-1 px-4 py-3.5 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 active:scale-95 active:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] px-4 py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 shadow-xl shadow-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Schedule Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Rating Modal */}
      {showRatingModal && ratingPartner && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRatingModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Rate {ratingPartner.name}</h3>
            {hasRated ? (
              <p className="text-gray-600">You have already rated this user.</p>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Score (1-5)</label>
                  <select
                    value={ratingScore}
                    onChange={(e) => setRatingScore(Number(e.target.value))}
                    className="w-full border rounded-lg p-2"
                  >
                    {[1, 2, 3, 4, 5].map(score => (
                      <option key={score} value={score}>{score} star{score !== 1 && 's'}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Comment (optional)</label>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    rows="3"
                    className="w-full border rounded-lg p-2"
                    placeholder="Share your experience..."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitRating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Submit Rating
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchedPairs;