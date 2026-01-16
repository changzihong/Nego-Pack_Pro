import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastProvider';

export const Login = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (loginError) throw loginError;

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || "An error occurred during login");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError("Please enter your email address first.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/settings`,
            });

            if (resetError) throw resetError;

            showToast("Password reset link sent to your email!", "success");
            setShowForgotPassword(false);
        } catch (err: any) {
            setError(err.message || "Failed to send reset link");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050A10] flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#0B1219] rounded-[2.5rem] overflow-hidden p-12 lg:p-16 shadow-2xl border border-white/5 relative">
                {/* Background decorative elements */}
                <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-20%] left-[-20%] w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group text-xs font-bold uppercase tracking-widest">
                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>

                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">NegoPack <span className="text-blue-500">Pro</span></span>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {showForgotPassword ? "Reset Key" : "Welcome Back"}
                        </h2>
                        <p className="text-gray-400">
                            {showForgotPassword ? "Enter your email to receive a reset link" : "Sign in to continue to your dashboard"}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-3"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!showForgotPassword ? (
                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="work@company.com"
                                        className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-600 font-medium"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Encryption Key</label>
                                    <button
                                        type="button"
                                        onClick={() => { setShowForgotPassword(true); setError(null); }}
                                        className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest"
                                    >
                                        Forgot?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="Enter your key"
                                        className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-600 font-medium"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl mt-6 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 group disabled:opacity-50"
                            >
                                {loading ? "Signing In..." : "Sign In"}
                                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </button>

                            <div className="text-center mt-8">
                                <p className="text-gray-500 text-sm font-medium">
                                    New to NegoPack? <Link to="/signup" className="text-blue-500 font-bold hover:underline">Create Account</Link>
                                </p>
                            </div>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleResetPassword}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="work@company.com"
                                        className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-600 font-medium"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl mt-6 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 group disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </button>

                            <div className="text-center mt-8">
                                <button
                                    type="button"
                                    onClick={() => { setShowForgotPassword(false); setError(null); }}
                                    className="text-gray-500 text-sm font-bold hover:text-white transition-colors"
                                >
                                    Back to Login
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
