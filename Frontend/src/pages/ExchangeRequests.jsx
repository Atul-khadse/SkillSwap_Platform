import React, { useState, useEffect } from 'react';
import { exchangeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Inbox,
  Send,
  Check,
  X,
  User,
  GraduationCap,
  Clock,
} from 'lucide-react';

const ExchangeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await exchangeAPI.getRequests(activeTab);
      setRequests(response.data);
    } catch (error) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await exchangeAPI.acceptRequest(requestId);
      toast.success('Request accepted! You are now matched.');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await exchangeAPI.rejectRequest(requestId);
      toast.success('Request rejected');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Exchange Requests</h1>
        <p className="text-gray-600 mt-2">Manage your skill exchange requests</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('received')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'received'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Inbox className="h-4 w-4 inline mr-2" />
            Received ({requests.filter(r => activeTab === 'received').length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sent'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Send className="h-4 w-4 inline mr-2" />
            Sent ({requests.filter(r => activeTab === 'sent').length})
          </button>
        </nav>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <Inbox className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No requests</h3>
          <p className="mt-2 text-gray-500">
            {activeTab === 'received'
              ? "You haven't received any exchange requests yet."
              : "You haven't sent any exchange requests yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request._id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {activeTab === 'received' ? (
                        request.requester?.avatar ? (
                          <img
                            src={request.requester.avatar}
                            alt={request.requester.name}
                            className="h-12 w-12 rounded-full"
                          />
                        ) : (
                          <User className="h-6 w-6 text-gray-500" />
                        )
                      ) : (
                        request.recipient?.avatar ? (
                          <img
                            src={request.recipient.avatar}
                            alt={request.recipient.name}
                            className="h-12 w-12 rounded-full"
                          />
                        ) : (
                          <User className="h-6 w-6 text-gray-500" />
                        )
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {activeTab === 'received' ? request.requester?.name : request.recipient?.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center text-sm font-medium text-green-800 mb-2">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      You will teach
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-green-900">{request.skillOffered?.name}</span>
                      <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        {request.skillOffered?.level}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center text-sm font-medium text-blue-800 mb-2">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      You will learn
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-blue-900">{request.skillRequested?.name}</span>
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {request.skillRequested?.level}
                      </span>
                    </div>
                  </div>
                </div>

                {request.message && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{request.message}</p>
                  </div>
                )}

                {activeTab === 'received' && request.status === 'pending' && (
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={() => handleAccept(request._id)}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept Request
                    </button>
                    <button
                      onClick={() => handleReject(request._id)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center justify-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject Request
                    </button>
                  </div>
                )}

                {activeTab === 'sent' && request.status === 'pending' && (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      Waiting for {request.recipient?.name} to respond to your request
                    </p>
                  </div>
                )}

                {request.status === 'accepted' && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      Request accepted! You can now start scheduling sessions with{' '}
                      {activeTab === 'received' ? request.requester?.name : request.recipient?.name}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExchangeRequests;