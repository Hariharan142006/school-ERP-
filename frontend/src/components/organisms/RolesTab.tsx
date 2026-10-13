import React, { useState, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { Plus, Trash2, Edit, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import { RoleModal, SECTIONS } from './RoleModal';

export const RolesTab = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedRole, setSelectedRole] = useState<any>(null);

  const fetchRoles = async () => {
    try {
      const res = await api.get('/api/roles');
      setRoles(res.data);
    } catch (error) {
      console.error('Failed to fetch roles', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      try {
        await api.delete(`/api/roles/${id}`);
        fetchRoles();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to delete role');
      }
    }
  };

  const handleOpenModal = (mode: 'add' | 'edit', role: any = null) => {
    setModalMode(mode);
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Custom Roles</h2>
          <p className="text-slate-500 text-sm">Create and manage custom roles with specific section access.</p>
        </div>
        <Button onClick={() => handleOpenModal('add')}>
          <Plus className="w-4 h-4 mr-2" /> Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-800">No custom roles</p>
            <p className="text-slate-500">Create your first custom role to get started.</p>
          </div>
        ) : (
          roles.map((role, i) => (
            <motion.div key={role._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-900">{role.name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal('edit', role)} className="text-slate-400 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(role._id)} className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-500 mb-2">Accessible Sections ({role.permissions?.length || 0})</p>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions?.slice(0, 6).map((p: string) => {
                    const label = SECTIONS.find(s => s.id === p)?.label || p.split('/').pop() || p;
                    return (
                      <span key={p} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-md border border-purple-100">
                        {label}
                      </span>
                    );
                  })}
                  {(role.permissions?.length || 0) > 6 && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">+{role.permissions.length - 6} more</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <RoleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchRoles} mode={modalMode} initialData={selectedRole} />
    </div>
  );
};
