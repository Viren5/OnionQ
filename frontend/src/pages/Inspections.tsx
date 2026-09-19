import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ChevronRight,
  PlusCircle,
  Search,
  Filter,
  Eye,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { inspectionsApi } from '../api/inspections.api';
import type { Inspection, InspectionStatus } from '../types';

const STATUS_LABELS: Record<InspectionStatus, string> = {
  draft: 'Draft',
  images_uploaded: 'Images Ready',
  analysis_pending: 'Analysis Queued',
  analysis_in_progress: 'Analysis Running',
  analysis_complete: 'AI Complete',
  verification_pending: 'Pending Verification',
  verification_complete: 'Verified',
  report_generated: 'Report Ready',
  cancelled: 'Cancelled',
};

const STATUS_BADGE: Record<InspectionStatus, string> = {
  draft: 'badge-gray',
  images_uploaded: 'badge-gray',
  analysis_pending: 'badge-blue',
  analysis_in_progress: 'badge-amber',
  analysis_complete: 'badge-blue',
  verification_pending: 'badge-amber',
  verification_complete: 'badge-green',
  report_generated: 'badge-green',
  cancelled: 'badge-gray',
};

export const Inspections: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | ''>('');

  useEffect(() => {
    async function loadInspections() {
      try {
        const res = await inspectionsApi.list();
        setInspections(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load inspections.');
      } finally {
        setLoading(false);
      }
    }
    loadInspections();
  }, []);

  const filtered = inspections.filter((insp) => {
    const matchesSearch =
      !search ||
      insp.batchInfo.batchId.toLowerCase().includes(search.toLowerCase()) ||
      insp.batchInfo.procurementCentre.toLowerCase().includes(search.toLowerCase()) ||
      (insp.batchInfo.farmerName || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || insp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Batch Inspections</h1>
          <p className="text-xs text-gray-400 mt-1">All registered procurement lot inspections</p>
        </div>
        <Link to="/inspections/new" className="btn btn-primary text-xs shadow-lg shadow-amber-500/20">
          <PlusCircle className="w-4 h-4" />
          New Batch Intake
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by batch ID, mandi, farmer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-sm py-2"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InspectionStatus | '')}
            className="input pl-8 pr-6 text-sm py-2 appearance-none cursor-pointer"
          >
            <option value="">All Status</option>
            {(Object.keys(STATUS_LABELS) as InspectionStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load inspections</p>
            <p className="text-xs text-red-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Inspections Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Procurement Hub</th>
                <th>Farmer</th>
                <th>Variety</th>
                <th>Weight (Kg)</th>
                <th>AI Detected</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500 text-xs">
                    Fetching inspection records from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">No inspection batches found.</p>
                    {search || statusFilter ? (
                      <p className="text-xs text-gray-500 mt-1">Try changing your search filters.</p>
                    ) : (
                      <Link to="/inspections/new" className="text-xs text-amber-400 mt-2 inline-block hover:underline">
                        Register your first batch →
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((insp) => (
                  <tr key={insp._id} className="group">
                    <td className="font-mono text-xs font-bold text-amber-400">{insp.batchInfo.batchId}</td>
                    <td className="text-xs text-gray-200">{insp.batchInfo.procurementCentre}</td>
                    <td>
                      <div className="text-xs font-medium text-gray-200">{insp.batchInfo.farmerName || '—'}</div>
                      {insp.batchInfo.farmerCode && (
                        <div className="text-[10px] font-mono text-gray-500">{insp.batchInfo.farmerCode}</div>
                      )}
                    </td>
                    <td className="text-xs text-gray-300">{insp.batchInfo.variety || '—'}</td>
                    <td className="text-xs text-gray-200 font-medium">
                      {insp.batchInfo.approximateWeightKg?.toLocaleString() || '—'}
                    </td>
                    <td className="text-xs font-mono text-gray-200">
                      {insp.totalOnionsDetected && insp.totalOnionsDetected > 0
                        ? insp.totalOnionsDetected
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[insp.status]}`}>
                        {STATUS_LABELS[insp.status]}
                      </span>
                    </td>
                    <td className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(insp.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/inspections/${insp._id}`}
                          className="btn-ghost px-2.5 py-1 text-xs flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          Open
                        </Link>
                        {insp.status === 'report_generated' && (
                          <Link
                            to={`/reports/${insp._id}`}
                            className="btn-ghost px-2.5 py-1 text-xs flex items-center gap-1.5 text-emerald-400"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            Report
                          </Link>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-gray-500 transition-colors" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="text-xs text-gray-500 pt-3 border-t border-gray-800">
            Showing {filtered.length} of {inspections.length} inspection records from database
          </div>
        )}
      </div>
    </div>
  );
};
