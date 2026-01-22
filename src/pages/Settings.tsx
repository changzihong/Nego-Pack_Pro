import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { User, Lock, Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

export const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();
    const [profile, setProfile] = useState<any>(null);
    const [fullName, setFullName] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(profile);
            setFullName(profile?.full_name || '');
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            // Update Name
            const { error: nameError } = await supabase
                .from('users')
                .update({ full_name: fullName })
                .eq('id', user.id);

            if (nameError) throw nameError;

            // Update Password if provided
            if (newPassword) {
                if (!oldPassword) {
                    throw new Error('Please enter your old password to set a new one');
                }
                if (newPassword !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }

                // Verify old password by attempting to sign in again (re-authentication)
                const { error: reAuthError } = await supabase.auth.signInWithPassword({
                    email: profile?.email,
                    password: oldPassword,
                });

                if (reAuthError) throw new Error('Incorrect old password');

                const { error: pwdError } = await supabase.auth.updateUser({
                    password: newPassword
                });
                if (pwdError) throw pwdError;
            }

            showToast('Settings updated successfully!', 'success');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            showToast(error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto p-10 font-sans">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
                <p className="text-gray-400">Manage your profile information and security</p>
            </header>

            <form onSubmit={handleUpdateProfile} className="space-y-8">

                <section className="bg-[#0B1219] rounded-2xl border border-white/5 p-8 space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-blue-500" />
                        Profile Information
                    </h3>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3.5 px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Email (Read-only)</label>
                        <input
                            type="email"
                            disabled
                            className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3.5 px-5 text-gray-500 focus:outline-none font-medium opacity-60 cursor-not-allowed"
                            value={profile?.email || ''}
                        />
                    </div>
                </section>

                <section className="bg-[#0B1219] rounded-2xl border border-white/5 p-8 space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <Lock className="w-5 h-5 text-blue-500" />
                        Security
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Current Password</label>
                            <div className="relative group">
                                <input
                                    type={showOldPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3.5 px-5 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                    value={oldPassword}
                                    onChange={e => setOldPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors"
                                >
                                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">New Password</label>
                                <div className="relative group">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3.5 px-5 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Confirm New Password</label>
                                <div className="relative group">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3.5 px-5 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
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
                    </div>
                    <p className="text-[10px] text-gray-600 font-medium italic">Leave password fields blank if you don't wish to change it.</p>
                </section>

                <div className="flex justify-end">
                    <motion.button
                        whileHover="hover"
                        initial="rest"
                        animate="rest"
                        type="submit"
                        disabled={saving}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 overflow-hidden cursor-pointer"
                    >
                        <div className="flex items-center justify-center w-5 h-5 shrink-0">
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        </div>
                        <motion.span
                            variants={{
                                rest: { width: 0, opacity: 0, marginLeft: 0 },
                                hover: { width: "auto", opacity: 1, marginLeft: 10, marginRight: 2 }
                            }}
                            className="text-sm font-bold whitespace-nowrap overflow-hidden"
                        >
                            Save All Changes
                        </motion.span>
                    </motion.button>
                </div>
            </form>
        </div>
    );
};
