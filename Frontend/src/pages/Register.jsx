import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff, GraduationCap, ArrowRight, Sparkles, X, Plus } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        ...formData,
        skillsOffered: skills.map(skill => ({ name: skill, level: 'intermediate' })),
        skillsNeeded: [{ name: 'JavaScript', level: 'beginner' }], // Default
      };

      console.log('Sending registration data:', userData);
      const result = await register(userData);
      console.log('Registration response:', result);
      
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 overflow-hidden">
      {/* High-Visibility Dot Pattern */}
      <div className="absolute inset-0 z-0 opacity-100" 
           style={{ 
             backgroundImage: `radial-gradient(#cbd5e1 1.5px, transparent 1.5px)`, 
             backgroundSize: '24px 24px' 
           }}>
      </div>
      
      {/* Animated Gradient Blobs */}
      <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-cyan-200/40 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[35%] bg-teal-200/40 rounded-full blur-[100px] animate-pulse delay-700"></div>

      <div className="max-w-2xl w-full z-10 animate-in fade-in zoom-in duration-700">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 bg-gradient-to-tr from-[#1B6F81] to-[#3ec5f1] rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-200 mb-4 rotate-3">
            <Sparkles className="text-white h-8 w-8" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Create your account</h2>
          <p className="mt-2 text-slate-500 font-medium">
            Join the community or{' '}
            <Link to="/login" className="text-[#1B6F81] hover:underline decoration-2 font-bold">sign in here</Link>
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/90 backdrop-blur-md p-8 sm:p-10 rounded-[2.5rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] border border-white">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-[#1B6F81] transition-colors" />
                  </div>
                  <input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#3ec5f1]/10 focus:border-[#3ec5f1] outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#1B6F81] transition-colors" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#3ec5f1]/10 focus:border-[#3ec5f1] outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#1B6F81] transition-colors" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-12 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#3ec5f1]/10 focus:border-[#3ec5f1] outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#1B6F81] transition-colors" />
                  </div>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-12 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#3ec5f1]/10 focus:border-[#3ec5f1] outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400">
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 ml-1">Skills You Can Teach</label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-slate-400 group-focus-within:text-[#1B6F81]" />
                  </div>
                  <input
                    type="text"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="e.g., React, UI Design..."
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#3ec5f1]/10 focus:border-[#3ec5f1] outline-none transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="bg-[#1B6F81] text-white p-3 rounded-2xl hover:bg-slate-900 transition-colors shadow-lg shadow-cyan-100"
                >
                  <Plus className="h-6 w-6" />
                </button>
              </div>

              {/* Skill Tags */}
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {skills.map((skill, index) => (
                  <span key={index} className="inline-flex items-center px-4 py-1.5 rounded-xl text-sm font-bold bg-[#3ec5f1]/10 text-[#1B6F81] border border-[#3ec5f1]/20 animate-in zoom-in duration-300">
                    {skill}
                    <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-2 hover:text-red-500 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start px-1">
              <input id="terms" type="checkbox" required className="mt-1 h-4 w-4 text-[#1B6F81] border-slate-300 rounded cursor-pointer" />
              <label htmlFor="terms" className="ml-3 text-sm text-slate-600 leading-tight">
                I agree to the <Link to="/terms" className="text-[#1B6F81] font-bold">Terms</Link> and <Link to="/privacy" className="text-[#1B6F81] font-bold">Privacy Policy</Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-4 px-4 rounded-2xl text-white bg-slate-900 hover:bg-[#1B6F81] font-bold shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-70 group"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Building Profile...
                </div>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Social Sign Up */}
          <div className="mt-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
                <span className="px-4 bg-white">Fast Track Registration</span>
              </div>
            </div>
            <button className="w-full flex items-center justify-center space-x-3 py-3.5 px-4 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all font-bold text-slate-700 active:scale-[0.98]">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-6 w-6" alt="Google" />
              <span>Sign up with Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;