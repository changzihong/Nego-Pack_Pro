import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Handshake, Users, LayoutDashboard, FileText, Settings, LogOut, ChevronRight, Mail, Phone, User, Tag, PlusCircle, Loader2, AlertCircle, Edit2, X, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ToastProvider';

export const Suppliers = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [addingSupplier, setAddingSupplier] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<any>(null);
    const [viewingHistory, setViewingHistory] = useState<any>(null);
    const [supplierDeals, setSupplierDeals] = useState<any[]>([]);
    const [dealsLoading, setDealsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);

    const [supplierForm, setSupplierForm] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        category: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
            setProfile(profile);

            const { data: suppliersData } = await supabase
                .from('suppliers')
                .select('*')
                .order('name');

            setSuppliers(suppliersData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSupplierHistory = async (supplier: any) => {
        setViewingHistory(supplier);
        setDealsLoading(true);
        try {
            const { data, error } = await supabase
                .from('deals')
                .select('*')
                .eq('supplier_id', supplier.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSupplierDeals(data || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setDealsLoading(false);
        }
    };

    const handleSaveSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            if (editingSupplier) {
                const { error } = await supabase
                    .from('suppliers')
                    .update(supplierForm)
                    .eq('id', editingSupplier.id);
                if (error) throw error;
                showToast('Supplier updated successfully!', 'success');
            } else {
                const { error } = await supabase.from('suppliers').insert([{
                    ...supplierForm,
                    owner_id: user.id
                }]);
                if (error) throw error;
                showToast('Supplier added successfully!', 'success');
            }

            setAddingSupplier(false);
            setEditingSupplier(null);
            setSupplierForm({ name: '', contact_person: '', email: '', phone: '', category: '' });
            fetchData();
        } catch (error: any) {
            console.error('Error saving supplier:', error);
            showToast(`Error: ${error.message}`, 'error');
        }
    };

    const startEdit = (supplier: any) => {
        setEditingSupplier(supplier);
        setSupplierForm({
            name: supplier.name || '',
            contact_person: supplier.contact_person || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            category: supplier.category || ''
        });
        setAddingSupplier(true);
    };



    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen bg-[#050A10] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-10 font-sans">
            <header className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Supplier Registry</h1>
                    <p className="text-gray-400">Manage your organization's list of strategic partners</p>
                </div>
                <motion.button
                    whileHover="hover"
                    initial="rest"
                    animate="rest"
                    onClick={() => {
                        setEditingSupplier(null);
                        setSupplierForm({ name: '', contact_person: '', email: '', phone: '', category: '' });
                        setAddingSupplier(true);
                    }}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 overflow-hidden cursor-pointer"
                >
                    <PlusCircle className="w-5 h-5 shrink-0" />
                    <motion.span
                        variants={{
                            rest: { width: 0, opacity: 0, marginLeft: 0 },
                            hover: { width: "auto", opacity: 1, marginLeft: 10, marginRight: 2 }
                        }}
                        className="text-xs font-bold whitespace-nowrap overflow-hidden uppercase tracking-widest"
                    >
                        Add New Supplier
                    </motion.span>
                </motion.button>
            </header>

            {/* Search */}
            <div className="mb-8 max-w-md">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input
                        type="text"
                        placeholder="Search by name or category..."
                        className="w-full bg-[#0B1219] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-gray-700"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Supplier Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.length === 0 ? (
                    <div className="col-span-full py-20 bg-[#0B1219] rounded-[2rem] border border-white/5 border-dashed flex flex-col items-center justify-center text-gray-600">
                        <Users className="w-12 h-12 mb-4 opacity-10" />
                        <p>No suppliers found matching your search.</p>
                    </div>
                ) : (
                    filteredSuppliers.map((supplier) => (
                        <motion.div
                            key={supplier.id}
                            layout
                            whileHover={{ scale: 1.02, y: -5 }}
                            onClick={() => startEdit(supplier)}
                            className="bg-[#0B1219] rounded-2xl border border-white/5 p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden cursor-pointer"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-all" />

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">{supplier.name}</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{supplier.category || 'Uncategorized'}</span>
                                </div>
                                <div className="w-10 h-10 bg-white/[0.03] rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                                    <Tag className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <User className="w-4 h-4 text-blue-500/40" />
                                    <span className="truncate">{supplier.contact_person || 'No contact person'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <Mail className="w-4 h-4 text-blue-500/40" />
                                    <span className="truncate">{supplier.email || 'No email registered'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <Phone className="w-4 h-4 text-blue-500/40" />
                                    <span>{supplier.phone || 'No phone number'}</span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 flex justify-end relative z-10">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fetchSupplierHistory(supplier);
                                    }}
                                    className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 group/btn"
                                >
                                    View Deal History
                                    <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Add/Edit Supplier Modal */}
            <AnimatePresence>
                {addingSupplier && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setAddingSupplier(false)}
                            className="absolute inset-0 bg-[#050A10]/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0B1219] rounded-3xl border border-white/10 p-10 shadow-3xl"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 italic">
                                {editingSupplier ? 'Update Supplier' : 'Enroll New Supplier'}
                            </h2>
                            <form onSubmit={handleSaveSupplier} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Supplier Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3.5 px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                        value={supplierForm.name}
                                        onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. IT"
                                            className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3.5 px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                            value={supplierForm.category}
                                            onChange={e => setSupplierForm({ ...supplierForm, category: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contact Person</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3.5 px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                            value={supplierForm.contact_person}
                                            onChange={e => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3.5 px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                        value={supplierForm.email}
                                        onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#161F2A] border border-white/5 rounded-xl py-3.5 px-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                        value={supplierForm.phone}
                                        onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                                    />
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <motion.button
                                        whileHover="hover"
                                        initial="rest"
                                        animate="rest"
                                        type="button"
                                        onClick={() => setAddingSupplier(false)}
                                        className="flex items-center justify-center bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl transition-all overflow-hidden cursor-pointer min-w-[50px]"
                                    >
                                        <X className="w-5 h-5 shrink-0" />
                                        <motion.span
                                            variants={{
                                                rest: { width: 0, opacity: 0, marginLeft: 0 },
                                                hover: { width: "auto", opacity: 1, marginLeft: 10, marginRight: 2 }
                                            }}
                                            className="text-xs font-bold whitespace-nowrap overflow-hidden uppercase tracking-widest"
                                        >
                                            Cancel
                                        </motion.span>
                                    </motion.button>
                                    <motion.button
                                        whileHover="hover"
                                        initial="rest"
                                        animate="rest"
                                        type="submit"
                                        className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 overflow-hidden cursor-pointer"
                                    >
                                        <Handshake className="w-5 h-5 shrink-0" />
                                        <motion.span
                                            variants={{
                                                rest: { width: 0, opacity: 0, marginLeft: 0 },
                                                hover: { width: "auto", opacity: 1, marginLeft: 10, marginRight: 2 }
                                            }}
                                            className="text-xs font-bold whitespace-nowrap overflow-hidden uppercase tracking-widest"
                                        >
                                            {editingSupplier ? 'Update Changes' : 'Save Supplier'}
                                        </motion.span>
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Deal History Modal */}
                {viewingHistory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingHistory(null)}
                            className="absolute inset-0 bg-[#050A10]/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-4xl bg-[#0B1219] rounded-[2.5rem] border border-white/10 p-10 shadow-3xl max-h-[85vh] overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-1">Supplier Portfolio</p>
                                    <h2 className="text-3xl font-bold text-white italic">{viewingHistory.name}</h2>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setViewingHistory(null)}
                                    className="group relative w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all"
                                >
                                    <X className="w-5 h-5" />
                                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                        Close
                                    </span>
                                </motion.button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                {dealsLoading ? (
                                    <div className="py-20 flex flex-col items-center gap-4">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                        <p className="text-gray-500 text-sm italic">Retrieving deal history...</p>
                                    </div>
                                ) : supplierDeals.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center gap-4 text-gray-600 italic">
                                        <Briefcase className="w-12 h-12 opacity-10" />
                                        <p>No historical deals found for this supplier.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {supplierDeals.map((deal) => (
                                            <div
                                                key={deal.id}
                                                className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-blue-500/20 transition-all group flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{deal.title}</h4>
                                                        <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                                            <span>{new Date(deal.created_at).toLocaleDateString()}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-800" />
                                                            <span>RM {Number(deal.deal_value || 0).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest ${deal.status === 'approved' || deal.status === 'meeting_done' ? 'bg-green-500/10 text-green-500' :
                                                        deal.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                            'bg-blue-500/10 text-blue-500'
                                                        }`}>
                                                        {deal.status.replace('_', ' ')}
                                                    </span>
                                                    <button
                                                        onClick={() => navigate(`/pack/${deal.id}`)}
                                                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-blue-600 transition-all"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
