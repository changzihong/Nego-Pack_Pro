import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import {
    Search, Filter, Plus, ChevronRight, FileText,
    CheckCircle2, Clock, XCircle, Loader2, TrendingUp,
    Briefcase, Download, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionLink = motion(Link);

export const Deals = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [deals, setDeals] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('deals')
                .select('*, suppliers(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDeals(data || []);
        } catch (error) {
            console.error('Error fetching deals:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDeals = deals.filter(deal => {
        const matchesSearch = deal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            deal.suppliers?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || deal.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    const statusOptions = [
        { id: 'all', label: 'All Statuses' },
        { id: 'draft', label: 'Draft' },
        { id: 'in_review', label: 'In Review' },
        { id: 'approved', label: 'Approved' },
        { id: 'changes_requested', label: 'Changes Requested' },
        { id: 'rejected', label: 'Rejected' },
        { id: 'completed', label: 'Completed' }
    ];

    const downloadDeals = () => {
        const headers = ["Title", "Supplier", "Value (RM)", "Status", "Pricing Model", "Deadline", "Created At"];
        const csvRows = filteredDeals.map(deal => [
            `"${deal.title}"`,
            `"${deal.suppliers?.name || 'N/A'}"`,
            deal.deal_value || 0,
            `"${deal.status}"`,
            `"${deal.pricing_model || 'Standard'}"`,
            deal.deadline || 'N/A',
            new Date(deal.created_at).toLocaleDateString()
        ].join(','));

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `negopack_deals_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDeleteDeal = async (e: React.MouseEvent, dealId: string, dealTitle: string) => {
        e.stopPropagation();

        const confirmed = window.confirm(
            `Are you sure you want to delete "${dealTitle}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('deals')
                .delete()
                .eq('id', dealId);

            if (error) throw error;

            setDeals(prevDeals => prevDeals.filter(deal => deal.id !== dealId));
        } catch (error) {
            console.error('Error deleting deal:', error);
            alert('Failed to delete deal. Please try again.');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-10 font-sans">
            <header className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Deal Pipeline</h1>
                    <p className="text-gray-400">Track and manage every stage of your strategic negotiations</p>
                </div>
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={downloadDeals}
                        className="group relative bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl flex items-center justify-center transition-all border border-white/5"
                    >
                        <Download className="w-5 h-5" />
                        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            Download CSV
                        </span>
                    </motion.button>
                    <MotionLink
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        to="/new-deal"
                        className="group relative bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            Create Deal
                        </span>
                    </MotionLink>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input
                        type="text"
                        placeholder="Search deals, suppliers..."
                        className="w-full bg-[#0B1219] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-gray-700"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full bg-[#0B1219] border border-white/5 rounded-xl py-3.5 pl-12 pr-10 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                    >
                        {statusOptions.map(status => (
                            <option key={status.id} value={status.id}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90 pointer-events-none" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredDeals.length === 0 ? (
                    <div className="py-20 bg-[#0B1219] rounded-[2rem] border border-white/5 border-dashed flex flex-col items-center justify-center text-gray-600">
                        <Briefcase className="w-12 h-12 mb-4 opacity-10" />
                        <p>No deals found matching your filters.</p>
                    </div>
                ) : (
                    filteredDeals.map((deal) => (
                        <motion.div
                            key={deal.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => navigate((deal.status === 'draft' || deal.status === 'changes_requested') ? `/new-deal?id=${deal.id}` : `/pack/${deal.id}`)}
                            className="bg-[#0B1219] rounded-2xl border border-white/5 p-6 hover:border-blue-500/30 transition-all group cursor-pointer flex items-center justify-between relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.02] blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/[0.05] transition-all" />

                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-blue-600/20 text-blue-500">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {deal.title}
                                        </h3>
                                        <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-500">
                                            {deal.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 font-medium">
                                        <span>{deal.suppliers?.name || 'No Supplier'}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-700" />
                                        <span>RM {Number(deal.deal_value || 0).toLocaleString()}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-700" />
                                        <div className="flex items-center gap-1.5 capitalize">
                                            <TrendingUp className="w-3.5 h-3.5 text-blue-500/60" />
                                            {deal.pricing_model || 'Standard'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="text-right hidden md:block">
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">Created</p>
                                    <p className="text-sm font-bold text-white">{new Date(deal.created_at).toLocaleDateString()}</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => handleDeleteDeal(e, deal.id, deal.title)}
                                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all"
                                    title="Delete deal"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </motion.button>
                                <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
