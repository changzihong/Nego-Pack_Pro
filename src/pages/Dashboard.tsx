import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, LayoutDashboard, Handshake, Users, FileText, Settings, LogOut, ChevronRight, CheckCircle2, AlertCircle, Clock, XCircle, TrendingUp, BarChart3, PieChart, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastProvider';

export const Dashboard = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [deals, setDeals] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        upcoming: 0,
        totalValue: 0,
        avgValue: 0,
        successRate: 0,
        topSuppliers: [] as any[]
    });
    const [assignedMeetings, setAssignedMeetings] = useState<any[]>([]);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }
            setUser(user);

            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(profile);
            fetchDeals(user.id, profile?.role);
            fetchAssignedMeetings(user.id, profile?.role);
        } catch (error) {
            console.error('Error fetching user data:', error);
            setLoading(false);
            showToast("Failed to load dashboard data", "error");
        }
    };

    const fetchAssignedMeetings = async (userId: string, role: string) => {
        try {
            const { data } = await supabase
                .from('meeting_notes')
                .select('deal_id, attendees, deals(title)');

            if (role === 'admin') {
                setAssignedMeetings(data || []);
            } else {
                const filtered = (data || []).filter((m: any) =>
                    Array.isArray(m.attendees) && m.attendees.some((a: any) => a.id === userId)
                );
                setAssignedMeetings(filtered);
            }
        } catch (error) {
            console.error('Error fetching meetings:', error);
        }
    };

    const fetchDeals = async (userId: string, role: string) => {
        try {
            let query = supabase
                .from('deals')
                .select('*, suppliers(name)');

            if (role !== 'admin') {
                query = query.eq('owner_id', userId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            const dealsList = data || [];
            setDeals(dealsList);

            // Calculate stats
            const total = dealsList.length;
            const pending = dealsList.filter(d => d.status === 'in_review').length;
            const approvedCount = dealsList.filter(d => d.status === 'approved' || d.status === 'completed' || d.status === 'meeting_done').length;
            const upcoming = dealsList.filter(d => d.deadline && new Date(d.deadline) > new Date()).length;

            const totalValue = dealsList.reduce((acc, curr) => acc + Number(curr.deal_value || 0), 0);
            const avgValue = total > 0 ? totalValue / total : 0;
            const completedDeals = dealsList.filter(d => d.status === 'completed').length;
            const successRate = total > 0 ? (completedDeals / total) * 100 : 0;

            // Top Suppliers (By Value)
            const supplierMap: Record<string, number> = {};
            dealsList.forEach(d => {
                const sName = d.suppliers?.name || 'Unknown';
                supplierMap[sName] = (supplierMap[sName] || 0) + Number(d.deal_value || 0);
            });
            const topSuppliers = Object.entries(supplierMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 3);

            setStats({
                total, pending, approved: approvedCount, upcoming,
                totalValue, avgValue, successRate, topSuppliers
            });
        } catch (error) {
            console.error('Error fetching deals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050A10] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-10">
            <header className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        {profile?.role === 'admin' ? 'Organization Negotiations' : 'My Negotiations'}
                    </h1>
                    <p className="text-gray-400">
                        {profile?.role === 'admin'
                            ? 'Manage and approve strategy packs across your team'
                            : 'Track and manage your strategic deal packs'}
                    </p>
                </div>
                {profile?.role !== 'admin' && (
                    <Link
                        to="/new-deal"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        New Deal
                    </Link>
                )}
            </header>

            {/* Admin Analysis Section */}
            {profile?.role === 'admin' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    <div className="lg:col-span-2 bg-gradient-to-br from-[#1C2833] to-[#0B1219] rounded-[2rem] border border-white/5 p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px]" />
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 italic">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                Financial Overview
                            </h3>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Pipeline Value</p>
                                    <p className="text-4xl font-bold text-white tracking-tight">
                                        RM <span className="text-blue-500">{stats.totalValue.toLocaleString()}</span>
                                    </p>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-500">
                                        <div className="w-5 h-px bg-emerald-500/30" />
                                        <span>Live Negotiations</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Average Deal Size</p>
                                    <p className="text-2xl font-bold text-white">
                                        RM {Math.round(stats.avgValue).toLocaleString()}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                                        <BarChart3 className="w-3 h-3" />
                                        <span>Per Strategic Pack</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0B1219] rounded-[2rem] border border-white/5 p-8 flex flex-col justify-between">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 italic">
                            <PieChart className="w-5 h-5 text-purple-500" />
                            Negotiation Success
                        </h3>
                        <div>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-4xl font-bold text-white">{Math.round(stats.successRate)}%</span>
                                <span className="text-xs text-gray-500 mb-2 uppercase tracking-widest font-bold">Closed-Won Rate</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.successRate}%` }}
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Suppliers & Quick Stats Row (Admin) */}
            {profile?.role === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-[#0B1219] rounded-2xl border border-white/5 p-6 border-l-4 border-l-blue-500">
                        <div className="flex items-center gap-3 mb-4">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <h4 className="text-sm font-bold uppercase tracking-widest">Top Suppliers</h4>
                        </div>
                        <div className="space-y-4">
                            {stats.topSuppliers.map((s, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400 font-medium">{s.name}</span>
                                    <span className="text-sm font-bold text-white">RM {Math.round(s.value / 1000)}k</span>
                                </div>
                            ))}
                            {stats.topSuppliers.length === 0 && <p className="text-xs text-gray-600">No data available</p>}
                        </div>
                    </div>

                    <div className="bg-[#0B1219] p-6 rounded-2xl border border-white/5 flex flex-col justify-center">
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Approved Strategies</p>
                        <div className="flex items-center gap-3">
                            <p className="text-3xl font-bold text-white">{stats.approved}</p>
                            <span className="text-xs text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Ready
                            </span>
                        </div>
                    </div>

                    <div className="bg-[#0B1219] p-6 rounded-2xl border border-white/5 flex flex-col justify-center">
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Awaiting Review</p>
                        <div className="flex items-center gap-3">
                            <p className="text-3xl font-bold text-white">{stats.pending}</p>
                            <span className="text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Action Required
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Classic Stats (Employee) */}
            {profile?.role !== 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: 'Total Deals', value: stats.total, color: 'blue' },
                        { label: 'Pending Approval', value: stats.pending, color: 'amber' },
                        { label: 'Approved', value: stats.approved, color: 'green' },
                        { label: 'Upcoming', value: stats.upcoming, color: 'purple' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-[#0B1219] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl -mr-12 -mt-12 transition-all group-hover:bg-blue-500/10`} />
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Search & Filter */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search negotiations, suppliers..."
                        className="w-full bg-[#0B1219] border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-white placeholder:text-gray-600"
                    />
                </div>
                <button className="p-3 bg-[#0B1219] border border-white/5 rounded-xl text-gray-400 hover:text-white transition-colors">
                    <Filter className="w-5 h-5" />
                </button>
            </div>

            {/* Table */}
            <div className="bg-[#0B1219] rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.01]">
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Deal Title</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Supplier</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Value</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Deadline</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {deals.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 text-gray-500">
                                        <FileText className="w-10 h-10 opacity-20" />
                                        <p>No negotiations found</p>
                                        {profile?.role !== 'admin' && (
                                            <Link to="/new-deal" className="text-blue-500 text-sm font-bold hover:underline">Create your first deal</Link>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            deals.map((deal) => (
                                <tr
                                    key={deal.id}
                                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                    onClick={() => navigate((deal.status === 'draft' || deal.status === 'changes_requested' || deal.status === 'rejected') ? `/new-deal?id=${deal.id}` : `/pack/${deal.id}`)}
                                >
                                    <td className="px-6 py-6">
                                        <p className="font-semibold text-white group-hover:text-blue-400 transition-colors">{deal.title}</p>
                                    </td>
                                    <td className="px-6 py-6 text-gray-400">{deal.suppliers?.name || 'N/A'}</td>
                                    <td className="px-6 py-6 font-medium text-white">
                                        {deal.deal_value ? `RM ${Number(deal.deal_value).toLocaleString()}` : '—'}
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${deal.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                                deal.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                                    deal.status === 'meeting_done' ? 'bg-blue-500/10 text-blue-500' :
                                                        deal.status === 'in_review' || deal.status === 'changes_requested' ? 'bg-amber-500/10 text-amber-500' :
                                                            deal.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                                'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {(deal.status === 'approved' || deal.status === 'completed') && <CheckCircle2 className="w-3 h-3" />}
                                                {(deal.status === 'in_review' || deal.status === 'changes_requested' || deal.status === 'meeting_done') && <Clock className="w-3 h-3" />}
                                                {deal.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                                {deal.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-gray-400">
                                        {deal.deadline ? new Date(deal.deadline).toLocaleDateString('en-MY') : '—'}
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors" />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
