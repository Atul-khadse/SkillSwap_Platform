// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { userAPI, exchangeAPI, sessionAPI } from '../services/api.jsx';
import toast from 'react-hot-toast';
import {
  Users,
  GraduationCap,
  Calendar,
  MessageCircle,
  ArrowRight,
  User,
  Clock,
  Trophy,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMatches: 0,
    upcomingSessions: 0,
    pendingRequests: 0,
    skillsLearned: 0,
    completedExchanges: 0, // new
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch multiple data sources in parallel
      const [requestsResponse, pairsResponse, sessionsResponse] = await Promise.all([
        exchangeAPI.getRequests('received'),
        userAPI.getUserPairs(),
        userAPI.getUpcomingSessions(),
      ]);

      // Get pending requests
      const pendingRequests = requestsResponse.data?.filter(req => req.status === 'pending') || [];
      
      // Calculate stats from real data
      setStats({
        totalMatches: pairsResponse.data?.length || 0,
        upcomingSessions: sessionsResponse.data?.length || 0,
        pendingRequests: pendingRequests.length,
        skillsLearned: user?.skillsNeeded?.length || 0,
        completedExchanges: user?.completedPairsCount || 0,
      });

      // Set recent requests (last 3 pending)
      setRecentRequests(pendingRequests.slice(0, 3));

      // Set upcoming sessions
      setUpcomingSessions(sessionsResponse.data || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Matches',
      value: stats.totalMatches,
      icon: Users,
      color: 'bg-blue-500',
      link: '/pairs',
    },
    {
      title: 'Upcoming Sessions',
      value: stats.upcomingSessions,
      icon: Calendar,
      color: 'bg-green-500',
      link: '/pairs',
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: MessageCircle,
      color: 'bg-yellow-500',
      link: '/requests',
    },
    {
      title: 'Skills Learning',
      value: stats.skillsLearned,
      icon: GraduationCap,
      color: 'bg-purple-500',
      link: '/profile',
    },  {
    title: 'Completed Exchanges',
    value: stats.completedExchanges,
    icon: Trophy,
    color: 'bg-amber-500',
    link: '/profile',
  },
  ];

  // Helper function to get the other user in a session
  const getOtherUser = (session) => {
    if (!session || !user) return { name: 'Partner' };
    
    if (session.teacher && session.teacher._id === user._id) {
      return session.student || { name: 'Partner' };
    } else if (session.student && session.student._id === user._id) {
      return session.teacher || { name: 'Partner' };
    }
    return { name: 'Partner' };
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
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Continue your learning journey with SkillSwap
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center text-[#3ec5f1] hover:text-[#066b86] mt-4 text-sm">
              <span>View details</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Requests */}
        <div className=" rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Requests</h2>
            <Link
              to="/requests"
              className="text-[#3ec5f1] hover:text-[#066b86] text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className=" space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            
             <style>
      {`
        .overflow-y-auto::-webkit-scrollbar {
          display: none;
        }
      `}
    </style>
    {recentRequests.length > 0 ? (
              recentRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-4 hover:bg-gray-300 bg-[#3ec5f1]/10 duration-300 transition rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {request.requester?.avatar ? (
                        <img
                          src={request.requester.avatar}
                          alt={request.requester.name}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <User className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">
                        {request.requester?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Wants to learn: {request.skillRequested?.name || 'Unknown Skill'}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    Pending
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No pending requests
              </p>
            )}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className=" bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
            <Link
              to="/pairs"
              className="text-[#3ec5f1] hover:text-[#066b86] text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className=" space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
             <style>
      {`
        .overflow-y-auto::-webkit-scrollbar {
          display: none;
        }
      `}
    </style>
             {upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => {
                const otherUser = getOtherUser(session);
                return (
                  <div
                    key={session._id}
                    className="p-4  rounded-lg hover:bg-gray-300 bg-[#3ec5f1]/10 duration-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{session.title}</h3>
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <User className="h-4 w-4 mr-1" />
                          <span>{otherUser.name}</span>
                          <Clock className="h-4 w-4 ml-4 mr-1" />
                          <span>{new Date(session.scheduledTime).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        {session.skillTaught?.name || 'Skill'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-8">
                No upcoming sessions
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/explore"
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md hover:bg-[#3ec5f1]/10  duration-300 transition flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Users className="h-5 w-5 text-[#3ec5f1]" />
              </div>
              <span className="font-medium text-gray-900">Find Partners</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </Link>
          <Link
            to="/profile"
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md hover:bg-[#3ec5f1]/10 duration-300 transition flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <GraduationCap className="h-5 w-5 text-[#3ec5f1]" />
              </div>
              <span className="font-medium text-gray-900">Update Skills</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </Link>
          <Link
            to="/requests"
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md hover:bg-[#3ec5f1]/10 duration-300 transition flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <MessageCircle className="h-5 w-5 text-[#3ec5f1]" />
              </div>
              <span className="font-medium text-gray-900">View Requests</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;