import React from 'react';
import { motion } from 'framer-motion';
import {
    Shield, Sparkles, TrendingUp, Users,
    ArrowRight, CheckCircle2, Zap, BarChart3,
    Globe, Lock, LayoutDashboard, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import kadoshLogo from '../components/image/kadosh_ai_logo.jpeg';

export const Landing = () => {
    return (
        <div className="min-h-screen bg-[#050A10] text-white selection:bg-blue-500/30 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050A10]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">NegoPack <span className="text-blue-500">Pro</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-white transition-colors">Workflow</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-white transition-colors px-4">Sign In</Link>
                        <Link
                            to="/signup"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-24 px-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl aspect-square bg-blue-600/10 rounded-full blur-[120px] -z-10" />

                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8"
                    >
                        <Sparkles className="w-4 h-4" />
                        Next-Gen Negotiation Intelligence
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1]"
                    >
                        Master Every Deal with <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">AI Precision</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-400 mb-12 leading-relaxed max-w-2xl mx-auto"
                    >
                        Elevate your strategic sourcing. Generate real-time BATNA, tradeables, and meeting agendas tailored for the Malaysian market in seconds.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            to="/signup"
                            className="w-full sm:w-auto bg-white text-black hover:bg-gray-100 font-bold py-4 px-10 rounded-2xl flex items-center justify-center gap-2 transition-all group text-lg"
                        >
                            Start Your First Deal
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>

                    </motion.div>
                </div>

                {/* Dashboard Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="mt-24 max-w-6xl mx-auto relative px-4"
                >
                    <div className="relative rounded-[2.5rem] border border-white/10 bg-[#0B1219] p-4 shadow-3xl overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/5 to-transparent pointer-events-none" />
                        <div className="rounded-[1.5rem] overflow-hidden border border-white/5 shadow-inner">
                            {/* Visual representation of the app */}
                            <div className="bg-[#050A10] aspect-[16/9] flex items-center justify-center relative">
                                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:20px_20px]" />
                                <div className="z-10 flex flex-col items-center gap-6">
                                    <div className="flex gap-4">
                                        <div className="w-48 h-32 bg-[#0B1219] rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                                            <BarChart3 className="w-6 h-6 text-blue-500" />
                                            <div className="h-2 w-full bg-white/5 rounded" />
                                            <div className="h-2 w-3/4 bg-white/5 rounded" />
                                        </div>
                                        <div className="w-48 h-32 bg-blue-600/20 rounded-2xl border border-blue-500/30 p-4 flex flex-col justify-between">
                                            <Zap className="w-6 h-6 text-blue-400" />
                                            <div className="h-2 w-full bg-blue-400/20 rounded" />
                                            <div className="h-2 w-1/2 bg-blue-400/20 rounded" />
                                        </div>
                                    </div>
                                    <div className="w-96 h-40 bg-[#0B1219] rounded-2xl border border-white/5 p-6 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white/5" />
                                            <div className="space-y-2 flex-1">
                                                <div className="h-2 w-1/2 bg-white/10 rounded" />
                                                <div className="h-2 w-1/4 bg-white/5 rounded" />
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded" />
                                        <div className="h-2 w-full bg-white/5 rounded" />
                                        <div className="h-2 w-3/4 bg-white/5 rounded" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold mb-4">Engineered for RM-scale Impact</h2>
                        <p className="text-gray-400 max-w-xl mx-auto italic">Strategic Tools for the Modern Procurement Team</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <LayoutDashboard className="w-8 h-8 text-blue-500" />,
                                title: "Deal Pipeline",
                                desc: "Track every negotiation from draft to approval in a centralized, visually organized workspace."
                            },
                            {
                                icon: <Sparkles className="w-8 h-8 text-indigo-500" />,
                                title: "AI Strategy Pack",
                                desc: "Proprietary AI analyzes your deal criteria to generate BATNA, red lines, and tradeable assets."
                            },
                            {
                                icon: <Users className="w-8 h-8 text-blue-400" />,
                                title: "Supplier Intelligence",
                                desc: "Categorize and manage your supplier relationships with historical deal tracking and performance analytics."
                            },
                            {
                                icon: <FileText className="w-8 h-8 text-purple-500" />,
                                title: "Smart Meeting Notes",
                                desc: "Integrated meeting system that captures concessions, decisions, and translates them into actionable next steps."
                            },
                            {
                                icon: <TrendingUp className="w-8 h-8 text-green-500" />,
                                title: "Outcome Optimization",
                                desc: "Identify and secure the best possible RM value through data-backed negotiation preparations."
                            },
                            {
                                icon: <Lock className="w-8 h-8 text-amber-500" />,
                                title: "Admin Controls",
                                desc: "Multi-layered role permissions ensuring critical deal strategies are reviewed and approved by management."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="bg-[#0B1219] p-10 rounded-[2.5rem] border border-white/5 hover:border-blue-500/30 transition-all group">
                                <div className="mb-6 p-4 bg-white/[0.02] rounded-2xl inline-block group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-4 italic">{feature.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="py-32 px-6 bg-blue-600/5 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <h2 className="text-5xl font-bold mb-8 italic">The NegoPack <span className="text-blue-500">Workflow</span></h2>
                            <div className="space-y-12">
                                {[
                                    { step: "01", title: "Deal Intake", desc: "Input your supplier details, scope, and target outcomes into our structured RM-focused intake form." },
                                    { step: "02", title: "Strategy Generation", desc: "Our AI engine processes the deal parameters to build your specific negotiation strategy pack." },
                                    { step: "03", title: "Management Review", desc: "Admins review the strategy, provide feedback, and approve via an integrated notification loop." },
                                    { step: "04", title: "Execution & Tracking", desc: "Use your pack during the negotiation and log every concession directly into the system." }
                                ].map((s, i) => (
                                    <div key={i} className="flex gap-6">
                                        <span className="text-3xl font-bold text-blue-500/20 italic">{s.step}</span>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2 italic">{s.title}</h4>
                                            <p className="text-gray-400 text-sm">{s.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-square bg-blue-600/10 rounded-full blur-3xl absolute inset-0" />
                            <div className="bg-[#0B1219] border border-white/10 p-10 rounded-[3rem] relative z-10 shadow-3xl">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-xl flex items-center justify-center">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold">Protocol Approved</h4>
                                            <p className="text-xs text-gray-500">Ready for negotiation</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl italic text-sm text-gray-400 leading-relaxed">
                                        "The BATNA for this RM 2.4M contract has been analyzed. Prioritize the 24-month payment term concession to secure the 15% discount."
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-24 bg-white/5 rounded-2xl" />
                                        <div className="h-24 bg-white/5 rounded-2xl" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight italic">NegoPack <span className="text-blue-500">Pro</span></span>
                    </div>

                    <div className="flex gap-8 text-sm font-medium text-gray-400">
                        <p>&copy; 2026 NegoPack Pro Malaysia. All Rights Reserved.</p>
                        <div className="flex items-center gap-2 border-l border-white/10 pl-8 ml-auto">
                            <img src={kadoshLogo} alt="KadoshAI" className="w-6 h-6 rounded-md object-cover" />
                            <span className="text-white font-bold tracking-tight">KadoshAI</span>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <Globe className="w-5 h-5 text-gray-500" />
                        <Lock className="w-5 h-5 text-gray-500" />
                    </div>
                </div>
            </footer>
        </div>
    );
};
