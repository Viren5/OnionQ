import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  Award,
  Package,
  ArrowUpRight,
  PlusCircle,
  Eye,
  CheckCircle2,
  Clock,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { inspectionsApi } from '../api/inspections.api';
import type { Inspection } from '../types';

export const Dashboard: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await inspectionsApi.list();
        setInspections(res.data);
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Unable to reach backend. Ensure the API server is running.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute real summary stats from actual database records
  const totalWeightKg = inspections.reduce(
    (acc, curr) => acc + (curr.batchInfo.approximateWeightKg || 0),
    0
  );
  const totalOnions = inspections.reduce(
    (acc, curr) => acc + (curr.totalOnionsDetected || 0),
    0
  );
  const pendingCount = inspections.filter(
    (i) => i.status === 'verification_pending' || i.status === 'analysis_pending'
  ).length;

  const getStatusBadge = (status: Inspection['status']) => {
    switch (status) {
      case 'report_generated':
        return <span className="badge badge-green"><CheckCircle2 className="w-3 h-3" /> Report Ready</span>;
      case 'verification_pending':
        return <span className="badge badge-amber"><Clock className="w-3 h-3" /> Verification Req.</span>;
      case 'analysis_complete':
        return <span className="badge badge-blue"><Eye className="w-3 h-3" /> Analyzed</span>;
      case 'verification_complete':
        return <span className="badge badge-blue"><CheckCircle2 className="w-3 h-3" /> Verified</span>;
      case 'images_uploaded':
        return <span className="badge badge-gray">Images Uploaded</span>;
      case 'draft':
        return <span className="badge badge-gray">Draft</span>;
      default:
        return <span className="badge badge-gray">{status.replace(/_/g, ' ')}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-gray-900/95 to-amber-950/30 border border-amber-500/20 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            SIH 2026 AgriTech Solution
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Procurement Quality Control Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Automated computer vision quality inspection and human-in-the-loop verification for onion lots at procurement mandis.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/verification" className="btn btn-secondary text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Review Pending ({pendingCount})
          </Link>
          <Link to="/inspections/new" className="btn btn-primary text-xs shadow-lg shadow-amber-500/20">
            <PlusCircle className="w-4 h-4" />
            New Batch Intake
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to load dashboard data</p>
            <p className="text-xs text-red-300 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* KPI Metrics — all values calculated from real database records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Volume Sampled</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {loading ? '—' : (totalWeightKg / 1000).toFixed(2)}{' '}
              <span className="text-sm font-normal text-gray-400">MT</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {loading ? '' : (
                <>
                  <span className="text-emerald-400 font-semibold">{totalOnions} bulbs</span>{' '}
                  scanned across {inspections.length} lots
                </>
              )}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Active Batches</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400">
              {loading ? '—' : inspections.filter(i =>
                i.status !== 'cancelled' && i.status !== 'report_generated'
              ).length}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Batches in active inspection workflow
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Pending Verification</span>
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-yellow-400">
              {loading ? '—' : pendingCount}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Batches awaiting human inspector review
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Reports Issued</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-400">
              {loading ? '—' : inspections.filter(i => i.status === 'report_generated').length}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Quality certificates generated
            </p>
          </div>
        </div>
      </div>

      {/* Recent Inspection Batches Table */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Intake Batches</h2>
            <p className="text-xs text-gray-400">Active and recently graded onion lots</p>
          </div>
          <Link to="/inspections" className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1">
            View All ({inspections.length})
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Batch LOT ID</th>
                <th>Procurement Yard</th>
                <th>Farmer / Supplier</th>
                <th>Variety</th>
                <th>Weight (Kg)</th>
                <th>AI Detections</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    Loading inspection batches...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-red-400 text-xs">
                    Failed to load data. Check backend connection and try again.
                  </td>
                </tr>
              ) : inspections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p>No inspection batches found.</p>
                    <p className="text-xs mt-1 text-gray-500">
                      <Link to="/inspections/new" className="text-amber-400 hover:underline">Create your first batch inspection →</Link>
                    </p>
                  </td>
                </tr>
              ) : (
                inspections.slice(0, 10).map((insp) => (
                  <tr key={insp._id} className="group">
                    <td className="font-mono text-xs font-semibold text-amber-400">
                      {insp.batchInfo.batchId}
                    </td>
                    <td className="text-xs text-gray-200">
                      {insp.batchInfo.procurementCentre}
                    </td>
                    <td>
                      <div className="text-xs font-medium text-gray-200">{insp.batchInfo.farmerName || '—'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{insp.batchInfo.farmerCode || ''}</div>
                    </td>
                    <td className="text-xs text-gray-300">
                      {insp.batchInfo.variety || '—'}
                    </td>
                    <td className="text-xs font-medium text-gray-200">
                      {insp.batchInfo.approximateWeightKg
                        ? insp.batchInfo.approximateWeightKg.toLocaleString()
                        : '—'}
                    </td>
                    <td className="text-xs font-mono text-gray-200">
                      {insp.totalOnionsDetected !== undefined && insp.totalOnionsDetected > 0
                        ? insp.totalOnionsDetected
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td>{getStatusBadge(insp.status)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/inspections/${insp._id}`}
                          className="btn-ghost px-2.5 py-1 text-xs"
                          title="View Inspection"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          Inspect
                        </Link>
                        {insp.status === 'report_generated' && (
                          <Link
                            to={`/reports/${insp._id}`}
                            className="btn-ghost px-2 py-1 text-xs text-emerald-400"
                            title="View Certificate"
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
