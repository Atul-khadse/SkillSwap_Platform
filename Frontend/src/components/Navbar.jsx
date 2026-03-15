import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Home, 
  Compass, 
  Bell, 
  MessageSquare, 
  User, 
  LogOut, 
  Menu, 
  X, 
  GraduationCap 
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Requests', path: '/requests', icon: Bell },
    { name: 'Pairs', path: '/pairs', icon: MessageSquare },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center group cursor-pointer">
              <div className="h-10 w-10 bg-gradient-to-br from-[#1B6F81] to-[#3ec5f1] rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-[#3ec5f1]/50 transition-all duration-300">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-extrabold text-slate-900 tracking-tight group-hover:text-[#3ec5f1] transition-colors duration-300">
                SkillSwap
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-[#3ec5f1] hover:bg-[#3ec5f1]/10 transition-all duration-200 group"
              >
                <item.icon className="w-4 h-4 mr-2 text-slate-400 group-hover:text-[#3ec5f1] transition-colors" />
                {item.name}
              </Link>
            ))}
            
            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 mx-2"></div>

            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group"
            >
              <LogOut className="w-4 h-4 mr-2 text-slate-400 group-hover:text-red-600 transition-colors" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2.5 rounded-xl text-slate-500 hover:text-[#3ec5f1] hover:bg-[#3ec5f1]/10 focus:outline-none transition-colors duration-200"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100 border-b border-slate-200/50' : 'max-h-0 opacity-0'
        } bg-white`}
      >
        <div className="px-4 pt-2 pb-4 space-y-1 sm:px-6 shadow-inner shadow-slate-100">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-[#3ec5f1] hover:bg-[#3ec5f1]/10 transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="w-5 h-5 mr-3 text-slate-400" />
              {item.name}
            </Link>
          ))}
          <div className="my-2 border-t border-slate-100"></div>
          <button
            onClick={() => {
              handleLogout();
              setIsOpen(false);
            }}
            className="flex items-center w-full px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5 mr-3 text-slate-400" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;