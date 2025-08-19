import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheckIcon, 
  DocumentTextIcon, 
  PlusIcon, 
  UserIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Papan Pemuka', href: '/dashboard', icon: DocumentTextIcon, roles: ['citizen', 'pdrm', 'insurance'] },
    { name: 'Laporan Baharu', href: '/reports/new', icon: PlusIcon, roles: ['citizen'] },
    { name: 'Portal PDRM', href: '/pdrm', icon: ShieldCheckIcon, roles: ['pdrm'] },
    { name: 'Portal Insurans', href: '/insurance', icon: DocumentTextIcon, roles: ['insurance'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.user_type)
  );

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const getUserTypeDisplay = (userType) => {
    switch (userType) {
      case 'citizen':
        return 'Rakyat';
      case 'pdrm':
        return 'Pegawai PDRM';
      case 'insurance':
        return 'Ejen Insurans';
      default:
        return 'Pengguna';
    }
  };

  return (
    <nav className="police-header shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg leading-tight">PDRM</span>
                <span className="text-police-200 text-xs leading-tight">Laporan Kemalangan</span>
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-police-700 text-white'
                      : 'text-police-100 hover:bg-police-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-3 text-white">
              <UserIcon className="h-5 w-5" />
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium">{user?.full_name}</span>
                <span className="text-xs text-police-200">{getUserTypeDisplay(user?.user_type)}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-police-100 hover:bg-police-700 hover:text-white transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Log Keluar</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:bg-police-700 p-2 rounded-md"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-police-800 border-t border-police-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-police-700 text-white'
                      : 'text-police-100 hover:bg-police-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Mobile user info and logout */}
          <div className="border-t border-police-700 px-2 py-3">
            <div className="flex items-center space-x-3 px-3 py-2 text-white">
              <UserIcon className="h-5 w-5" />
              <div>
                <div className="text-sm font-medium">{user?.full_name}</div>
                <div className="text-xs text-police-200">{getUserTypeDisplay(user?.user_type)}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-3 py-2 rounded-md text-base font-medium text-police-100 hover:bg-police-700 hover:text-white transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Log Keluar</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;