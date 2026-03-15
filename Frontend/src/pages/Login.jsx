import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const auth = useAuth();
  console.log('Auth context:', auth);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(formData);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error details:', error);
      toast.error('Login failed. Please try again.');
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
      
      {/* Animated Gradient Blobs for "Attractive" UI */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-200/40 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/40 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="max-w-md w-full z-10 animate-in fade-in zoom-in duration-700">
        {/* Brand/Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="group relative">
            <div className="h-16 w-16 bg-gradient-to-tr from-[#1B6F81] to-[#3ec5f1] rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-200 mb-4 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
              <Sparkles className="text-white h-8 w-8 transition-transform group-hover:animate-bounce" />
            </div>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            SkillSwap
          </h2>
          <p className="mt-2 text-slate-500 font-medium">
            Step back into your growth journey.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] border border-white/60">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#1B6F81] transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#3ec5f1]/10 focus:border-[#3ec5f1] transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="password" className="block text-sm font-bold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#1B6F81] transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#3ec5f1]/10 focus:border-[#3ec5f1] transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#1B6F81] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#1B6F81] focus:ring-[#3ec5f1] border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 font-semibold cursor-pointer">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="text-sm font-bold text-[#1B6F81] hover:text-[#3ec5f1]">
                Forgot?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-4 px-4 rounded-2xl text-white bg-slate-900 hover:bg-[#1B6F81] font-bold shadow-xl shadow-slate-200 transition-all active:scale-[0.96] disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden relative"
            >
              <div className="relative z-10 flex items-center">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    Sign in to Account
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-4 bg-white text-slate-400 font-bold tracking-[0.2em]">Social Secure Access</span>
              </div>
            </div>

            <button className="w-full flex items-center justify-center space-x-3 py-3.5 px-4 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all font-bold text-slate-700 group active:scale-[0.98]">
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                className="h-6 w-6 group-hover:scale-110 transition-transform" 
                alt="Google Logo" 
              />
              <span>Continue with Google</span>
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-500 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#1B6F81] hover:underline decoration-2 underline-offset-4 font-bold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;