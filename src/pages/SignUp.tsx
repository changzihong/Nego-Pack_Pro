import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, User, Building2, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastProvider';

export const SignUp = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: 'admin',
        password: '',
        confirmPassword: ''
    });

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: formData.role
                    },
                    emailRedirectTo: `${window.location.origin}/login`
                }
            });

            if (signUpError) throw signUpError;

            if (data.user) {
                showToast("Account created! Please check your email for verification.", "success");
                navigate('/login');
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during sign up");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050A10] flex items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-[#0B1219] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/5 max-h-[95vh]">

                {/* Left Side - Branding */}
                <div className="md:w-[42%] bg-gradient-to-br from-[#2D5CFE] via-[#4F46E5] to-[#7C3AED] p-12 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-black/20 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-8 border border-white/30"
                        >
                            <Shield className="w-6 h-6 text-white" />
                        </motion.div>

                        <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                            Elevate Your<br />Negotiation<br />Workflow
                        </h1>

                        <p className="text-blue-100 text-lg mb-10 font-light">
                            Join the elite network of procurement professionals using AI-driven strategic planning to close better deals.
                        </p>

                        <div className="space-y-4">
                            {[
                                "AI-Powered Strategy",
                                "Admin Approval Flow",
                                "Stakeholder Alignment"
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-3 text-sm font-medium">
                                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                    </div>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 relative z-10 font-sans">
                        <div className="text-[10px] font-bold tracking-[0.2em] text-blue-200 mb-2 uppercase">Platform Status</div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            Systems Operational • PDPA Compliant
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="flex-1 p-10 lg:p-12 flex flex-col justify-center overflow-y-auto">
                    <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 group text-xs font-bold uppercase tracking-widest">
                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>

                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                        <p className="text-gray-400">Enter your details to get started with NegoPack Pro</p>
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

                    <form className="space-y-5" onSubmit={handleSignUp}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. John Doe"
                                        className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 hidden">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Account Role</label>
                                <div className="relative group">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    <input type="hidden" value="admin" />
                                </div>
                            </div>



                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="work@company.com"
                                        className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="Password"
                                        className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3 pl-11 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Verify Key</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        placeholder="Confirm"
                                        className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3 pl-11 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 mt-4">
                            <input
                                type="checkbox"
                                id="terms"
                                required
                                className="mt-1.5 w-4 h-4 rounded bg-[#161F2A] border-white/10 text-blue-500 focus:ring-blue-500/20 focus:ring-offset-0"
                            />
                            <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed">
                                I agree to the <Link to="/terms" className="text-blue-500 hover:underline cursor-pointer font-bold">Terms of Service</Link> and confirm that I am an authorized employee of my organization.
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl mt-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 group disabled:opacity-50"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </button>

                        <div className="text-center mt-6">
                            <p className="text-gray-500 text-sm">
                                Existing account? <Link to="/login" className="text-blue-500 font-semibold hover:underline">Sign In Here</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
