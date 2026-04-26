import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import { Search, Loader2, X } from "lucide-react";

// Mock Data Fallback
const MOCK_DATA = [
  { id: 'm1', name: 'John Doe', type: 'Student', path: '/dashboard/manage-students' },
  { id: 'm2', name: 'Sarah Khan', type: 'Student', path: '/dashboard/manage-students' },
  { id: 'm3', name: 'Smart Parking System', type: 'Project', path: '/dashboard/projects' },
  { id: 'm4', name: 'Dr. Sharma', type: 'Teacher', path: '/dashboard/manage-teachers' }
];

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const { authUser } = useSelector((state) => state.auth);
  const adminState = useSelector((state) => state.admin) || {};
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Handle Click Outside for Search Dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce logic (200ms)
  useEffect(() => {
    if (!searchQuery) {
      setDebouncedQuery("");
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    const delay = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
      setSelectedIndex(-1); // Reset selection
    }, 200);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Aggregate Data
  const searchableData = useMemo(() => {
    const data = [];
    let hasRealData = false;

    if (adminState.users && adminState.users.length > 0) {
      hasRealData = true;
      adminState.users.forEach(u => {
        data.push({
          id: u._id,
          name: u.name,
          type: u.role === 'student' ? 'Student' : 'Teacher',
          path: u.role === 'student' ? '/dashboard/manage-students' : '/dashboard/manage-teachers'
        });
      });
    }

    if (adminState.recentProjects && adminState.recentProjects.length > 0) {
      hasRealData = true;
      adminState.recentProjects.forEach(p => {
        data.push({
          id: p._id,
          name: p.title,
          type: 'Project',
          path: '/dashboard/projects'
        });
      });
    }

    return hasRealData ? data : MOCK_DATA;
  }, [adminState.users, adminState.recentProjects]);

  // Filter and Group Data
  const filteredGroups = useMemo(() => {
    if (!debouncedQuery) return {};

    const lowerQuery = debouncedQuery.toLowerCase();
    const filtered = searchableData.filter(item => item.name.toLowerCase().includes(lowerQuery));
    
    // Limit to top 5 to keep UI clean and fast
    const limited = filtered.slice(0, 5);

    return limited.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {});
  }, [searchableData, debouncedQuery]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(() => {
    return Object.values(filteredGroups).flat();
  }, [filteredGroups]);

  // Keyboard Navigation
  const handleKeyDown = (e) => {
    if (!isSearchFocused || !searchQuery) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && flatResults[selectedIndex]) {
        handleSelect(flatResults[selectedIndex]);
      } else if (flatResults.length > 0) {
        handleSelect(flatResults[0]);
      }
    } else if (e.key === "Escape") {
      setIsSearchFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (item) => {
    setSearchQuery("");
    setIsSearchFocused(false);
    navigate(item.path);
  };

  // Highlight matching text
  const renderHighlightedText = (text, highlight) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? 
        <strong key={index} className="text-blue-600 font-bold bg-blue-50/50">{part}</strong> : part
    );
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"
    );
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 fixed w-full top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center flex-1">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 focus:outline-none transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {sidebarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Logo and title (Only show on very large screens or hide entirely to make room for search) */}
            <div className="hidden lg:flex items-center ml-4">
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
               </div>
               <h1 className="ml-3 text-[15px] font-bold text-slate-800 tracking-tight">Academic Monitor</h1>
            </div>

            {/* Search Bar */}
            <div className="ml-4 sm:ml-8 flex-1 max-w-lg" ref={searchRef}>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className={isSearchFocused ? "text-blue-500" : "text-slate-400"} />
                    </div>
                    
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search students, projects, or teachers..." 
                        className="block w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-[13px] shadow-sm"
                    />

                    {searchQuery && (
                        <button 
                            onClick={() => {
                                setSearchQuery("");
                                inputRef.current?.focus();
                            }}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                            <X size={14} />
                        </button>
                    )}

                    {/* Search Dropdown */}
                    {isSearchFocused && searchQuery && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                            {isSearching ? (
                                <div className="p-4 flex items-center justify-center text-slate-500 text-sm gap-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    Searching...
                                </div>
                            ) : flatResults.length === 0 ? (
                                <div className="p-4 text-center text-slate-500 text-sm">
                                    No results found
                                </div>
                            ) : (
                                <div className="max-h-[320px] overflow-y-auto py-2 custom-scrollbar">
                                    {Object.entries(filteredGroups).map(([type, items]) => (
                                        <div key={type} className="mb-1">
                                            <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                                {type}s
                                            </div>
                                            {items.map((item) => {
                                                const globalIndex = flatResults.findIndex(r => r.id === item.id);
                                                const isSelected = globalIndex === selectedIndex;
                                                
                                                return (
                                                    <div 
                                                        key={item.id}
                                                        onClick={() => handleSelect(item)}
                                                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                        className={`px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                                                            isSelected ? "bg-slate-50" : "hover:bg-slate-50/50"
                                                        }`}
                                                    >
                                                        <div className="text-[13px] text-slate-800">
                                                            {renderHighlightedText(item.name, debouncedQuery)}
                                                        </div>
                                                        <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                            type === 'Student' ? 'bg-blue-50 text-blue-600' :
                                                            type === 'Project' ? 'bg-emerald-50 text-emerald-600' :
                                                            'bg-purple-50 text-purple-600'
                                                        }`}>
                                                            {type}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-5 5-5-5h5zm-5-8a3 3 0 11-6 0 3 3 0 016 0zm6.5 0c0-4.418-4.03-8-9-8s-9 3.582-9 8c0 1.5.5 2.91 1.34 4.06L3 20l3.72-1.395c1.15.84 2.56 1.34 4.06 1.34z" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-[11px] font-bold text-white">
                    {getInitials(authUser?.name)}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[13px] font-semibold text-slate-700 leading-none">
                    {authUser?.name}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Profile dropdown menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-slate-200">
                      <p className="text-sm font-medium text-slate-800">
                        {authUser?.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {authUser?.email}
                      </p>
                      <p className="text-xs text-blue-600 capitalize font-medium mt-1">
                        {authUser?.role}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        dispatch(logout()).then(() => navigate('/login'));
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md mt-2"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside handlers */}
      {(profileDropdownOpen || notificationsOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setProfileDropdownOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;
