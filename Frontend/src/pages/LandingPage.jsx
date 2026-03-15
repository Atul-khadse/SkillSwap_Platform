import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Users,
  Calendar,
  MessageCircle,
  Video,
  ArrowRight,
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Users,
      title: 'One-to-One Exchange',
      description: 'Connect directly with people who want to learn what you know and vice versa.',
    },
    {
      icon: GraduationCap,
      title: 'Skill Swapping',
      description: 'Offer your expertise in exchange for learning something new from someone else.',
    },
    {
      icon: Calendar,
      title: 'Flexible Scheduling',
      description: 'Plan sessions that work for both you and your learning partner.',
    },
    {
      icon: MessageCircle,
      title: 'Built-in Communication',
      description: 'Chat and video call directly on the platform with your partner.',
    },
    {
      icon: Video,
      title: 'Integrated Video',
      description: 'Seamless video calls for effective learning sessions.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#3ec5f1]/20 selection:text-[#1B6F81]">
      {/* Navigation - Glassmorphism Sticky Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center group cursor-pointer">
              {/* FIXED GRADIENT HERE */}
              <div className="h-10 w-10 bg-gradient-to-br from-[#1B6F81] to-purple-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-[#3ec5f1]/50 transition-all duration-300">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-extrabold text-slate-900 tracking-tight">
                SkillSwap
              </span>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-6">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="bg-[#1B6F81] text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-[#13505d] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:inline-flex text-slate-600 font-medium hover:text-[#3ec5f1] transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[#3ec5f1] text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-[#2bb2df] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decorative blobs */}
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#3ec5f1]/20 blur-3xl opacity-50 mix-blend-multiply"></div>
          <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-100/50 blur-3xl opacity-50 mix-blend-multiply"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
              Learn Anything. <br className="hidden sm:block" /> Teach Anything.{' '}
              {/* FIXED GRADIENT HERE */}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3ec5f1] to-purple-600">
                For Free.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              SkillSwap is a peer-to-peer learning platform where you exchange your
              skills with others. No money involved, just pure knowledge sharing.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                to={isAuthenticated ? "/explore" : "/register"}
                className="w-full sm:w-auto bg-[#3ec5f1] text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg shadow-[#3ec5f1]/30 hover:bg-[#2bb2df] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
              >
                Start Swapping
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/about"
                className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl text-lg font-semibold shadow-sm hover:border-[#3ec5f1] hover:text-[#3ec5f1] hover:bg-slate-50 transition-all duration-300 text-center"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-white py-24 border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            {/* FIXED GRADIENT HERE */}
            <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3ec5f1] to-purple-600 tracking-wide uppercase mb-3">Platform Features</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              How SkillSwap Works
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-slate-50 border border-slate-100 p-8 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-[#3ec5f1]/10 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-14 w-14 bg-[#3ec5f1]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#3ec5f1] transition-colors duration-300">
                  <feature.icon className="h-7 w-7 text-[#3ec5f1] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-[#1B6F81]/30">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B6F81] via-[#3ec5f1] to-purple-800"></div>
          
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

          <div className="relative p-12 md:p-16 text-center text-white flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-white/90 text-lg md:text-xl mb-10 max-w-2xl">
              Join thousands of learners and teachers exchanging skills right now.
              Transform your curiosity into expertise.
            </p>
            <Link
              to={isAuthenticated ? "/explore" : "/register"}
              className="bg-white text-[#1B6F81] px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:bg-slate-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 inline-flex items-center group"
            >
              Get Started Free
              <ArrowRight className="h-6 w-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;