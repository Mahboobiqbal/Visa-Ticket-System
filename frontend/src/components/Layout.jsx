import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, createContext, useContext, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Ticket,
  Stamp,
  Banknote,
  Users,
  Settings,
  LogOut,
  Menu,
  Search,
  Plus,
  Clock,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tickets', icon: Ticket, label: 'Tickets' },
  { to: '/visas', icon: Stamp, label: 'Visa Processing' },
  { to: '/payments', icon: Banknote, label: 'Payments' },
  { to: '/agents', icon: Users, label: 'Agents' },
  { to: '/activity', icon: Clock, label: 'Activity' },
];

export const HeaderActionsContext = createContext(null);

export function useHeaderActions() {
  return useContext(HeaderActionsContext);
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerAction, setHeaderAction] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login');
  };

  const quickAddItems = [
    { label: 'Add Ticket', icon: Ticket, action: () => navigate('/tickets') },
    { label: 'Add Visa', icon: Stamp, action: () => navigate('/visas') },
    { label: 'Add Agent', icon: Users, action: () => navigate('/agents') },
  ];

  return (
    <HeaderActionsContext.Provider value={{ triggerAdd: setHeaderAction }}>
      <div className="flex h-screen overflow-hidden bg-[#f5f5f5]">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-[72px]' : 'w-[256px]'} flex-shrink-0 bg-[#fafafa] border-r border-[#d4d4d4] flex flex-col transition-all duration-200`}>
          {/* Logo */}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-6'} h-[64px]`}>
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#E74C3C] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">VT</span>
                </div>
                <span className="font-medium text-[15px] text-[#2E2E2E]">Visa & Ticket</span>
              </div>
            ) : (
              <div className="w-10 h-10 bg-[#E74C3C] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">VT</span>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 py-3 overflow-y-auto">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `mx-3 mb-1 flex items-center gap-4 px-4 py-2.5 rounded-r-full text-[14px] transition-all duration-150 ${
                    sidebarCollapsed ? 'justify-center px-0 mx-2 rounded-full' : ''
                  } ${
                    isActive
                      ? 'bg-[#d9d9d9] text-[#2E2E2E] font-medium'
                      : 'text-[#4A4A4A] hover:bg-[#e8e8e8]'
                  }`
                }
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!sidebarCollapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Collapse toggle */}
          <div className="px-3 pb-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-full text-[#4A4A4A] hover:bg-[#e8e8e8] text-sm transition-colors"
            >
              <Menu size={20} />
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>

          {/* User section */}
          <div className={`border-t border-[#d4d4d4] ${sidebarCollapsed ? 'px-2 py-3' : 'px-4 py-4'}`}>
            {sidebarCollapsed ? (
              <button onClick={handleLogout} className="w-full flex justify-center p-2 rounded-full hover:bg-[#e8e8e8]">
                <LogOut size={20} className="text-[#4A4A4A]" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E74C3C] flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                  {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2E2E2E] truncate">{user?.full_name || user?.username}</p>
                  <p className="text-xs text-[#4A4A4A] truncate">{user?.role}</p>
                </div>
                <button onClick={handleLogout} className="p-1.5 rounded-full hover:bg-[#e8e8e8] flex-shrink-0" title="Logout">
                  <LogOut size={18} className="text-[#4A4A4A]" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="h-[64px] bg-white border-b border-[#d4d4d4] flex items-center px-4 gap-3 flex-shrink-0">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-full hover:bg-[#e8e8e8] transition-colors lg:hidden flex-shrink-0"
            >
              <Menu size={22} className="text-[#4A4A4A]" />
            </button>

            {/* Search bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center bg-[#f0f0f0] rounded-full px-4 py-2.5 hover:shadow-sm transition-shadow focus-within:bg-white focus-within:shadow-[0_1px_3px_0_rgba(0,0,0,0.15)]">
                <Search size={20} className="text-[#4A4A4A] mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-transparent outline-none text-[14px] text-[#2E2E2E] placeholder:text-[#999]"
                />
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-shrink-0"></div>

            {/* Quick Add Buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {quickAddItems.map(({ label, icon: Icon, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-medium text-[#4A4A4A] hover:bg-[#e8e8e8] transition-colors border border-[#d4d4d4]"
                  title={label}
                >
                  <Plus size={16} className="text-[#E74C3C]" />
                  <span className="hidden xl:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Profile dropdown */}
            <div className="relative flex-shrink-0" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full bg-[#E74C3C] flex items-center justify-center text-white font-medium text-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'A'}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-[0_8px_10px_1px_rgba(0,0,0,0.14),0_3px_14px_2px_rgba(0,0,0,0.12),0_5px_5px_-3px_rgba(0,0,0,0.2)] border border-[#d4d4d4] z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#e0e0e0]">
                    <p className="text-[14px] font-medium text-[#2E2E2E]">{user?.full_name || user?.username}</p>
                    <p className="text-[12px] text-[#4A4A4A]">{user?.role}</p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#4A4A4A] hover:bg-[#f0f0f0] transition-colors"
                    >
                      <Settings size={18} className="text-[#4A4A4A]" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#c0392b] hover:bg-[#fdecea] transition-colors"
                    >
                      <LogOut size={18} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </HeaderActionsContext.Provider>
  );
}
