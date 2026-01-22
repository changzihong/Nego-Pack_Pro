import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Scale, Lock, ShieldCheck, Gavel, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import kadoshLogo from '../components/image/kadosh_ai_logo.jpeg';

export const Terms = () => {
    return (
        <div className="min-h-screen bg-[#050A10] text-white selection:bg-blue-500/30 overflow-x-hidden p-6 md:p-20">
            <div className="max-w-4xl mx-auto">
                <Link to="/signup" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-12 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Signup
                </Link>

                <header className="mb-16">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Shield className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold">Terms & Conditions</h1>
                    </div>
                    <p className="text-gray-400 italic">Last Updated: 16 January 2026 | Governing Law: Malaysia</p>
                </header>

                <div className="space-y-12 text-gray-300 leading-relaxed">
                    <section className="bg-[#0B1219] p-8 rounded-[2rem] border border-white/5">
                        <div className="flex items-center gap-3 mb-6 text-blue-500">
                            <Scale className="w-6 h-6" />
                            <h2 className="text-xl font-bold uppercase tracking-widest italic">1. Legal Agreement</h2>
                        </div>
                        <p className="mb-4">
                            By accessing NegoPack Pro ("the Platform"), you agree to be bound by these Terms and Conditions. These terms are governed by the <strong>Contracts Act 1950</strong> and the <strong>Digital Signature Act 1997</strong> of Malaysia.
                        </p>
                        <p>
                            We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of such modifications.
                        </p>
                    </section>

                    <section className="bg-[#0B1219] p-8 rounded-[2rem] border border-white/5">
                        <div className="flex items-center gap-3 mb-6 text-indigo-500">
                            <Lock className="w-6 h-6" />
                            <h2 className="text-xl font-bold uppercase tracking-widest italic">2. PDPA & Data Privacy</h2>
                        </div>
                        <p className="mb-4">
                            In compliance with the <strong>Personal Data Protection Act 2010 (PDPA)</strong>, NegoPack Pro ensures that all personal and corporate data collected is processed lawfully.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-sm text-gray-400">
                            <li>Data is stored on secure servers with enterprise-grade encryption.</li>
                            <li>Corporate negotiation data is strictly confidential and never shared with third parties.</li>
                            <li>Users have the right to request access to and correction of their personal data.</li>
                        </ul>
                    </section>

                    <section className="bg-[#0B1219] p-8 rounded-[2rem] border border-white/5">
                        <div className="flex items-center gap-3 mb-6 text-green-500">
                            <ShieldCheck className="w-6 h-6" />
                            <h2 className="text-xl font-bold uppercase tracking-widest italic">3. User Responsibility</h2>
                        </div>
                        <p className="mb-4">
                            You are responsible for maintaining the confidentiality of your account credentials ("Encryption Keys"). Under the <strong>Computer Crimes Act 1997</strong>, unauthorized access to computer material is a criminal offense.
                        </p>
                        <p>
                            NegoPack Pro shall not be liable for any losses resulting from unauthorized use of your account due to negligence in securing login credentials.
                        </p>
                    </section>

                    <section className="bg-[#0B1219] p-8 rounded-[2rem] border border-white/5">
                        <div className="flex items-center gap-3 mb-6 text-amber-500">
                            <Gavel className="w-6 h-6" />
                            <h2 className="text-xl font-bold uppercase tracking-widest italic">4. Limitation of Liability</h2>
                        </div>
                        <p className="mb-4">
                            NegoPack Pro provides AI-driven strategic suggestions. These suggestions are for guidance only and do not constitute legal or financial advice.
                        </p>
                        <p>
                            To the maximum extent permitted under Malaysian law, we shall not be liable for any indirect, incidental, or consequential damages arising from negotiation outcomes or reliance on AI-generated data.
                        </p>
                    </section>

                    <section className="bg-[#0B1219] p-8 rounded-[2rem] border border-white/5">
                        <div className="flex items-center gap-3 mb-6 text-purple-500">
                            <FileText className="w-6 h-6" />
                            <h2 className="text-xl font-bold uppercase tracking-widest italic">5. Termination</h2>
                        </div>
                        <p>
                            We reserve the right to suspend or terminate access for any user found to be in violation of these terms or engaged in activities deemed harmful to the platform's integrity or other users.
                        </p>
                    </section>
                </div>

                <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <p>Copyright &copy; 2026</p>
                        <img src={kadoshLogo} alt="KadoshAI" className="w-5 h-5 rounded-sm object-cover" />
                        <span className="text-gray-500">.</span>
                        <p className="text-white font-bold">KadoshAI</p>
                        <p>All rights reserved.</p>
                    </div>
                    <p className="text-gray-600 text-[10px]">All legal disputes shall be subject to the exclusive jurisdiction of the Courts of Malaysia.</p>
                </footer>
            </div>
        </div>
    );
};
