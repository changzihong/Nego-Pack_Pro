import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ArrowLeft, Upload, Info, AlertCircle, Loader2, Save, Plus } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastProvider';

export const DealIntake = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const dealId = searchParams.get('id');

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentStatus, setCurrentStatus] = useState('draft');

    const [formData, setFormData] = useState({
        supplierId: '',
        title: '',
        scope: '',
        pricingModel: 'Fixed Fee',
        dealValue: '',
        deadline: '',
        keyIssues: '',
        desiredOutcomes: ''
    });

    useEffect(() => {
        fetchSuppliers();
        if (dealId) {
            fetchExistingDeal(dealId);
        }
    }, [dealId]);

    const fetchSuppliers = async () => {
        const { data } = await supabase.from('suppliers').select('id, name').order('name');
        setSuppliers(data || []);
    };

    const fetchExistingDeal = async (id: string) => {
        setFetching(true);
        try {
            const { data, error } = await supabase
                .from('deals')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            setFormData({
                supplierId: data.supplier_id,
                title: data.title,
                scope: data.scope,
                pricingModel: data.pricing_model,
                dealValue: data.deal_value?.toString() || '',
                deadline: data.deadline || '',
                keyIssues: data.key_issues,
                desiredOutcomes: data.desired_outcomes
            });
            setCurrentStatus(data.status);
            setIsEditing(true);


        } catch (err: any) {
            setError("Failed to load deal information.");
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async (generatePack: boolean) => {
        if (currentStatus === 'in_review' || currentStatus === 'approved') return;

        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            let supplierId = formData.supplierId;

            if (!supplierId) throw new Error("Please select a supplier");

            const payload = {
                owner_id: user.id,
                supplier_id: supplierId,
                title: formData.title,
                scope: formData.scope,
                pricing_model: formData.pricingModel,
                deal_value: formData.dealValue ? parseFloat(formData.dealValue) : null,
                deadline: formData.deadline || null,
                key_issues: formData.keyIssues,
                desired_outcomes: formData.desiredOutcomes,
                status: isEditing ? currentStatus : 'draft'
            };

            let result;
            if (isEditing) {
                result = await supabase
                    .from('deals')
                    .update(payload)
                    .eq('id', dealId)
                    .select()
                    .single();
            } else {
                result = await supabase
                    .from('deals')
                    .insert(payload)
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            if (generatePack) {
                navigate(`/pack/${result.data.id}`);
            } else {
                showToast("Deal saved as draft.", "success");
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || "Failed to save deal");
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = false;

    if (fetching) return (
        <div className="min-h-screen bg-[#050A10] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    return (
        <div className="p-10">
            <div className="max-w-4xl mx-auto pb-20">
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Link>

                <header className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-blue-600/10 text-blue-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Step 1</span>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4">{isEditing ? 'Edit Deal Information' : 'New Deal Intake'}</h1>
                    <p className="text-xl text-gray-400">Capture the essential details of your negotiation to generate an AI strategy pack.</p>
                </header>

                <AnimatePresence mode="wait">
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

                <div className={`bg-[#0B1219] rounded-[2rem] border border-white/5 p-10 shadow-2xl relative overflow-hidden ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] pointer-events-none" />

                    <form className="space-y-8 relative z-10" onSubmit={(e) => { e.preventDefault(); handleSave(true); }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    Supplier <Info className="w-3 h-3 text-gray-700" />
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 bg-[#161F2A] border border-white/5 rounded-xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                        value={formData.supplierId}
                                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                                        disabled={isDisabled}
                                        required
                                    >
                                        <option value="">Select a Supplier</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <Link
                                        to="/suppliers"
                                        className="bg-blue-600 hover:bg-blue-700 text-white w-14 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-500/20"
                                        title="Add new supplier"
                                    >
                                        <Plus className="w-6 h-6" />
                                    </Link>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Deal Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Cloud Infrastructure Renewal 2024"
                                    className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    disabled={isDisabled}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Scope of Negotiation</label>
                            <textarea
                                rows={4}
                                required
                                placeholder="What exactly are you negotiating? (e.g. 3-year term, specific service modules, support tiers)"
                                className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-5 px-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all resize-none font-medium leading-relaxed"
                                value={formData.scope}
                                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                                disabled={isDisabled}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Pricing Model</label>
                                <select
                                    className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                    value={formData.pricingModel}
                                    onChange={(e) => setFormData({ ...formData, pricingModel: e.target.value })}
                                    disabled={isDisabled}
                                >
                                    <option>Fixed Fee</option>
                                    <option>Time & Materials</option>
                                    <option>Usage-based</option>
                                    <option>Subscription</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Deal Value (RM)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 500000"
                                    className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                                    value={formData.dealValue}
                                    onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                                    disabled={isDisabled}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Target Deadline</label>
                                <input
                                    type="date"
                                    className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    disabled={isDisabled}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Key Issues & Challenges</label>
                                <textarea
                                    rows={3}
                                    required
                                    placeholder="List major hurdles or pain points..."
                                    className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-5 px-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all resize-none font-medium leading-relaxed"
                                    value={formData.keyIssues}
                                    onChange={(e) => setFormData({ ...formData, keyIssues: e.target.value })}
                                    disabled={isDisabled}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Desired Outcomes</label>
                                <textarea
                                    rows={3}
                                    required
                                    placeholder="What does success look like?..."
                                    className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-5 px-6 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all resize-none font-medium leading-relaxed"
                                    value={formData.desiredOutcomes}
                                    onChange={(e) => setFormData({ ...formData, desiredOutcomes: e.target.value })}
                                    disabled={isDisabled}
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-4">
                            {currentStatus === 'draft' && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    type="button"
                                    disabled={loading || isDisabled}
                                    onClick={() => handleSave(false)}
                                    className="group relative bg-white/5 hover:bg-white/10 text-white p-5 rounded-2xl flex items-center justify-center transition-all border border-white/10"
                                >
                                    <Save className="w-5 h-5" />
                                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                        Save as Draft
                                    </span>
                                </motion.button>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                type="submit"
                                disabled={loading || isDisabled}
                                className="group relative bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-blue-500/2"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Sparkles className="w-5 h-5 text-blue-200" />
                                )}
                                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    {loading ? 'Processing...' : (currentStatus === 'pack_generated' ? 'Update & View Strategy' : 'Process Strategy Pack')}
                                </span>
                            </motion.button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
