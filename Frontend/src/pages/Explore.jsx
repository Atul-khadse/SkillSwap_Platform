import React, { useState, useEffect } from 'react';
import { userAPI, exchangeAPI } from '../services/api.jsx';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  User,
  GraduationCap,
  MapPin,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Explore = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    skill: '',
    location: '',
    level: '',
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({
    skillOffered: '',
    skillRequested: '',
    message: '',
  });
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10); // items per page

  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [page]); // refetch when page changes

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Pass filters and pagination to the backend
      const response = await userAPI.getUsers({
        ...filters,
        page,
        limit,
      });
      
      // The backend returns: { users, page, pages, total }
      const { users: usersArray, pages } = response.data;
      setUsers(usersArray || []);
      setTotalPages(pages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // reset to first page on new search
    fetchUsers();
  };

  const resetFilters = () => {
    setFilters({ skill: '', location: '', level: '' });
    setPage(1);
    fetchUsers();
  };

  const handleSendRequest = async () => {
    try {
      if (!selectedUser?._id) {
        toast.error('Invalid user selected');
        return;
      }

      const requestPayload = {
        recipientId: selectedUser._id,
        skillOffered: {
          name: requestData.skillOffered,
          level: 'intermediate' // You can map from current user's actual skill level
        },
        skillRequested: {
          name: requestData.skillRequested,
          level: 'beginner' // You can map from selected user's actual skill level
        },
        message: requestData.message,
      };

      const response = await exchangeAPI.sendRequest(requestPayload);
      
      if (response.data) {
        toast.success('Exchange request sent successfully!');
        setShowRequestModal(false);
        setSelectedUser(null);
        setRequestData({ skillOffered: '', skillRequested: '', message: '' });
      }
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ec5f1]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Partners</h1>
        <p className="text-gray-600">
          Find people who want to learn what you know and can teach what you want to learn
        </p>
      </div>

      {/* Search and Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skill
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.skill}
                onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
                placeholder="Search skills..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ec5f1] focus:border-transparent"
              />
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="City, Country"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ec5f1] focus:border-transparent"
              />
              <MapPin className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium hover:cursor-pointer text-gray-700 mb-1">
              Skill Level
            </label>
            <select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3ec5f1] focus:border-transparent"
            >
              <option value="">All Levels</option>
              {skillLevels.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full hover:cursor-pointer bg-[#3ec5f1] text-white px-4 py-2 rounded-lg hover:bg-[#2b9ae4] transition font-medium flex items-center justify-center"
            >
              <Filter className="h-5 w-5 mr-2" />
              Search
            </button>
          </div>
        </div>
        
        {/* Reset filter button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm text-[#3ec5f1] hover:text-[#2b9ae4]"
          >
            Reset all filters
          </button>
        </div>
      </form>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No users found. Try adjusting your search filters.</p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
            >
              <div className="p-6">
                <div className="flex items-start">
                  <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-16 w-16 rounded-full"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    {user.location && (
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {user.location}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-1 text-green-600" />
                      Skills Offered
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {user.skillsOffered?.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {skill.name} ({skill.level})
                        </span>
                      ))}
                      {user.skillsOffered?.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{user.skillsOffered.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-1 text-blue-600" />
                      Skills Wanted
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {user.skillsNeeded?.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {skill.name} ({skill.level})
                        </span>
                      ))}
                      {user.skillsNeeded?.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 hover:cursor-pointer text-gray-600 text-xs rounded-full">
                          +{user.skillsNeeded.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4">
              
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowRequestModal(true);
                  }}
                  className="w-full hover:cursor-pointer bg-[#3ec5f1] text-white py-2 rounded-lg hover:bg-[#2b9ae4] transition font-medium"
                >
                  Send Exchange Request
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Request Modal (unchanged) */}
      {showRequestModal && selectedUser && (
        <div className="fixed inset-0 bg-blue-50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Send Exchange Request to {selectedUser.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill You'll Offer
                </label>
                <select
                  value={requestData.skillOffered}
                  onChange={(e) => setRequestData({ ...requestData, skillOffered: e.target.value })}
                  className="w-full px-3 py-2 border hover:cursor-pointer border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a skill</option>
                  {selectedUser.skillsNeeded?.map((skill, index) => (
                    <option key={index} value={skill.name}>
                      {skill.name} ({skill.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill You Want to Learn
                </label>
                <select
                  value={requestData.skillRequested}
                  onChange={(e) => setRequestData({ ...requestData, skillRequested: e.target.value })}
                  className="w-full px-3 py-2 border hover:cursor-pointer border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a skill</option>
                  {selectedUser.skillsOffered?.map((skill, index) => (
                    <option key={index} value={skill.name}>
                      {skill.name} ({skill.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={requestData.message}
                  onChange={(e) => setRequestData({ ...requestData, message: e.target.value })}
                  rows="3"
                  placeholder="Introduce yourself and suggest a time..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border hover:cursor-pointer border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                className="px-4 py-2 bg-[#1199c7] hover:cursor-pointer text-white rounded-lg hover:bg-[#81d9f1] transition"
                disabled={!requestData.skillOffered || !requestData.skillRequested}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;