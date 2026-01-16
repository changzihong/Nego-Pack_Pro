import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Save, Share2, RefreshCw, CheckCircle2, AlertCircle, HelpCircle, FileText, Target, Shield, Repeat, Loader2, ArrowLeft, XCircle, Edit3, MessageSquare, Download } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { openai } from '../lib/openai';
import { useToast } from '../components/ToastProvider';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PackReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deal, setDeal] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [pack, setPack] = useState<any>(null);

    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackType, setFeedbackType] = useState<'changes' | 'reject'>('changes');
    const [feedbackText, setFeedbackText] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            const { data: profileData } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(profileData);

            const { data: dealData, error: dealError } = await supabase
                .from('deals')
                .select('*, suppliers(name)')
                .eq('id', id)
                .single();

            if (dealError) throw dealError;

            // Fetch owner email for notifications
            const { data: ownerData } = await supabase
                .from('users')
                .select('email')
                .eq('id', dealData.owner_id)
                .single();

            setDeal({ ...dealData, owner_email: ownerData?.email });

            const { data: packData } = await supabase
                .from('negotiation_packs')
                .select('*')
                .eq('deal_id', id)
                .single();

            if (packData) {
                setPack(packData);
            } else if (dealData.status === 'draft') {
                generatePack(dealData);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generatePack = async (dealContext: any) => {
        setIsGenerating(true);
        setError(null);
        try {
            const prompt = `You are a professional negotiation strategist. Based on the following deal for the Malaysia market (RM Currency):

Supplier: ${dealContext.suppliers?.name}
Title: ${dealContext.title}
Scope: ${dealContext.scope}
Pricing Model: ${dealContext.pricing_model}
Key Issues: ${dealContext.key_issues}
Desired Outcomes: ${dealContext.desired_outcomes}
Deal Value: RM ${dealContext.deal_value || 'N/A'}

Generate a comprehensive negotiation pack in JSON format:
{
  "targets": ["specific measurable goal 1", "goal 2", ...],
  "red_lines": ["non-negotiable condition 1", "condition 2", ...],
  "tradeables": [
    {"we_give": "item", "we_get": "return value"},
    ...
  ],
  "batna": "our best alternative if negotiation fails",
  "questions": ["key question 1", "question 2", ...],
  "meeting_agenda": "Provide a structured agenda. IMPORTANT: After each numbered item or sentence, add TWO newlines (\\n\\n) to ensure a clear space between items in the UI. Format it like: 1. Introduction\\n\\n2. Discussion..."
}`;

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" }
            });

            const aiContent = JSON.parse(response.choices[0].message.content || '{}');

            const { data: savedPack, error: packError } = await supabase
                .from('negotiation_packs')
                .upsert({
                    deal_id: id,
                    targets: aiContent.targets,
                    red_lines: aiContent.red_lines,
                    tradeables: aiContent.tradeables,
                    batna: aiContent.batna,
                    questions: aiContent.questions,
                    meeting_agenda: aiContent.meeting_agenda,
                }, {
                    onConflict: 'deal_id'
                })
                .select()
                .single();

            if (packError) throw packError;

            await supabase.from('deals').update({ status: 'pack_generated' }).eq('id', id);
            setPack(savedPack);
        } catch (err: any) {
            setError("AI generation failed. Please check your API key and try again.");
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const updateDealStatus = async (status: string, feedback: string | null = null) => {
        setActionLoading(true);
        try {
            const payload: any = { status };
            if (feedback !== null) {
                payload.admin_feedback = feedback;
            }

            const { error } = await supabase
                .from('deals')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAdminFeedbackSubmit = async () => {
        if (!feedbackText.trim()) return;
        const status = feedbackType === 'changes' ? 'changes_requested' : 'rejected';

        setActionLoading(true);
        setIsSendingEmail(true);

        try {
            // Update Status
            await updateDealStatus(status, feedbackText);

            // Simulate In-App Email Sending
            // In a real production app, this would call a Supabase Edge Function 
            // connected to Resend, SendGrid, or AWS SES.
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating API call

            showToast(`Email notification sent to ${deal?.owner_email || 'employee'}.`, 'success');
            setShowFeedbackModal(false);
            setFeedbackText('');
            navigate('/dashboard');
        } catch (err: any) {
            showToast("Failed to update status or send notification.", "error");
        } finally {
            setActionLoading(false);
            setIsSendingEmail(false);
        }
    };

    const downloadStrategy = () => {
        if (!pack || !deal) return;

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
        doc.text('NEGOTIATION STRATEGY PACK', 20, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('NEGO-PACK PRO | STRATEGIC PLANNING', 145, 25);

        // Deal Info Section
        doc.setTextColor(...textMain);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('STRATEGY CONTEXT', 20, 55);

        autoTable(doc, {
            startY: 60,
            head: [['Field', 'Details']],
            body: [
                ['Deal Title', deal.title],
                ['Supplier', deal.suppliers?.name || 'N/A'],
                ['Total Value', `RM ${Number(deal.deal_value || 0).toLocaleString()}`],
                ['Status', deal.status.replace('_', ' ').toUpperCase()]
            ],
            theme: 'striped',
            headStyles: { fillColor: accent },
            styles: { fontSize: 10, cellPadding: 5 }
        });

        // 1. Targets & Red Lines
        let currentY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('FINANCIAL & SCOPE TARGETS', 20, currentY);

        autoTable(doc, {
            startY: currentY + 5,
            body: pack.targets.map((t: string, i: number) => [`#${i + 1}`, t]),
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 15 } }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('NON-NEGOTIABLE RED LINES', 20, currentY);

        autoTable(doc, {
            startY: currentY + 5,
            body: pack.red_lines.map((l: string) => ['•', l]),
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 3, textColor: [185, 28, 28] }, // Red text for red lines
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 10 } }
        });

        // 2. Concessions Playbook
        currentY = (doc as any).lastAutoTable.finalY + 15;
        doc.addPage();
        currentY = 20;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('CONCESSIONS PLAYBOOK (TRADEABLES)', 20, currentY);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Optional Gift (We Give)', 'Required Gain (We Get)']],
            body: pack.tradeables.map((item: any) => [item.we_give, item.we_get]),
            theme: 'grid',
            headStyles: { fillColor: [245, 158, 11] }, // Amber for concessions
            styles: { fontSize: 9, cellPadding: 5 }
        });

        // 3. BATNA & Questions
        currentY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('BATNA & STRATEGIC QUESTIONS', 20, currentY);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Strategic Area', 'Details']],
            body: [
                ['BATNA', pack.batna],
                ['Key Questions', pack.questions.join('\n\n')]
            ],
            theme: 'striped',
            headStyles: { fillColor: accent },
            styles: { fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 1: { cellWidth: 130 } }
        });

        // 4. Meeting Agenda
        currentY = (doc as any).lastAutoTable.finalY + 15;
        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('SUGGESTED MEETING AGENDA', 20, currentY);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textSecondary);
        const splitAgenda = doc.splitTextToSize(pack.meeting_agenda, 170);
        doc.text(splitAgenda, 20, currentY + 10);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Confidential Negotiation Strategy | Prepared by Nego-Pack Pro AI', 20, 285);
        doc.text(`Page ${(doc as any).getNumberOfPages()}`, 180, 285);

        doc.save(`Strategy_${deal.title.replace(/\s+/g, '_')}.pdf`);
        showToast("Professional strategy PDF downloaded successfully.", "success");
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050A10] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    return (
        <div className="p-10">
            <div className="max-w-6xl mx-auto pb-20">
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Link>

                {deal?.admin_feedback && (
                    <div className="mb-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-start gap-4">
                        <MessageSquare className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                        <div>
                            <h4 className="text-amber-500 font-bold text-sm uppercase tracking-widest mb-1">Admin Feedback</h4>
                            <p className="text-gray-300 leading-relaxed italic">"{deal.admin_feedback}"</p>
                        </div>
                    </div>
                )}

                <header className="flex items-center justify-between mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-blue-600/10 text-blue-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Step 2</span>
                            <div className="h-px w-24 bg-white/5" />
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${deal?.status === 'approved' || deal?.status === 'meeting_done' ? 'bg-green-500/10 text-green-500' :
                                deal?.status === 'in_review' ? 'bg-amber-500/10 text-amber-500' :
                                    deal?.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                        'bg-white/5 text-gray-500'
                                }`}>
                                {deal?.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                            AI Negotiation Pack
                            {isGenerating ? <Loader2 className="w-8 h-8 text-blue-500 animate-spin" /> : <Sparkles className="w-8 h-8 text-blue-500" />}
                        </h1>
                        <p className="text-gray-400">Review and refine the AI-generated strategy for <span className="text-white font-medium">{deal?.title}</span></p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Employee Actions */}
                        {profile?.role !== 'admin' && (
                            <>
                                {(deal?.status === 'pack_generated' || deal?.status === 'changes_requested') && (
                                    <>
                                        <button
                                            onClick={() => navigate(`/new-deal?id=${id}`)}
                                            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Edit Deal Info
                                        </button>
                                        <button
                                            onClick={() => generatePack(deal)}
                                            disabled={isGenerating}
                                            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold disabled:opacity-50"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                            Regenerate AI
                                        </button>
                                        <button
                                            onClick={() => updateDealStatus('in_review')}
                                            disabled={actionLoading}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl flex items-center gap-3 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
                                        >
                                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                                            Submit for Approval
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        {/* Admin Actions */}
                        {profile?.role === 'admin' && (
                            <div className="flex items-center gap-3">
                                {deal?.status === 'in_review' && (
                                    <>
                                        <button
                                            onClick={() => { setFeedbackType('changes'); setShowFeedbackModal(true); }}
                                            className="px-5 py-3 rounded-xl border border-amber-500/20 text-amber-500 hover:bg-amber-500/5 transition-all text-sm font-bold"
                                        >
                                            Request Changes
                                        </button>
                                        <button
                                            onClick={() => { setFeedbackType('reject'); setShowFeedbackModal(true); }}
                                            className="px-5 py-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/5 transition-all text-sm font-bold"
                                        >
                                            Reject Deal
                                        </button>
                                        <button
                                            onClick={() => updateDealStatus('approved')}
                                            disabled={actionLoading}
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-8 rounded-xl flex items-center gap-3 transition-all shadow-xl shadow-green-500/20 disabled:opacity-50"
                                        >
                                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                            Approve Strategy
                                        </button>
                                    </>
                                )}

                                {deal?.status === 'rejected' && (
                                    <button
                                        onClick={() => updateDealStatus('changes_requested', 'Reopened for Revision')}
                                        disabled={actionLoading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl flex items-center gap-3 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                        Reopen for Revision
                                    </button>
                                )}
                            </div>
                        )}

                        {(deal?.status === 'approved' || deal?.status === 'meeting_done') && (
                            <button
                                onClick={() => navigate(`/meeting/${id}`)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-xl flex items-center gap-3 transition-all shadow-xl shadow-indigo-500/20"
                            >
                                Manage Meeting Notes
                                <FileText className="w-5 h-5" />
                            </button>
                        )}
                        {pack && (
                            <button
                                onClick={downloadStrategy}
                                className="bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 px-6 rounded-xl flex items-center gap-2 transition-all border border-white/5"
                            >
                                <Download className="w-5 h-5" />
                                Download Strategy
                            </button>
                        )}
                    </div>
                </header>

                {isGenerating ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xl font-medium text-blue-500">AI is analyzing deal parameters...</p>
                        <p className="text-gray-500">Calculating red lines and concessions based on Malaysia market norms.</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-10 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
                        <p className="text-gray-400 mb-6">{error}</p>
                        <button onClick={() => fetchData()} className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl transition-all">Retry</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <section className="bg-[#0B1219] rounded-[2rem] border border-white/5 p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] pointer-events-none" />
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                                        <Target className="w-5 h-5 text-green-500" />
                                    </div>
                                    <h3 className="text-xl font-bold italic tracking-tight">Financial & Scope Targets</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {pack?.targets.map((target: string, i: number) => (
                                        <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-green-500/20 transition-all font-medium">
                                            <span className="text-green-500/40 font-bold text-lg leading-none">#{(i + 1).toString().padStart(2, '0')}</span>
                                            <span className="text-gray-300 flex-1 leading-relaxed">{target}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="bg-[#0B1219] rounded-[2rem] border border-white/5 p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[50px] pointer-events-none" />
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-bold italic tracking-tight text-white">Non-Negotiable Red Lines</h3>
                                </div>
                                <div className="space-y-4">
                                    {pack?.red_lines.map((line: string, i: number) => (
                                        <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-red-500/[0.02] border border-white/5 hover:border-red-500/20 transition-all">
                                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                            <span className="text-gray-300 font-medium">{line}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="bg-[#0B1219] rounded-[2rem] border border-white/5 p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] pointer-events-none" />
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                        <Repeat className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <h3 className="text-xl font-bold italic tracking-tight text-white">Concessions Playbook</h3>
                                </div>
                                <div className="space-y-5">
                                    {pack?.tradeables.map((item: any, i: number) => (
                                        <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10">
                                                <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest mb-3">Optional Gift (We Give)</p>
                                                <p className="text-gray-300 font-medium leading-relaxed">{item.we_give}</p>
                                            </div>
                                            <div className="p-5 rounded-2xl bg-blue-500/[0.03] border border-blue-500/10">
                                                <p className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest mb-3">Required Gain (We Get)</p>
                                                <p className="text-gray-300 font-medium leading-relaxed">{item.we_get}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="space-y-8">
                            <section className="bg-gradient-to-br from-[#1C2833] to-[#0B1219] rounded-[2rem] border border-white/5 p-8 shadow-xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <HelpCircle className="w-5 h-5 text-blue-400" />
                                    <h3 className="text-lg font-bold text-white italic">BATNA</h3>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-blue-500/30 pl-4 py-1">
                                    "{pack?.batna}"
                                </p>
                            </section>

                            <section className="bg-[#0B1219] rounded-[2rem] border border-white/5 p-8">
                                <h3 className="text-lg font-bold mb-6 text-white italic">Strategic Questions</h3>
                                <div className="space-y-4">
                                    {pack?.questions.map((q: string, i: number) => (
                                        <div key={i} className="p-4 rounded-2xl bg-white/[0.02] text-sm text-gray-400 border border-white/5 group hover:border-blue-500/20 transition-all">
                                            <p className="group-hover:text-blue-200 transition-colors leading-relaxed">{q}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="bg-[#0B1219] rounded-[2rem] border border-white/5 p-8">
                                <h3 className="text-lg font-bold mb-6 flex items-center justify-between text-white italic">
                                    Suggested Agenda
                                    <FileText className="w-4 h-4 text-gray-600" />
                                </h3>
                                <div className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed font-medium">
                                    {pack?.meeting_agenda?.split(/(?=\d\.)/).map((item: string, idx: number) => (
                                        <div key={idx} className={item.trim() ? "mb-4" : ""}>
                                            {item.trim()}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>

            {/* Admin Feedback Modal */}
            <AnimatePresence>
                {showFeedbackModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowFeedbackModal(false)}
                            className="absolute inset-0 bg-[#050A10]/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0B1219] rounded-3xl border border-white/10 p-10 shadow-3xl"
                        >
                            <h2 className={`text-2xl font-bold mb-6 italic ${feedbackType === 'reject' ? 'text-red-500' : 'text-amber-500'}`}>
                                {feedbackType === 'reject' ? 'Reject Deal' : 'Request Changes'}
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Feedback / Reason</label>
                                    <textarea
                                        rows={4}
                                        required
                                        placeholder="Provide detailed feedback for the employee..."
                                        className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium resize-none shadow-inner"
                                        value={feedbackText}
                                        onChange={e => setFeedbackText(e.target.value)}
                                    />
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowFeedbackModal(false)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAdminFeedbackSubmit}
                                        disabled={actionLoading || isSendingEmail}
                                        className={`flex-1 font-bold py-3.5 rounded-xl transition-all shadow-lg text-white flex items-center justify-center gap-2 ${feedbackType === 'reject' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                                            } disabled:opacity-50`}
                                    >
                                        {isSendingEmail ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Sending Email...
                                            </>
                                        ) : actionLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            'Confirm & Notify'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
