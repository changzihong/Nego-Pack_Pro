import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, LayoutDashboard, Handshake, Users, FileText, Settings, LogOut, ChevronRight, CheckCircle2, AlertCircle, Clock, XCircle, TrendingUp, BarChart3, PieChart, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastProvider';

const MotionLink = motion(Link);

export const Dashboard = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [deals, setDeals] = useState<any[]>([]);
    const [hoveredModel, setHoveredModel] = useState<string | null>(null);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        upcoming: 0,
        totalValue: 0,
        avgValue: 0,
        successRate: 0,
        topSuppliers: [] as any[],
        pricingModels: {} as Record<string, number>
    });


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
            fetchDeals();
        } catch (error) {
            console.error('Error fetching user data:', error);
            setLoading(false);
            showToast("Failed to load dashboard data", "error");
        }
    };



    const fetchDeals = async () => {
        try {
            const { data, error } = await supabase
                .from('deals')
                .select('*, suppliers(name)')
                .order('created_at', { ascending: false });

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

            const supplierMap: Record<string, number> = {};
            dealsList.forEach(d => {
                const sName = d.suppliers?.name || 'Unknown';
                supplierMap[sName] = (supplierMap[sName] || 0) + Number(d.deal_value || 0);
            });
            const topSuppliers = Object.entries(supplierMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 3);

            const modelMap: Record<string, number> = {};
            dealsList.forEach(d => {
                const model = d.pricing_model || 'Other';
                modelMap[model] = (modelMap[model] || 0) + 1;
            });

            setStats({
                total, pending, approved: approvedCount, upcoming,
                totalValue, avgValue, successRate, topSuppliers,
                pricingModels: modelMap
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
                    <h1 className="text-3xl font-bold mb-2">Negotiation Dashboard</h1>
                    <p className="text-gray-400">Manage and track strategic deal packs across your pipeline</p>
                </div>
                <MotionLink
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    to="/new-deal"
                    className="group relative bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        New Deal
                    </span>
                </MotionLink>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="lg:col-span-3 bg-gradient-to-br from-[#1C2833] to-[#0B1219] rounded-[2rem] border border-white/5 p-8 relative overflow-hidden transition-all duration-300 cursor-default"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px]" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold mb-8 flex items-center gap-2 italic text-blue-500">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                Portfolio Financials
                            </h3>
                            <div className="flex items-center gap-20">
                                <div>
                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Total Pipeline Value</p>
                                    <p className="text-5xl font-bold text-white tracking-tight">
                                        RM <span className="text-blue-500">{stats.totalValue.toLocaleString()}</span>
                                    </p>
                                    <div className="mt-4 flex items-center gap-2 text-xs text-emerald-500 font-bold">
                                        <div className="w-8 h-px bg-emerald-500/30" />
                                        <span>Live Strategic Data</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Average Pack Size</p>
                                    <p className="text-3xl font-bold text-white tracking-tighter">
                                        RM {Math.round(stats.avgValue).toLocaleString()}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-blue-400/60 font-medium">
                                        <BarChart3 className="w-3 h-3" />
                                        <span>Per Generated Strategy</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="mb-10">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="bg-[#0B1219] p-6 lg:p-10 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center border-l-4 border-l-blue-500 cursor-default transition-all duration-300 shadow-2xl shadow-blue-500/5"
                >
                    <div className="w-full flex items-center justify-between mb-8 lg:mb-10">
                        <div>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Portfolio Intelligence</p>
                            <h4 className="text-2xl font-bold text-white italic">Pricing Strategy Mix</h4>
                        </div>
                        <PieChart className="w-6 h-6 text-blue-500 opacity-50" />
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20 w-full lg:px-10">
                        <div className="relative group">
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                className="w-56 h-56 flex items-center justify-center cursor-pointer"
                            >
                                <svg className="w-full h-full -rotate-90 origin-center drop-shadow-[0_0_15px_rgba(59,130,246,0.1)]" viewBox="0 0 200 200">
                                    {(() => {
                                        const r = 75;
                                        const circumference = 2 * Math.PI * r;
                                        let currentOffset = 0;

                                        const segments = [
                                            { label: 'Fixed Fee', value: stats.pricingModels['Fixed Fee'] || 0, color: '#3B82F6' },
                                            { label: 'Time & Materials', value: stats.pricingModels['Time & Materials'] || 0, color: '#F59E0B' },
                                            { label: 'Usage-based', value: stats.pricingModels['Usage-based'] || 0, color: '#10B981' },
                                            { label: 'Subscription', value: stats.pricingModels['Subscription'] || 0, color: '#8B5CF6' },
                                            { label: 'Other', value: stats.pricingModels['Other'] || 0, color: '#06B6D4' }
                                        ].filter(s => s.value > 0);

                                        return segments.map((s, idx) => {
                                            const percent = (s.value / (stats.total || 1)) * 100;
                                            const dashArray = `${(percent / 100) * circumference} ${circumference}`;
                                            const strokeOffset = -currentOffset;
                                            currentOffset += (percent / 100) * circumference;

                                            return (
                                                <circle
                                                    key={idx}
                                                    cx="100"
                                                    cy="100"
                                                    r={r}
                                                    fill="transparent"
                                                    stroke={s.color}
                                                    strokeWidth="24"
                                                    strokeDasharray={dashArray}
                                                    strokeDashoffset={strokeOffset}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-300 hover:stroke-[28px] hover:brightness-125 cursor-pointer"
                                                    onMouseEnter={() => setHoveredModel(s.label)}
                                                    onMouseLeave={() => setHoveredModel(null)}
                                                />
                                            );
                                        });
                                    })()}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <motion.div
                                        key={hoveredModel || 'total'}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center"
                                    >
                                        <p className="text-4xl font-black text-white px-4 leading-none tracking-tighter">
                                            {hoveredModel ? (
                                                stats.pricingModels[hoveredModel] || 0
                                            ) : stats.total}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] mt-1 line-clamp-1 max-w-[120px]">
                                            {hoveredModel || 'Total Deals'}
                                        </p>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6 w-full">
                            <div
                                className={`bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex flex-col gap-3 transition-all border-t-4 border-t-blue-500 overflow-hidden ${hoveredModel === 'Fixed Fee' ? 'bg-white/10 scale-105 shadow-lg shadow-blue-500/10' : ''}`}
                                onMouseEnter={() => setHoveredModel('Fixed Fee')}
                                onMouseLeave={() => setHoveredModel(null)}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Fixed Fee</span>
                                    </div>
                                    <span className="text-xs text-blue-500 font-bold">
                                        {Math.round(((stats.pricingModels['Fixed Fee'] || 0) / (stats.total || 1)) * 100)}%
                                    </span>
                                </div>
                                <p className="text-4xl font-black text-white leading-none">{stats.pricingModels['Fixed Fee'] || 0}</p>
                            </div>

                            <div
                                className={`bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex flex-col gap-3 transition-all border-t-4 border-t-amber-500 overflow-hidden ${hoveredModel === 'Time & Materials' ? 'bg-white/10 scale-105 shadow-lg shadow-amber-500/10' : ''}`}
                                onMouseEnter={() => setHoveredModel('Time & Materials')}
                                onMouseLeave={() => setHoveredModel(null)}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">T & M</span>
                                    </div>
                                    <span className="text-xs text-amber-500 font-bold">
                                        {Math.round(((stats.pricingModels['Time & Materials'] || 0) / (stats.total || 1)) * 100)}%
                                    </span>
                                </div>
                                <p className="text-4xl font-black text-white leading-none">{stats.pricingModels['Time & Materials'] || 0}</p>
                            </div>

                            <div
                                className={`bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex flex-col gap-3 transition-all border-t-4 border-t-emerald-500 overflow-hidden ${hoveredModel === 'Usage-based' ? 'bg-white/10 scale-105 shadow-lg shadow-emerald-500/10' : ''}`}
                                onMouseEnter={() => setHoveredModel('Usage-based')}
                                onMouseLeave={() => setHoveredModel(null)}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Usage</span>
                                    </div>
                                    <span className="text-xs text-emerald-500 font-bold">
                                        {Math.round(((stats.pricingModels['Usage-based'] || 0) / (stats.total || 1)) * 100)}%
                                    </span>
                                </div>
                                <p className="text-4xl font-black text-white leading-none">{stats.pricingModels['Usage-based'] || 0}</p>
                            </div>

                            <div
                                className={`bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex flex-col gap-3 transition-all border-t-4 border-t-purple-500 overflow-hidden ${hoveredModel === 'Subscription' ? 'bg-white/10 scale-105 shadow-lg shadow-purple-500/10' : ''}`}
                                onMouseEnter={() => setHoveredModel('Subscription')}
                                onMouseLeave={() => setHoveredModel(null)}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sub</span>
                                    </div>
                                    <span className="text-xs text-purple-500 font-bold">
                                        {Math.round(((stats.pricingModels['Subscription'] || 0) / (stats.total || 1)) * 100)}%
                                    </span>
                                </div>
                                <p className="text-4xl font-black text-white leading-none">{stats.pricingModels['Subscription'] || 0}</p>
                            </div>

                            <div
                                className={`bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex flex-col gap-3 transition-all border-t-4 border-t-cyan-500 overflow-hidden ${hoveredModel === 'Other' ? 'bg-white/10 scale-105 shadow-lg shadow-cyan-500/10' : ''}`}
                                onMouseEnter={() => setHoveredModel('Other')}
                                onMouseLeave={() => setHoveredModel(null)}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Other</span>
                                    </div>
                                    <span className="text-xs text-cyan-500 font-bold">
                                        {Math.round(((stats.pricingModels['Other'] || 0) / (stats.total || 1)) * 100)}%
                                    </span>
                                </div>
                                <p className="text-4xl font-black text-white leading-none">{stats.pricingModels['Other'] || 0}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#0B1219] rounded-[2rem] border border-white/5 p-8 border-l-4 border-l-emerald-500 transition-all duration-300 cursor-default"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">Market Leaders</h4>
                    </div>
                    <div className="space-y-4">
                        {stats.topSuppliers.map((s: any, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                <span className="text-[11px] text-gray-400 font-bold">{s.name}</span>
                                <span className="text-[11px] font-bold text-white">RM {Math.round(s.value / 1000)}k</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#0B1219] p-8 rounded-[2rem] border border-white/5 flex flex-col justify-center border-l-4 border-l-purple-500 cursor-default transition-all duration-300"
                >
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Total Strategic Packs</p>
                    <div className="flex items-center gap-3">
                        <p className="text-3xl font-bold text-white">{stats.total}</p>
                        <span className="text-xs text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Repository
                        </span>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-[#0B1219] p-8 rounded-[2rem] border border-white/5 flex flex-col justify-center border-l-4 border-l-amber-500 cursor-default transition-all duration-300"
                >
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Upcoming Deadlines</p>
                    <div className="flex items-center gap-3">
                        <p className="text-3xl font-bold text-white">{stats.upcoming}</p>
                        <span className="text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            To Close
                        </span>
                    </div>
                </motion.div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search negotiations, suppliers..."
                        className="w-full bg-[#0B1219] border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-white placeholder:text-gray-600"
                    />
                </div>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="group relative p-3 bg-[#0B1219] border border-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                    <Filter className="w-5 h-5" />
                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        Filter List
                    </span>
                </motion.button>
            </div>

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
                                        <Link to="/new-deal" className="text-blue-500 text-sm font-bold hover:underline">Create your first deal</Link>
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
                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-blue-500/10 text-blue-500">
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
