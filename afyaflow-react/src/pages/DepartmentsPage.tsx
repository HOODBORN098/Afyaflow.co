import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import DashboardCard from '../components/ui/DashboardCard';
import SignatureButton from '../components/ui/SignatureButton';
import { useNotification } from '../context/NotificationContext';
import { departmentApi } from '../services/api';

/**
 * DEPARTMENTS PAGE
 * High-level administrative view of all clinical units.
 * Allows managing department configurations and viewing departmental statistics.
 */
const DepartmentsPage: React.FC = () => {
    const { departments, fetchDepartments } = useData();
    const { notify } = useNotification();
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        try {
            await departmentApi.create({ name: newName });
            notify('Department added successfully', 'success', 'Unit Created');
            setNewName('');
            setIsAdding(false);
            fetchDepartments();
        } catch (error) {
            notify('Failed to create department', 'error', 'Server Error');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this department?')) return;
        try {
            await departmentApi.delete(id);
            notify('Department removed', 'info', 'Unit Deleted');
            fetchDepartments();
        } catch (error) {
            notify('Cannot delete department with active staff or patients', 'error', 'Dependency Error');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-manrope">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-on-surface tracking-tight">Clinical Departments</h1>
                    <p className="text-on-surface-variant font-medium mt-1">Manage hospital units and specializations</p>
                </div>
                <SignatureButton icon="add_circle" onClick={() => setIsAdding(true)}>Add Department</SignatureButton>
            </div>

            {isAdding && (
                <DashboardCard className="p-6 border-primary/20 bg-primary/5">
                    <form onSubmit={handleAdd} className="flex gap-4">
                        <input 
                            autoFocus
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Department Name (e.g., Cardiology)"
                            className="flex-1 px-4 py-2 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20"
                        />
                        <SignatureButton type="submit" icon="check">Create</SignatureButton>
                        <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-on-surface-variant font-bold hover:underline">Cancel</button>
                    </form>
                </DashboardCard>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map(dept => (
                    <DashboardCard key={dept.id} className="p-6 group hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                                    <span className="material-symbols-outlined text-2xl">clinical_notes</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-on-surface">{dept.name}</h3>
                                    <p className="text-xs text-on-surface-variant font-medium">Unit ID: #{dept.id}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDelete(dept.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-error transition-all"
                            >
                                <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                        </div>
                    </DashboardCard>
                ))}
            </div>
        </div>
    );
};

export default DepartmentsPage;
