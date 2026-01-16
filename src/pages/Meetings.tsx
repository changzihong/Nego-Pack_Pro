import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, MapPin, ChevronRight, Search, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Meetings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [meetings, setMeetings] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    const statusOptions = [
        { id: 'all', label: 'All Statuses' },
        { id: 'meeting_done', label: 'Meeting Done' },
        { id: 'changes_requested', label: 'Changes Requested' },
        { id: 'completed', label: 'Completed' },
        { id: 'rejected', label: 'Rejected' }
    ];

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();

            // Showing requested statuses: Meeting Done, Changes Requested, Completed, Rejected
            let query = supabase
                .from('deals')
                .select('*, suppliers(name), meeting_notes(*)')
                .in('status', ['meeting_done', 'changes_requested', 'completed', 'rejected'])
                .order('created_at', { ascending: false });

            if (profile?.role !== 'admin') {
                query = query.eq('owner_id', user.id);
            }

            const { data, error } = await query;
            if (error) throw error;

            setMeetings(data || []);
        } catch (error) {
            console.error('Error fetching meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMeetings = meetings.filter(m => {
        const matchesSearch = m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.suppliers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.meeting_notes?.[0]?.location?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-10 font-sans">
            <header className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Deal Documentation</h1>
                    <p className="text-gray-400">Document and review outcomes from strategic deal negotiations</p>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input
                        type="text"
                        placeholder="Search deals, suppliers, locations..."
                        className="w-full bg-[#0B1219] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-gray-700"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="relative min-w-[220px]">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
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

            <div className="space-y-4">
                {filteredMeetings.length === 0 ? (
                    <div className="py-20 bg-[#0B1219] rounded-[2rem] border border-white/5 border-dashed flex flex-col items-center justify-center text-gray-600">
                        <Clock className="w-12 h-12 mb-4 opacity-10" />
                        <p>No deals found matching your filters.</p>
                    </div>
                ) : (
                    filteredMeetings.map((deal) => (
                        <motion.div
                            key={deal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => navigate(`/meeting/${deal.id}`)}
                            className="bg-[#0B1219] rounded-2xl border border-white/5 p-6 hover:border-blue-500/30 transition-all group cursor-pointer flex items-center justify-between"
                        >
                            <div className="flex items-center gap-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${deal.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                    deal.status === 'approved' ? 'bg-green-600/10 text-green-500' :
                                        deal.status === 'meeting_done' ? 'bg-blue-600/10 text-blue-500' :
                                            deal.status === 'rejected' ? 'bg-red-600/10 text-red-500' :
                                                deal.status === 'in_review' || deal.status === 'changes_requested' ? 'bg-amber-600/10 text-amber-500' :
                                                    'bg-blue-600/10 text-blue-500'
                                    }`}>
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {deal.title}
                                        </h3>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${deal.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                            deal.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                                deal.status === 'meeting_done' ? 'bg-blue-500/10 text-blue-500' :
                                                    deal.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                        deal.status === 'in_review' || deal.status === 'changes_requested' ? 'bg-amber-500/10 text-amber-500' :
                                                            'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {deal.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {deal.meeting_notes?.[0]?.meeting_date ? new Date(deal.meeting_notes[0].meeting_date).toLocaleDateString() : 'Awaiting Date'}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {deal.meeting_notes?.[0]?.location || 'Awaiting Venue'}
                                        </div>
                                        <div className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5 text-[10px] uppercase tracking-widest font-bold">
                                            {deal.suppliers?.name}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
