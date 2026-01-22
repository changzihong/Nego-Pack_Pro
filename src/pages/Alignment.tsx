import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Send, CheckCircle2, MessageSquare, Target, Shield, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const Alignment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [deal, setDeal] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        fetchData();
        const commentSubscription = supabase
            .channel('comments')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stakeholder_comments', filter: `deal_id=eq.${id}` },
                payload => {
                    setComments(prev => [payload.new, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(commentSubscription);
        };
    }, [id]);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
            setProfile(profile);

            const { data: dealData } = await supabase.from('deals').select('*, suppliers(name)').eq('id', id).single();
            setDeal(dealData);

            const { data: commentsData } = await supabase
                .from('stakeholder_comments')
                .select('*, users(full_name, role)')
                .eq('deal_id', id)
                .order('created_at', { ascending: false });

            setComments(commentsData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendComment = async () => {
        if (!newComment.trim()) return;
        try {
            const { error } = await supabase.from('stakeholder_comments').insert({
                deal_id: id,
                user_id: profile.id,
                comment: newComment,
                section: 'general'
            });
            if (error) throw error;
            setNewComment('');
            fetchData(); // Refresh to get author info
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050A10] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    return (
        <div className="h-screen flex flex-col font-sans">
            {/* Top Header */}
            <header className="h-20 border-b border-white/5 bg-[#0B1219] flex items-center justify-between px-10 shrink-0">
                <div className="flex items-center gap-4">
                    <Link to={`/pack/${id}`} className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div className="h-5 w-px bg-white/10" />
                    <h1 className="font-bold text-lg text-white">Internal Alignment: <span className="text-gray-400 font-normal">{deal?.title}</span></h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${deal?.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                            {deal?.status.replace('_', ' ')}
                        </span>
                    </div>
                    <button
                        onClick={() => navigate(`/pack/${id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-all shadow-lg shadow-blue-500/20"
                    >
                        Go to Strategy
                    </button>
                </div>
            </header>

            {/* Content Split */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Side - Context */}
                <main className="flex-1 overflow-y-auto p-10 bg-[#050A10]">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-blue-600/10 text-blue-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Step 3</span>
                            <h2 className="text-2xl font-bold text-white italic">Internal Stakeholder Review</h2>
                        </div>

                        <div className="bg-[#0B1219] rounded-2xl border border-white/5 p-8">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-500" />
                                Deal Scope Summary
                            </h3>
                            <p className="text-gray-400 leading-relaxed font-medium">
                                {deal?.scope}
                            </p>
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-600 font-bold uppercase mb-1">Pricing Model</p>
                                    <p className="text-sm font-bold text-white">{deal?.pricing_model}</p>
                                </div>
                                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-600 font-bold uppercase mb-1">Deal Value</p>
                                    <p className="text-sm font-bold text-white">RM {Number(deal?.deal_value || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-2xl">
                            <p className="text-sm text-blue-200/60 leading-relaxed font-medium">
                                Stakeholders are invited to review the strategy pack and provide feedback below. The Deal Admin (Manager) will review all comments before final approval.
                            </p>
                        </div>
                    </div>
                </main>

                {/* Right Side - Real-time Comments */}
                <aside className="w-[400px] border-l border-white/5 bg-[#0B1219] flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-white/5">
                        <h3 className="font-bold flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-blue-500" />
                                Review Activity
                            </div>
                            <span className="text-[10px] text-gray-600 font-bold">{comments.length}</span>
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0B1219]">
                        {comments.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center px-6">
                                <MessageSquare className="w-10 h-10 mb-4 opacity-10" />
                                <p className="text-sm font-medium">No comments yet. Start the alignment discussion.</p>
                            </div>
                        ) : (
                            comments.map((c) => (
                                <div key={c.id} className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">
                                        {c.users?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 bg-white/[0.03] p-4 rounded-2xl border border-white/5 shadow-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-white">{c.users?.full_name || 'Anonymous'}</span>
                                            <span className="text-[9px] text-gray-600 uppercase font-bold">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 leading-relaxed">{c.comment}</p>
                                        <div className="mt-2 text-[9px] font-bold text-gray-700 uppercase tracking-widest">{c.users?.role}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-6 bg-[#0B1219] border-t border-white/5">
                        <div className="relative">
                            <textarea
                                rows={3}
                                placeholder="Share your thoughts or request changes..."
                                className="w-full bg-[#161F2A] border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none placeholder:text-gray-700 font-medium"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendComment();
                                    }
                                }}
                            />
                            <button
                                onClick={handleSendComment}
                                className="absolute right-3 bottom-3 p-2.5 bg-blue-600 rounded-xl text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-700 font-medium mt-3 text-center">Press Enter to send comment</p>
                    </div>
                </aside>
            </div>
        </div>
    );
};
