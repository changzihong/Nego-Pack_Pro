import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, AlertCircle, HelpCircle, FileText, Target, Shield, Repeat, Loader2, ArrowLeft, Edit3, Download } from 'lucide-react';
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
    const [pack, setPack] = useState<any>(null);
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
        <div className="relative min-h-screen bg-[#050A10]">
            <div className="p-10 relative z-10">
                {/* Background Decor */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full animate-float opacity-50" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full animate-float opacity-50" style={{ animationDelay: '-3s' }} />
                </div>
                <div className="max-w-6xl mx-auto pb-20">
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>


                    <header className="flex items-center justify-between mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-blue-600/10 text-blue-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Strategy Generated</span>
                            </div>
                            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                AI Negotiation Pack
                                {isGenerating ? <Loader2 className="w-8 h-8 text-blue-500 animate-spin" /> : <Sparkles className="w-8 h-8 text-blue-500" />}
                            </h1>
                            <p className="text-gray-400">Review and refine the AI-generated strategy for <span className="text-white font-medium">{deal?.title}</span></p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <motion.button
                                    whileHover="hover"
                                    initial="rest"
                                    animate="rest"
                                    onClick={() => navigate(`/new-deal?id=${id}`)}
                                    className="flex items-center p-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all overflow-hidden cursor-pointer"
                                >
                                    <Edit3 className="w-5 h-5 shrink-0" />
                                    <motion.span
                                        variants={{
                                            rest: { width: 0, opacity: 0, marginLeft: 0 },
                                            hover: { width: "auto", opacity: 1, marginLeft: 10, marginRight: 2 }
                                        }}
                                        className="text-xs font-bold whitespace-nowrap overflow-hidden uppercase tracking-widest"
                                    >
                                        Edit Details
                                    </motion.span>
                                </motion.button>

                                <motion.button
                                    whileHover="hover"
                                    initial="rest"
                                    animate="rest"
                                    onClick={() => generatePack(deal)}
                                    disabled={isGenerating}
                                    className="flex items-center p-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50 overflow-hidden cursor-pointer"
                                >
                                    <RefreshCw className={`w-5 h-5 shrink-0 ${isGenerating ? 'animate-spin' : ''}`} />
                                    <motion.span
                                        variants={{
                                            rest: { width: 0, opacity: 0, marginLeft: 0 },
                                            hover: { width: "auto", opacity: 1, marginLeft: 10, marginRight: 2 }
                                        }}
                                        className="text-xs font-bold whitespace-nowrap overflow-hidden uppercase tracking-widest"
                                    >
                                        Regenerate Pack
                                    </motion.span>
                                </motion.button>

                                {pack && (
                                    <motion.button
                                        whileHover="hover"
                                        initial="rest"
                                        animate="rest"
                                        onClick={downloadStrategy}
                                        className="flex items-center bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl transition-all border border-white/5 overflow-hidden cursor-pointer"
                                    >
                                        <Download className="w-5 h-5 shrink-0" />
                                        <motion.span
                                            variants={{
                                                rest: { width: 0, opacity: 0, marginLeft: 0 },
                                                hover: { width: "auto", opacity: 1, marginLeft: 10, marginRight: 2 }
                                            }}
                                            className="text-xs font-bold whitespace-nowrap overflow-hidden uppercase tracking-widest"
                                        >
                                            Download
                                        </motion.span>
                                    </motion.button>
                                )}
                            </div>
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
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => fetchData()}
                                className="group relative bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl transition-all"
                            >
                                <RefreshCw className="w-5 h-5" />
                                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    Retry Loading
                                </span>
                            </motion.button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <motion.section
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-b from-[#0B1219] to-[#050A10] rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden shadow-2xl"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[80px] pointer-events-none" />
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                                            <Target className="w-6 h-6 text-green-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">Financial & Scope Targets</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-5">
                                        {pack?.targets.map((target: string, i: number) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ scale: 1.04, x: 15, backgroundColor: "rgba(34, 197, 94, 0.08)", borderColor: "rgba(34, 197, 94, 0.3)" }}
                                                className="flex items-start gap-5 p-6 rounded-[1.5rem] bg-white/[0.03] border border-white/5 transition-all font-medium cursor-default shadow-sm group"
                                            >
                                                <span className="text-green-500 font-black text-xl leading-none opacity-40 group-hover:opacity-100 transition-opacity">#{(i + 1).toString().padStart(2, '0')}</span>
                                                <span className="text-gray-200 flex-1 leading-relaxed text-lg">{target}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.section>

                                <motion.section
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-gradient-to-b from-[#0B1219] to-[#050A10] rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden shadow-2xl"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] pointer-events-none" />
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                                            <Shield className="w-6 h-6 text-red-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">Non-Negotiable Red Lines</h3>
                                    </div>
                                    <div className="space-y-5">
                                        {pack?.red_lines.map((line: string, i: number) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ scale: 1.04, x: 15, backgroundColor: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.3)" }}
                                                className="flex items-center gap-5 p-6 rounded-[1.5rem] bg-red-500/[0.03] border border-white/5 transition-all cursor-default shadow-sm group"
                                            >
                                                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] group-hover:scale-125 transition-transform" />
                                                <span className="text-gray-200 font-semibold text-lg">{line}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.section>

                                <motion.section
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-gradient-to-b from-[#0B1219] to-[#050A10] rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden shadow-2xl"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] pointer-events-none" />
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <Repeat className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">Concessions Playbook</h3>
                                    </div>
                                    <div className="space-y-6">
                                        {pack?.tradeables.map((item: any, i: number) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ scale: 1.03 }}
                                                className="grid grid-cols-1 md:grid-cols-2 gap-5"
                                            >
                                                <div className="p-7 rounded-[1.5rem] bg-amber-500/[0.05] border border-amber-500/10 hover:border-amber-500/40 transition-all shadow-lg group">
                                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4 opacity-50">Optional Gift (We Give)</p>
                                                    <p className="text-gray-200 font-bold text-lg leading-relaxed group-hover:text-white transition-colors">{item.we_give}</p>
                                                </div>
                                                <div className="p-7 rounded-[1.5rem] bg-indigo-500/[0.05] border border-indigo-500/10 hover:border-indigo-500/40 transition-all shadow-lg group">
                                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 opacity-50">Required Gain (We Get)</p>
                                                    <p className="text-gray-200 font-bold text-lg leading-relaxed group-hover:text-indigo-200 transition-colors">{item.we_get}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.section>
                            </div>

                            <div className="space-y-8">
                                <motion.section
                                    whileHover={{ y: -10 }}
                                    className="bg-gradient-to-br from-[#1C2833] to-[#0B1219] rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl pointer-events-none" />
                                    <div className="flex items-center gap-3 mb-6">
                                        <HelpCircle className="w-6 h-6 text-indigo-400" />
                                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">BATNA</h3>
                                    </div>
                                    <p className="text-lg text-gray-300 leading-relaxed italic border-l-4 border-indigo-500/50 pl-6 py-2 group-hover:text-white transition-colors">
                                        "{pack?.batna}"
                                    </p>
                                </motion.section>

                                <motion.section
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-[#0B1219]/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-8 shadow-2xl"
                                >
                                    <h3 className="text-xl font-bold mb-8 text-white italic flex items-center gap-3">
                                        <div className="w-2 h-8 bg-blue-500 rounded-full" />
                                        Strategic Questions
                                    </h3>
                                    <div className="space-y-5">
                                        {pack?.questions.map((q: string, i: number) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ scale: 1.05, x: 5, backgroundColor: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.3)" }}
                                                className="p-5 rounded-2xl bg-white/[0.03] text-base text-gray-300 border border-white/5 group hover:border-blue-500/20 transition-all cursor-default shadow-md"
                                            >
                                                <p className="group-hover:text-white transition-colors leading-relaxed font-medium">{q}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.section>

                                <motion.section
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-[#0B1219]/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-8 shadow-2xl"
                                >
                                    <h3 className="text-xl font-bold mb-8 flex items-center justify-between text-white italic">
                                        Suggested Agenda
                                        <FileText className="w-5 h-5 text-gray-400" />
                                    </h3>
                                    <div className="text-base text-gray-400 whitespace-pre-wrap leading-loose font-medium">
                                        {pack?.meeting_agenda?.split(/(?=\d\.)/).map((item: string, idx: number) => (
                                            <motion.div
                                                key={idx}
                                                whileHover={{ scale: 1.04, color: "#fff", x: 10 }}
                                                className={`${item.trim() ? "mb-6" : ""} cursor-default transition-all p-4 rounded-xl hover:bg-white/[0.02]`}
                                            >
                                                {item.trim()}
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.section>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
