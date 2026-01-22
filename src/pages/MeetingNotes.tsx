import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, MessageSquare, CheckSquare, Plus, Save, Clock, MapPin, Download, Loader2, CheckCircle2, AlertCircle, Search, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastProvider';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const MeetingNotes = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deal, setDeal] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pack, setPack] = useState<any>(null);

    const [notesData, setNotesData] = useState({
        meeting_date: new Date().toISOString().split('T')[0],
        location: '',
        attendees: [] as any[],
        discussion_points: '',
        decisions_made: '',
        concessions_granted: '',
        concessions_received: '',
        next_steps: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profile);

            const { data: allUsers } = await supabase
                .from('users')
                .select('id, full_name, email');
            setUsers(allUsers || []);

            const { data: dealData } = await supabase
                .from('deals')
                .select('*, suppliers(name)')
                .eq('id', id)
                .single();
            setDeal(dealData);

            const { data: packData } = await supabase
                .from('negotiation_packs')
                .select('*')
                .eq('deal_id', id)
                .single();
            setPack(packData);

            const { data: notes } = await supabase
                .from('meeting_notes')
                .select('*')
                .eq('deal_id', id)
                .single();

            if (notes) {
                const parseConcession = (val: any) => {
                    if (!val) return '';
                    if (typeof val === 'string') {
                        try {
                            const parsed = JSON.parse(val);
                            return Array.isArray(parsed) ? parsed.join('\n') : (parsed.content || val);
                        } catch {
                            return val;
                        }
                    }
                    if (Array.isArray(val)) return val.join('\n');
                    if (val.content) return val.content;
                    return JSON.stringify(val);
                };

                setNotesData({
                    ...notes,
                    meeting_date: notes.meeting_date ? new Date(notes.meeting_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    attendees: Array.isArray(notes.attendees) ? notes.attendees : [],
                    concessions_granted: parseConcession(notes.concessions_granted),
                    concessions_received: parseConcession(notes.concessions_received)
                });
            }
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const { error: saveError } = await supabase
                .from('meeting_notes')
                .upsert({
                    deal_id: id,
                    meeting_date: notesData.meeting_date,
                    location: notesData.location,
                    attendees: notesData.attendees,
                    discussion_points: notesData.discussion_points,
                    decisions_made: notesData.decisions_made,
                    next_steps: notesData.next_steps,
                    concessions_granted: { content: notesData.concessions_granted },
                    concessions_received: { content: notesData.concessions_received }
                }, { onConflict: 'deal_id' });

            if (saveError) throw saveError;

            if (deal.status === 'approved') {
                await supabase.from('deals').update({ status: 'meeting_done' }).eq('id', id);
            }

            showToast("Meeting notes saved successfully!", "success");
            fetchInitialData();
        } catch (err: any) {
            setError(err.message);
            showToast(err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const canEdit = deal?.status === 'approved' || deal?.status === 'meeting_done' || deal?.status === 'pack_generated';

    const updateDealStatus = async (status: string, feedback: string | null = null) => {
        setSaving(true);
        try {
            const payload: any = { status };
            if (feedback) payload.admin_feedback = feedback;

            const { error } = await supabase.from('deals').update(payload).eq('id', id);
            if (error) throw error;

            showToast(`Deal status updated to ${status.replace('_', ' ')}`, 'success');
            navigate('/meetings');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const addAttendee = (user: any) => {
        if (!canEdit) return;
        if (notesData.attendees.find(a => a.id === user.id)) return;
        setNotesData({
            ...notesData,
            attendees: [...notesData.attendees, { id: user.id, name: user.full_name, email: user.email }]
        });
        setSearchTerm('');
    };

    const removeAttendee = (userId: string) => {
        if (!canEdit) return;
        setNotesData({
            ...notesData,
            attendees: notesData.attendees.filter(a => a.id !== userId)
        });
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    const exportMeetingReport = () => {
        if (!deal || !notesData) return;

        const doc = new jsPDF();

        // Color Palette
        const primary: [number, number, number] = [11, 18, 25]; // #0B1219
        const accent: [number, number, number] = [37, 99, 235]; // #2563EB
        const textMain: [number, number, number] = [31, 41, 55]; // #1F2937
        const textSecondary: [number, number, number] = [107, 114, 128]; // #6B7280

        // Header
        doc.setFillColor(...primary);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('FULL NEGOTIATION PACK', 20, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('NEGO-PACK PRO | COMPLETE DEAL RECORD', 140, 25);

        // Section 1: DEAL BACKGROUND
        doc.setTextColor(...textMain);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('1. ORIGINAL DEAL SPECIFICATIONS', 20, 55);

        autoTable(doc, {
            startY: 60,
            head: [['Attribute', 'Details']],
            body: [
                ['Deal Title', deal.title],
                ['Supplier', deal.suppliers?.name || 'N/A'],
                ['Value (RM)', Number(deal.deal_value || 0).toLocaleString()],
                ['Pricing Model', deal.pricing_model || 'N/A'],
                ['Scope of Work', deal.scope],
                ['Key Issues/Risks', deal.key_issues],
                ['Desired Outcomes', deal.desired_outcomes]
            ],
            theme: 'striped',
            headStyles: { fillColor: accent },
            styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 1: { cellWidth: 130 } }
        });

        // Section 2: AI STRATEGY (NEW)
        if (pack) {
            doc.addPage();
            doc.setTextColor(...textMain);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('2. AI STRATEGY PLAN', 20, 20);

            autoTable(doc, {
                startY: 25,
                head: [['Strategic Area', 'Plan Details']],
                body: [
                    ['Targets', pack.targets.join('\n')],
                    ['Red Lines', pack.red_lines.join('\n')],
                    ['Concessions', pack.tradeables.map((t: any) => `Give: ${t.we_give} -> Get: ${t.we_get}`).join('\n')],
                    ['BATNA', pack.batna]
                ],
                theme: 'striped',
                headStyles: { fillColor: [245, 158, 11] }, // Amber for AI Strategy
                styles: { fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 120 } }
            });
        }

        // Section 3: MEETING INFO
        let nextY = (doc as any).lastAutoTable.finalY + 15;
        if (nextY > 230) {
            doc.addPage();
            nextY = 20;
        }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${pack ? '3' : '2'}. MEETING OUTCOMES`, 20, nextY);

        autoTable(doc, {
            startY: nextY + 5,
            head: [['Field', 'Description']],
            body: [
                ['Date Held', notesData.meeting_date],
                ['Venue/Platform', notesData.location || 'N/A'],
                ['Attendees', notesData.attendees.map(a => a.name).join(', ')],
                ['Current Status', deal.status.replace('_', ' ').toUpperCase()]
            ],
            theme: 'grid',
            headStyles: { fillColor: [75, 85, 99] },
            styles: { fontSize: 9, cellPadding: 4 }
        });

        // Section 4: DETAILED OUTCOMES
        nextY = (doc as any).lastAutoTable.finalY + 15;
        if (nextY > 210) {
            doc.addPage();
            nextY = 20;
        }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${pack ? '4' : '3'}. LOGS, DECISIONS & CONCESSIONS`, 20, nextY);

        autoTable(doc, {
            startY: nextY + 5,
            head: [['Category', 'Details']],
            body: [
                ['Key Discussion Log', notesData.discussion_points],
                ['Final Agreed Terms', notesData.decisions_made],
                ['Concessions Granted (We Gave)', notesData.concessions_granted],
                ['Concessions Received (We Won)', notesData.concessions_received],
                ['Next Steps', notesData.next_steps]
            ],
            theme: 'striped',
            headStyles: { fillColor: accent },
            styles: { fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 120 } }
        });

        // Footer
        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(...textSecondary);
            doc.text('Confidential Deal Record | Nego-Pack Pro Malaysia Market Standard', 20, 285);
            doc.text(`Page ${i} of ${totalPages}`, 180, 285);
        }

        doc.save(`FullPack_${deal.title.replace(/\s+/g, '_')}.pdf`);
        showToast("Full Negotiation Pack exported successfully.", "success");
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050A10] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    return (
        <div className="p-10">
            <div className="max-w-5xl mx-auto pb-20">
                <header className="flex items-center justify-between mb-10">
                    <div>

                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-600/10 text-blue-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Step 4</span>
                            <h1 className="text-4xl font-bold italic tracking-tight text-white">Meeting Outcomes</h1>
                        </div>
                        <p className="text-gray-400">Document final decisions for <span className="text-white">{deal?.title}</span></p>
                    </div>

                    <div className="flex items-center gap-4">
                        {deal?.status === 'approved' && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleSave}
                                disabled={saving}
                                className="group relative bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    Save Notes
                                </span>
                            </motion.button>
                        )}

                        {deal?.status === 'meeting_done' && (
                            <>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => updateDealStatus('approved', 'Meeting notes revision required.')}
                                    disabled={saving}
                                    className="group relative p-3.5 rounded-2xl border border-amber-500/20 text-amber-500 hover:bg-amber-500/5 transition-all disabled:opacity-50"
                                >
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                        Request Note Changes
                                    </span>
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => updateDealStatus('completed')}
                                    disabled={saving}
                                    className="group relative bg-green-600 hover:bg-green-700 text-white p-3.5 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-green-500/20 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                        Mark as Completed
                                    </span>
                                </motion.button>
                            </>
                        )}

                        {(deal?.status === 'completed' || deal?.status === 'meeting_done') && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={exportMeetingReport}
                                className="group relative bg-white/5 hover:bg-white/10 text-white border border-white/10 p-3.5 rounded-2xl flex items-center justify-center transition-all"
                            >
                                <Download className="w-5 h-5" />
                                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    Export Pack
                                </span>
                            </motion.button>
                        )}
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {deal?.admin_feedback && deal?.status === 'approved' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mb-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-[1.5rem] flex flex-col gap-2"
                        >
                            <div className="flex items-center gap-3 text-amber-500">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span className="font-bold uppercase tracking-widest text-xs">Revision Required</span>
                            </div>
                            <p className="text-sm text-gray-400 italic">" {deal.admin_feedback} "</p>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 flex items-center gap-3"
                        >
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!canEdit && deal?.status !== 'completed' && (
                    <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        Meeting notes can only be edited after the strategy is approved.
                    </div>
                )}

                {deal?.status === 'completed' && (
                    <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        This deal is completed. Meeting notes are now archived and read-only.
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Meeting Info */}
                        <section className="bg-[#0B1219] rounded-[2rem] border border-white/5 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Date held
                                </label>
                                <input
                                    type="date"
                                    disabled={!canEdit}
                                    className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-4 px-6 text-white focus:outline-none focus:border-blue-500/50 transition-all disabled:opacity-50"
                                    value={notesData.meeting_date}
                                    onChange={(e) => setNotesData({ ...notesData, meeting_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> Meeting Venue/Platform
                                </label>
                                <input
                                    type="text"
                                    disabled={!canEdit}
                                    placeholder="e.g. Microsoft Teams"
                                    className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-4 px-6 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium disabled:opacity-50"
                                    value={notesData.location}
                                    onChange={(e) => setNotesData({ ...notesData, location: e.target.value })}
                                />
                            </div>
                        </section>

                        {/* Discussion Points */}
                        <section className="bg-[#0B1219] rounded-[2rem] border border-white/5 p-8">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-blue-500" />
                                Key Discussion Log
                            </h3>
                            <textarea
                                rows={8}
                                disabled={!canEdit}
                                placeholder="Describe topics, supplier positions, and our responses..."
                                className="w-full bg-[#161F2A] border border-white/5 rounded-[1.5rem] py-6 px-6 text-white focus:outline-none focus:border-blue-500/50 transition-all resize-none font-medium leading-relaxed disabled:opacity-50"
                                value={notesData.discussion_points}
                                onChange={(e) => setNotesData({ ...notesData, discussion_points: e.target.value })}
                            />
                        </section>

                        {/* Decisions & Concessions */}
                        <section className="bg-[#0B1219] rounded-[2rem] border border-white/5 p-8">
                            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                                <CheckSquare className="w-5 h-5 text-green-500" />
                                Final Decisions & Concessions
                            </h3>
                            <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-4">What was ultimately agreed?</label>
                                    <textarea
                                        rows={4}
                                        disabled={!canEdit}
                                        className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 px-6 text-white focus:border-blue-500/50 transition-all font-medium leading-relaxed disabled:opacity-50"
                                        value={notesData.decisions_made}
                                        onChange={(e) => setNotesData({ ...notesData, decisions_made: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-4">Concessions We Granted</label>
                                        <textarea
                                            rows={3}
                                            disabled={!canEdit}
                                            placeholder="What did we give up? (e.g. earlier payment terms)"
                                            className="w-full bg-amber-500/[0.02] border border-amber-500/10 rounded-2xl py-4 px-5 text-sm text-white focus:border-amber-500/30 transition-all font-medium leading-relaxed disabled:opacity-50"
                                            value={notesData.concessions_granted}
                                            onChange={(e) => setNotesData({ ...notesData, concessions_granted: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-4">Concessions We Received</label>
                                        <textarea
                                            rows={3}
                                            disabled={!canEdit}
                                            placeholder="What did we win? (e.g. price reduction)"
                                            className="w-full bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl py-4 px-5 text-sm text-white focus:border-emerald-500/30 transition-all font-medium leading-relaxed disabled:opacity-50"
                                            value={notesData.concessions_received}
                                            onChange={(e) => setNotesData({ ...notesData, concessions_received: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-4">Next Steps / Follow-up</label>
                                    <textarea
                                        rows={3}
                                        disabled={!canEdit}
                                        placeholder="Immediate actions required after this meeting..."
                                        className="w-full bg-blue-500/[0.02] border border-blue-500/10 rounded-2xl py-4 px-5 text-sm text-white focus:border-blue-500/30 transition-all font-medium leading-relaxed disabled:opacity-50"
                                        value={notesData.next_steps}
                                        onChange={(e) => setNotesData({ ...notesData, next_steps: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        {/* Attendees */}
                        <section className="bg-[#0B1219] rounded-[2rem] border border-white/5 p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" />
                                Attendees list
                            </h3>

                            {canEdit && (
                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Add internal user..."
                                        className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />

                                    {searchTerm && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#161F2A] border border-white/10 rounded-xl overflow-hidden z-10 shadow-2xl">
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map(u => (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => addAttendee(u)}
                                                        className="w-full px-4 py-3 text-left hover:bg-blue-600/20 text-sm flex flex-col transition-colors border-b border-white/5 last:border-0"
                                                    >
                                                        <span className="font-bold text-white">{u.full_name}</span>
                                                        <span className="text-[10px] text-gray-500">{u.email}</span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-sm text-gray-500">No users found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                {notesData.attendees.map((attendee: any) => (
                                    <div key={attendee.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl group">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white">{attendee.name}</span>
                                            <span className="text-[10px] text-gray-500">{attendee.email}</span>
                                        </div>
                                        {canEdit && (
                                            <button
                                                onClick={() => removeAttendee(attendee.id)}
                                                className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {notesData.attendees.length === 0 && (
                                    <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                        <p className="text-xs text-gray-600">No attendees selected</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Summary Box */}
                        <section className="bg-gradient-to-br from-[#1C2833] to-[#0B1219] rounded-[2rem] border border-white/5 p-8 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-bold text-white italic">Malaysia Market Standards</h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                NegoPack Pro ensures all concessions are tracked against your original red lines to prevent value leakage in the Malaysia procurement cycle.
                            </p>
                            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                <div className="text-[10px] font-bold text-gray-600 uppercase mb-2">Deal Status</div>
                                <p className="text-sm font-bold text-blue-500 uppercase tracking-wider">{deal?.status.replace('_', ' ')}</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};
