import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  Eye,
  CheckCircle2,
  Clock,
  FileCheck,
  Package,
} from 'lucide-react';
import { inspectionsApi } from '../api/inspections.api';
import type { Inspection, InspectionStatus } from '../types';

export const InspectionsList: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchList() {
      try {
        const res = await inspectionsApi.list({
          status: statusFilter !== 'all' ? (statusFilter as InspectionStatus) : undefined,
          search: searchQuery || undefined,
        });
        setInspections(res.data);
      } catch (err) {
        console.error('Failed to load inspections:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchList();
  }, [statusFilter, searchQuery]);

  const getStatusBadge = (status: Inspection['status']) => {
    switch (status) {
      case 'report_generated':
        return <span className="badge badge-green"><CheckCircle2 className="w-3 h-3" /> Report Ready</span>;
      case 'verification_pending':
        return <span className="badge badge-amber"><Clock className="w-3 h-3" /> Verification Req.</span>;
      case 'analysis_complete':
        return <span className="badge badge-blue"><Eye className="w-3 h-3" /> Analyzed</span>;
      case 'draft':
        return <span className="badge badge-gray">Draft</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inspection Batches</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage procurement lots, view live detection canvases, and monitor Agmark certification status.
          </p>
        </div>

        <Link to="/inspections/new" className="btn btn-primary text-xs shadow-lg shadow-amber-500/20 shrink-0">
          <PlusCircle className="w-4 h-4" />
          Intake New Batch
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search LOT ID, farmer, or yard..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 text-xs py-2"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { label: 'All Batches', val: 'all' },
            { label: 'Analyzed', val: 'analysis_complete' },
            { label: 'Pending Verification', val: 'verification_pending' },
            { label: 'Report Ready', val: 'report_generated' },
            { label: 'Draft', val: 'draft' },
          ].map((tab) => (
            <button
              key={tab.val}
              type="button"
              onClick={() => setStatusFilter(tab.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.val
                  ? 'bg-amber-500 text-gray-950 font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inspections Table */}
      <div className="card space-y-4">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Batch LOT ID</th>
                <th>Procurement Yard</th>
                <th>Farmer Details</th>
                <th>Variety</th>
                <th>Sample Weight</th>
                <th>Detected Bulbs</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    Loading lots...
                  </td>
                </tr>
              ) : inspections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    No inspection batches found matching your filters.
                  </td>
                </tr>
              ) : (
                inspections.map((insp) => (
                  <tr key={insp._id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="font-mono text-xs font-semibold text-amber-400">
                      {insp.batchInfo.batchId}
                    </td>
                    <td className="text-xs text-gray-200">
                      {insp.batchInfo.procurementCentre}
                    </td>
                    <td>
                      <div className="text-xs font-medium text-gray-200">
                        {insp.batchInfo.farmerName || 'Unspecified'}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {insp.batchInfo.vehicleNumber ? `Veh: ${insp.batchInfo.vehicleNumber}` : ''}
                      </div>
                    </td>
                    <td className="text-xs text-gray-300">
                      {insp.batchInfo.variety || 'Standard Red'}
                    </td>
                    <td className="text-xs text-gray-300">
                      {insp.batchInfo.approximateWeightKg ? `${insp.batchInfo.approximateWeightKg.toLocaleString()} kg` : '-'}
                    </td>
                    <td className="text-xs font-mono text-gray-200">
                      {insp.totalOnionsDetected || 0}
                    </td>
                    <td>
                      {getStatusBadge(insp.status)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/inspections/${insp._id}`}
                          className="btn btn-secondary py-1 px-2.5 text-xs font-medium"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          Inspect
                        </Link>
                        {insp.status === 'report_generated' && (
                          <Link
                            to={`/reports/${insp._id}`}
                            className="btn btn-ghost py-1 px-2 text-xs text-emerald-400"
                            title="View Agmark Certificate"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
