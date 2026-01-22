import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Clock, Handshake } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(profile);
        } catch (error) {
            console.error('Error fetching sidebar data:', error);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <aside className="w-64 border-r border-white/5 bg-[#0B1219] flex flex-col p-6 shrink-0 h-screen sticky top-0 overflow-y-auto">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Handshake className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">NegoPack <span className="text-blue-500">Pro</span></span>
            </div>

            <nav className="flex-1 space-y-2">
                <Link
                    to="/dashboard"
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/dashboard')
                        ? 'bg-blue-600/10 text-blue-500 font-medium'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                >
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                </Link>
                <Link
                    to="/deals"
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/deals')
                        ? 'bg-blue-600/10 text-blue-500 font-medium'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                >
                    <FileText className="w-5 h-5" />
                    Deals
                </Link>

                <Link
                    to="/suppliers"
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/suppliers')
                        ? 'bg-blue-600/10 text-blue-500 font-medium'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                >
                    <Users className="w-5 h-5" />
                    Suppliers
                </Link>

                <div className="pt-4 mt-4 border-t border-white/5">
                    <Link
                        to="/settings"
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/settings')
                            ? 'bg-blue-600/10 text-blue-500 font-medium'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </Link>
                </div>
            </nav>

            <div className="mt-auto pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 px-4 py-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">
                        {profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold truncate">{profile?.full_name || 'User'}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{profile?.role || 'Employee'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
};
