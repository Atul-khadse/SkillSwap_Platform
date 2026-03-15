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
  X,
  Save,
  BookOpen
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

  // UseEffect for profile fetching removed as per original logic/safety

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
      const updatedData = { ...formData, skillsOffered, skillsNeeded };
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
    <div className="min-h-screen bg-gray-50/50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Profile</h1>
            <p className="text-gray-500 mt-1 font-medium">Personalize your exchange identity</p>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-sm
              ${editMode 
                ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50' 
                : 'bg-gray-900 text-white hover:bg-gray-800'}`}
          >
            {editMode ? <><X className="h-4 w-4" /> Cancel</> : <><Pencil className="h-4 w-4" /> Edit Profile</>}
          </button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
          
          {/* Profile Hero Header */}
          <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 p-8 sm:p-12">
            {/* Dot Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: `radial-gradient(#fff 1.2px, transparent 1.2px)`, backgroundSize: '20px 20px' }} />
            
            <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6">
              <div className="relative group">
                <div className="h-32 w-32 bg-white rounded-3xl flex items-center justify-center p-1 shadow-2xl overflow-hidden transform transition-transform group-hover:rotate-3">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt={formData.name} className="h-full w-full object-cover rounded-[1.4rem]" />
                  ) : (
                    <div className="h-full w-full bg-blue-50 flex items-center justify-center rounded-[1.4rem]">
                      <User className="h-14 w-14 text-blue-600" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-center sm:text-left flex-1 pb-2">
                <h2 className="text-3xl font-bold text-white">{formData.name || 'Your Name'}</h2>
                <p className="text-blue-200/80 mt-2 max-w-md line-clamp-2 leading-relaxed font-medium">
                  {formData.bio || 'Add a bio to let others know what you are about.'}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-sm font-semibold text-blue-100/70">
                  {formData.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-blue-400" /> {formData.location}</span>}
                  {formData.timezone && <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-blue-400" /> {formData.timezone}</span>}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-10">
            {/* Basic Info Section */}
            <section>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                <div className="h-1 w-8 bg-blue-500 rounded-full" /> Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Full Name', name: 'name', icon: User, type: 'text' },
                  { label: 'Email Address', name: 'email', icon: Mail, type: 'email' },
                  { label: 'Location', name: 'location', icon: MapPin, type: 'text', placeholder: 'City, Country' }
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{field.label}</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                        <field.icon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        placeholder={field.placeholder}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-2xl transition-all outline-none font-medium
                          ${editMode ? 'border-gray-100 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50' : 'border-transparent bg-gray-50 text-gray-600'}`}
                      />
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Timezone</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-2xl transition-all outline-none font-medium appearance-none
                        ${editMode ? 'border-gray-100 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50' : 'border-transparent bg-gray-50 text-gray-600'}`}
                    >
                      <option value="">Select timezone</option>
                      <option value="UTC-5">EST (UTC-5)</option>
                      <option value="UTC-8">PST (UTC-8)</option>
                      <option value="UTC+0">GMT (UTC+0)</option>
                      <option value="UTC+5:30">IST (UTC+5:30)</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Professional Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    rows="3"
                    className={`w-full px-4 py-4 border-2 rounded-2xl transition-all outline-none font-medium resize-none
                      ${editMode ? 'border-gray-100 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50' : 'border-transparent bg-gray-50 text-gray-600'}`}
                  />
                </div>
              </div>
            </section>

            {/* Skills Offered Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                  <div className="h-1 w-8 bg-emerald-500 rounded-full" /> Skills I Can Teach
                </h3>
              </div>

              {editMode && (
                <div className="flex flex-col md:flex-row gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-[1.5rem] mb-6 animate-in slide-in-from-top-2">
                  <input
                    type="text"
                    value={newSkillOffered.name}
                    onChange={(e) => setNewSkillOffered({ ...newSkillOffered, name: e.target.value })}
                    placeholder="E.g. React"
                    className="flex-1 px-4 py-2 border-none rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold"
                  />
                  <select
                    value={newSkillOffered.level}
                    onChange={(e) => setNewSkillOffered({ ...newSkillOffered, level: e.target.value })}
                    className="md:w-40 px-4 py-2 border-none rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold appearance-none"
                  >
                    {skillLevels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddSkillOffered}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-xl hover:bg-emerald-700 transition font-bold text-sm shadow-lg shadow-emerald-200"
                  >
                    Add
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillsOffered.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group transition-all hover:border-emerald-200 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{skill.name}</p>
                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-tighter">{skill.level}</p>
                      </div>
                    </div>
                    {editMode && (
                      <button type="button" onClick={() => handleRemoveSkillOffered(index)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Skills Needed Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                  <div className="h-1 w-8 bg-blue-500 rounded-full" /> Skills I Want to Learn
                </h3>
              </div>

              {editMode && (
                <div className="flex flex-col lg:flex-row gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-[1.5rem] mb-6">
                  <input
                    type="text"
                    value={newSkillNeeded.name}
                    onChange={(e) => setNewSkillNeeded({ ...newSkillNeeded, name: e.target.value })}
                    placeholder="E.g. Python"
                    className="flex-1 px-4 py-2 border-none rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newSkillNeeded.level}
                      onChange={(e) => setNewSkillNeeded({ ...newSkillNeeded, level: e.target.value })}
                      className="flex-1 px-4 py-2 border-none rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold appearance-none"
                    >
                      {skillLevels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <select
                      value={newSkillNeeded.priority}
                      onChange={(e) => setNewSkillNeeded({ ...newSkillNeeded, priority: e.target.value })}
                      className="flex-1 px-4 py-2 border-none rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold appearance-none"
                    >
                      {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSkillNeeded}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition font-bold text-sm shadow-lg shadow-blue-200"
                  >
                    Add
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillsNeeded.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{skill.name}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase text-blue-500">{skill.level}</span>
                          <span className={`text-[10px] font-black uppercase px-2 rounded-md ${
                            skill.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {skill.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    {editMode && (
                      <button type="button" onClick={() => handleRemoveSkillNeeded(index)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Footer Form Actions */}
            {editMode && (
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-8 py-3 bg-white border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-10 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black active:scale-95 transition-all shadow-xl shadow-gray-200 disabled:bg-gray-400"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Save className="h-5 w-5" /> Save Changes</>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;