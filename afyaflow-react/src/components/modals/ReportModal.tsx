import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import DashboardCard from '../ui/DashboardCard';
import SignatureButton from '../ui/SignatureButton';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportModalProps {
    onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ onClose }) => {
    const { patients, appointments, doctors, inventory, auditLogs } = useData();
    const [reportType, setReportType] = useState('patients');
    const [dateRange, setDateRange] = useState('today');
    const [searchQuery, setSearchQuery] = useState('');
    const [exportFormat, setExportFormat] = useState('pdf');

    const getReportData = () => {
        switch (reportType) {
            case 'patients':
                return {
                    title: 'Patient Report',
                    data: patients,
                    stats: [
                        { label: 'Total Registered', value: patients.length, icon: 'group', color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'In Queue', value: patients.filter(p => p.status === 'queued').length, icon: 'hourglass_empty', color: 'text-warning', bg: 'bg-warning/10' },
                        { label: 'In Progress', value: patients.filter(p => p.status === 'in-progress').length, icon: 'medical_services', color: 'text-info', bg: 'bg-info/10' },
                        { label: 'Admitted', value: patients.filter(p => p.status === 'admitted').length, icon: 'local_hospital', color: 'text-error', bg: 'bg-error/10' },
                    ]
                };
            case 'appointments':
                return {
                    title: 'Appointment Report',
                    data: appointments,
                    stats: [
                        { label: 'Total Appointments', value: appointments.length, icon: 'calendar_today', color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, icon: 'check_circle', color: 'text-success', bg: 'bg-success/10' },
                        { label: 'Upcoming', value: appointments.filter(a => a.status === 'upcoming').length, icon: 'schedule', color: 'text-warning', bg: 'bg-warning/10' },
                        { label: 'Cancelled', value: appointments.filter(a => a.status === 'cancelled').length, icon: 'cancel', color: 'text-error', bg: 'bg-error/10' },
                    ]
                };
            case 'doctors':
                return {
                    title: 'Doctor Report',
                    data: doctors,
                    stats: [
                        { label: 'Total Doctors', value: doctors.length, icon: 'badge', color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Available', value: doctors.filter(d => d.status === 'available').length, icon: 'check_circle', color: 'text-success', bg: 'bg-success/10' },
                        { label: 'On Call', value: doctors.filter(d => d.status === 'on-call').length, icon: 'phone', color: 'text-warning', bg: 'bg-warning/10' },
                        { label: 'In Surgery', value: doctors.filter(d => d.status === 'in-surgery').length, icon: 'surgical', color: 'text-error', bg: 'bg-error/10' },
                    ]
                };
            case 'inventory':
                return {
                    title: 'Inventory Report',
                    data: inventory,
                    stats: [
                        { label: 'Total Items', value: inventory.length, icon: 'inventory_2', color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Low Stock', value: inventory.filter(i => i.quantity <= i.reorderLevel && i.quantity > 0).length, icon: 'warning', color: 'text-warning', bg: 'bg-warning/10' },
                        { label: 'Out of Stock', value: inventory.filter(i => i.quantity === 0).length, icon: 'error', color: 'text-error', bg: 'bg-error/10' },
                        { label: 'In Stock', value: inventory.filter(i => i.quantity > i.reorderLevel).length, icon: 'check', color: 'text-success', bg: 'bg-success/10' },
                    ]
                };
            case 'logs':
                return {
                    title: 'Audit Logs Report',
                    data: auditLogs || [],
                    stats: [
                        { label: 'Total Actions', value: auditLogs?.length || 0, icon: 'assignment', color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Today\'s Logs', value: auditLogs?.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length || 0, icon: 'schedule', color: 'text-info', bg: 'bg-info/10' },
                        { label: 'This Week', value: auditLogs?.filter(l => {
                            const logDate = new Date(l.timestamp);
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            return logDate >= weekAgo;
                        }).length || 0, icon: 'calendar_month', color: 'text-secondary', bg: 'bg-secondary/10' },
                        { label: 'Total Users', value: new Set(auditLogs?.map(l => l.actorUsername) || []).size, icon: 'people', color: 'text-warning', bg: 'bg-warning/10' },
                    ]
                };
            default:
                return { title: 'Report', data: [], stats: [] };
        }
    };

    const filteredData = useMemo(() => {
        const reportData = getReportData();
        if (!searchQuery) return reportData.data;

        return reportData.data.filter((item: any) => {
            const searchStr = searchQuery.toLowerCase();
            return Object.values(item).some(value => {
                if (typeof value === 'string') return value.toLowerCase().includes(searchStr);
                if (typeof value === 'number') return value.toString().includes(searchStr);
                return false;
            });
        });
    }, [reportType, searchQuery]);

    const exportToCSV = () => {
        const reportData = getReportData();
        const data = searchQuery ? filteredData : reportData.data;
        
        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const rows = data.map((item: any) => 
            headers.map(h => {
                const val = item[h];
                if (typeof val === 'object') return JSON.stringify(val);
                return String(val);
            })
        );

        let csv = headers.join(',') + '\n';
        csv += rows.map((row: any) => row.map((v: string) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const exportToJSON = () => {
        const reportData = getReportData();
        const data = searchQuery ? filteredData : reportData.data;

        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        const json = JSON.stringify({
            reportType: reportType,
            generatedAt: new Date().toISOString(),
            dateRange: dateRange,
            data: data
        }, null, 2);

        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const generatePDF = () => {
        const reportData = getReportData();
        const data = searchQuery ? filteredData : reportData.data;
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(15, 78, 63);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("AfyaFlow Medical System", 15, 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 30);
        doc.text(`Period: ${dateRange.toUpperCase()}${searchQuery ? ` | Search: "${searchQuery}"` : ''}`, 15, 35);

        // Title
        doc.setTextColor(15, 78, 63);
        doc.setFontSize(18);
        doc.text(reportData.title, 15, 55);

        // Stats Summary
        let y = 70;
        reportData.stats.forEach((stat) => {
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(stat.label, 15, y);
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(String(stat.value), 15, y + 5);
            y += 15;
        });

        // Data Table
        if (data.length > 0) {
            const headers = Object.keys(data[0]).slice(0, 6);
            const rows = data.map(item => 
                headers.map(header => {
                    const val = (item as any)[header];
                    return typeof val === 'object' ? '...' : String(val).slice(0, 30);
                })
            );

            autoTable(doc, {
                startY: y + 10,
                head: [headers.map(h => h.toUpperCase())],
                body: rows,
                theme: 'striped',
                headStyles: { fillColor: [15, 78, 63] },
                alternateRowStyles: { fillColor: [245, 245, 245] }
            });
        }

        doc.save(`${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const reportData = getReportData();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                <DashboardCard noPadding className="flex-1 flex flex-col shadow-2xl border-outline-variant/20 bg-white overflow-hidden">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                                <span className="material-symbols-outlined text-2xl">analytics</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-primary tracking-tight">Advanced Reports</h2>
                                <p className="text-xs text-on-surface-variant font-medium mt-0.5">Analytics, export & system insights</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors text-on-surface-variant"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 p-8 space-y-8 custom-scrollbar">
                        {/* Config Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest pl-1">Data Source</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['patients', 'appointments', 'doctors', 'inventory', 'logs'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setReportType(type)}
                                            className={`px-4 py-3 rounded-xl capitalize transition-all font-bold text-xs border-2 ${
                                                reportType === type
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-outline-variant/20 bg-white text-on-surface hover:border-primary/30'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest pl-1">Time Period</label>
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-container-low border-2 border-transparent focus:border-primary/20 rounded-xl outline-none font-bold text-sm text-on-surface cursor-pointer transition-all"
                                >
                                    <option value="today">Today</option>
                                    <option value="week">Past 7 Days</option>
                                    <option value="month">Past 30 Days</option>
                                    <option value="all">All Time</option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest pl-1">Export Format</label>
                                <select
                                    value={exportFormat}
                                    onChange={(e) => setExportFormat(e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-container-low border-2 border-transparent focus:border-primary/20 rounded-xl outline-none font-bold text-sm text-on-surface cursor-pointer transition-all"
                                >
                                    <option value="pdf">PDF</option>
                                    <option value="csv">CSV</option>
                                    <option value="json">JSON</option>
                                </select>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                            <input
                                type="text"
                                placeholder="Search within report data..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-2 border-transparent focus:border-primary/20 rounded-xl outline-none text-sm transition-all"
                            />
                            {searchQuery && (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">
                                    {filteredData.length} results
                                </span>
                            )}
                        </div>

                        {/* Preview Section */}
                        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 space-y-4">
                            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                                Report Preview
                            </h3>
                            
                            {/* KPI Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {reportData.stats.map((stat, index) => (
                                    <div key={index} className="bg-white border border-outline-variant/10 rounded-2xl p-4 shadow-sm">
                                        <div className={`w-10 h-10 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center mb-2`}>
                                            <span className="material-symbols-outlined text-[18px]">
                                                {stat.icon}
                                            </span>
                                        </div>
                                        <p className="text-2xl font-black text-on-surface mb-0.5">{stat.value}</p>
                                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Data Table Snippet */}
                            <div className="rounded-xl border border-outline-variant/10 overflow-hidden bg-white max-h-64 overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-surface-container-low sticky top-0">
                                        <tr>
                                            {filteredData.length > 0 && Object.keys(filteredData[0]).slice(0, 4).map((key) => (
                                                <th key={key} className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/10 text-xs">
                                        {filteredData.slice(0, 5).map((item: any, index: number) => (
                                            <tr key={index} className="hover:bg-primary/5 transition-colors">
                                                {Object.values(item).slice(0, 4).map((value: any, i: number) => (
                                                    <td key={i} className="px-4 py-2 font-medium text-on-surface truncate">
                                                        {typeof value === 'object' ? JSON.stringify(value).slice(0, 20) : String(value).slice(0, 30)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredData.length === 0 && (
                                    <div className="p-8 text-center text-sm font-bold text-on-surface-variant">
                                        No data available
                                    </div>
                                )}
                                {filteredData.length > 5 && (
                                    <div className="p-3 text-center text-xs font-bold text-on-surface-variant bg-surface-container-lowest border-t">
                                        Showing 5 of {filteredData.length} records
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-6 border-t border-outline-variant/10 bg-surface-container-lowest flex justify-end gap-4 flex-wrap">
                        <SignatureButton variant="clear" onClick={onClose}>
                            Cancel
                        </SignatureButton>
                        {exportFormat === 'csv' && (
                            <SignatureButton icon="download" onClick={exportToCSV}>
                                Download CSV
                            </SignatureButton>
                        )}
                        {exportFormat === 'json' && (
                            <SignatureButton icon="download" onClick={exportToJSON}>
                                Download JSON
                            </SignatureButton>
                        )}
                        {exportFormat === 'pdf' && (
                            <SignatureButton icon="picture_as_pdf" onClick={generatePDF}>
                                Download PDF
                            </SignatureButton>
                        )}
                    </div>
                </DashboardCard>
            </div>
        </div>
    );
};

export default ReportModal;