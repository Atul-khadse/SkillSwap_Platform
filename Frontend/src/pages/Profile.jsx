import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  MapPin,
  Globe,
  GraduationCap,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    timezone: '',
    avatar: '',
  });
  const [skillsOffered, setSkillsOffered] = useState([]);
  const [skillsNeeded, setSkillsNeeded] = useState([]);
  const [newSkillOffered, setNewSkillOffered] = useState({ name: '', level: 'intermediate' });
  const [newSkillNeeded, setNewSkillNeeded] = useState({ name: '', level: 'beginner', priority: 'medium' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        timezone: user.timezone || '',
        avatar: user.avatar || '',
      });
      setSkillsOffered(user.skillsOffered || []);
      setSkillsNeeded(user.skillsNeeded || []);
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddSkillOffered = () => {
    if (newSkillOffered.name.trim()) {
      setSkillsOffered([...skillsOffered, { ...newSkillOffered }]);
      setNewSkillOffered({ name: '', level: 'intermediate' });
    }
  };

  const handleAddSkillNeeded = () => {
    if (newSkillNeeded.name.trim()) {
      setSkillsNeeded([...skillsNeeded, { ...newSkillNeeded }]);
      setNewSkillNeeded({ name: '', level: 'beginner', priority: 'medium' });
    }
  };

  const handleRemoveSkillOffered = (index) => {
    setSkillsOffered(skillsOffered.filter((_, i) => i !== index));
  };

  const handleRemoveSkillNeeded = (index) => {
    setSkillsNeeded(skillsNeeded.filter((_, i) => i !== index));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const updatedData = {
      ...formData,
      skillsOffered,
      skillsNeeded,
    };

    const result = await updateProfile(updatedData);
    if (result.success) {
      setEditMode(false);
      toast.success('Profile updated successfully!');
    }
  } catch (error) {
    console.error('Profile update error:', error);
    toast.error('Failed to update profile');
  } finally {
    setLoading(false);
  }
};

  const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const priorities = ['low', 'medium', 'high'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information and skills</p>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`px-4 py-2 rounded-lg flex items-center ${editMode ? 'bg-gray-200 text-gray-700' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
        >
          <Pencil className="h-4 w-4 mr-2" />
          {editMode ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-8">
          <div className="flex items-center">
            <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center border-4 border-white">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt={formData.name}
                  className="h-24 w-24 rounded-full"
                />
              ) : (
                <User className="h-12 w-12 text-primary-600" />
              )}
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-white">{formData.name}</h2>
              <p className="text-primary-100 mt-1">{formData.bio || 'No bio yet'}</p>
              <div className="flex items-center text-primary-100 mt-2 space-x-4">
                {formData.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {formData.location}
                  </div>
                )}
                {formData.timezone && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    {formData.timezone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg ${editMode ? 'border-gray-300 focus:ring-2 focus:ring-primary-500' : 'border-transparent bg-gray-50'}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg ${editMode ? 'border-gray-300 focus:ring-2 focus:ring-primary-500' : 'border-transparent bg-gray-50'}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  placeholder="City, Country"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg ${editMode ? 'border-gray-300 focus:ring-2 focus:ring-primary-500' : 'border-transparent bg-gray-50'}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg ${editMode ? 'border-gray-300 focus:ring-2 focus:ring-primary-500' : 'border-transparent bg-gray-50'}`}
                >
                  <option value="">Select timezone</option>
                  <option value="UTC-5">EST (UTC-5)</option>
                  <option value="UTC-8">PST (UTC-8)</option>
                  <option value="UTC+0">GMT (UTC+0)</option>
                  <option value="UTC+1">CET (UTC+1)</option>
                  <option value="UTC+5:30">IST (UTC+5:30)</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={!editMode}
                rows="3"
                placeholder="Tell others about yourself..."
                className={`w-full px-3 py-2 border rounded-lg ${editMode ? 'border-gray-300 focus:ring-2 focus:ring-primary-500' : 'border-transparent bg-gray-50'}`}
              />
            </div>
          </div>

          {/* Skills Offered */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-green-600" />
                Skills I Can Teach
              </h3>
              {editMode && (
                <button
                  type="button"
                  onClick={handleAddSkillOffered}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  <Plus className="h-4 w-4 inline mr-1" />
                  Add Skill
                </button>
              )}
            </div>

            {editMode && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <input
                    type="text"
                    value={newSkillOffered.name}
                    onChange={(e) => setNewSkillOffered({ ...newSkillOffered, name: e.target.value })}
                    placeholder="Skill name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <select
                    value={newSkillOffered.level}
                    onChange={(e) => setNewSkillOffered({ ...newSkillOffered, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {skillLevels.map(level => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddSkillOffered}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Add Skill
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {skillsOffered.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                >
                  <div>
                    <span className="font-medium text-green-800">{skill.name}</span>
                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      {skill.level}
                    </span>
                  </div>
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkillOffered(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Skills Needed */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                Skills I Want to Learn
              </h3>
              {editMode && (
                <button
                  type="button"
                  onClick={handleAddSkillNeeded}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  <Plus className="h-4 w-4 inline mr-1" />
                  Add Skill
                </button>
              )}
            </div>

            {editMode && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <input
                    type="text"
                    value={newSkillNeeded.name}
                    onChange={(e) => setNewSkillNeeded({ ...newSkillNeeded, name: e.target.value })}
                    placeholder="Skill name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <select
                    value={newSkillNeeded.level}
                    onChange={(e) => setNewSkillNeeded({ ...newSkillNeeded, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {skillLevels.map(level => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={newSkillNeeded.priority}
                    onChange={(e) => setNewSkillNeeded({ ...newSkillNeeded, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddSkillNeeded}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Add Skill
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {skillsNeeded.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <div>
                    <span className="font-medium text-blue-800">{skill.name}</span>
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {skill.level}
                    </span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      skill.priority === 'high' ? 'bg-red-100 text-red-800' :
                      skill.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {skill.priority}
                    </span>
                  </div>
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkillNeeded(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {editMode && (
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;