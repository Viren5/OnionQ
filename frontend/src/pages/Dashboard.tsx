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
} from 'lucide-react';
import { inspectionsApi } from '../api/inspections.api';
import type { Inspection } from '../types';

export const Dashboard: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await inspectionsApi.list();
        setInspections(res.data);
      } catch (err) {
        console.error('Failed to fetch inspections:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute summary stats
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
      case 'draft':
        return <span className="badge badge-gray">Draft</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-gray-900/95 to-amber-950/30 border border-amber-500/20 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            SIH 2026 AgriTech Solution
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Procurement Quality Control Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Automated computer vision quality inspection, Agmark grading, and human-in-the-loop verification for onion lots at procurement mandis.
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

      {/* KPI Metrics */}
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
              {(totalWeightKg / 1000).toFixed(2)} <span className="text-sm font-normal text-gray-400">MT</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">{totalOnions} bulbs</span> scanned across {inspections.length} lots
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Grade A (Premium)</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400">
              71.4%
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Optimal diameter (&gt;55mm), clean dry skin
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">URS (Under-Sized)</span>
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-yellow-400">
              20.2%
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Secondary commercial tier (35–55mm)
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Rejection Rate</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-red-400">
              8.4%
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Rotting, sprouting, severe cuts, or doubles
            </p>
          </div>
        </div>
      </div>

      {/* Visual Quality Breakdown & Agmark Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Proportion Bar */}
        <div className="card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <h2 className="text-base font-semibold text-white">Aggregated Lot Quality Distribution</h2>
              <p className="text-xs text-gray-400">Compliant with Indian Agmark Red Onion Classification 2024</p>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
              AGMARK-2024-STD
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden flex shadow-inner">
              <div style={{ width: '71.4%' }} className="bg-emerald-500 transition-all duration-500" title="Grade A: 71.4%" />
              <div style={{ width: '20.2%' }} className="bg-amber-500 transition-all duration-500" title="URS: 20.2%" />
              <div style={{ width: '8.4%' }} className="bg-red-500 transition-all duration-500" title="Rejected: 8.4%" />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
                <span className="text-gray-200 font-medium">Grade A (71.4%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-amber-500 shrink-0" />
                <span className="text-gray-200 font-medium">URS Secondary (20.2%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-red-500 shrink-0" />
                <span className="text-gray-200 font-medium">Rejections (8.4%)</span>
              </div>
            </div>
          </div>

          {/* Common Defects Identified */}
          <div className="pt-3 border-t border-gray-800">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Defect Distribution Across Sampled Lots
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50">
                <span className="text-[11px] text-gray-400 block">Sunburn / Scald</span>
                <span className="text-sm font-bold text-amber-300">11.9%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50">
                <span className="text-[11px] text-gray-400 block">Double / Twin Bulb</span>
                <span className="text-sm font-bold text-gray-200">7.1%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50">
                <span className="text-[11px] text-gray-400 block">Mechanical Cuts</span>
                <span className="text-sm font-bold text-gray-200">7.1%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50">
                <span className="text-[11px] text-gray-400 block">Sprouting / Rot</span>
                <span className="text-sm font-bold text-red-400">4.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Alert Callout */}
        <div className="card flex flex-col justify-between bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Human Verification Queue</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              The AI model identified <strong className="text-white">2 borderline bulbs</strong> in recent lots with prediction confidence under 75%. Human inspector review is needed before issuing quality certificates.
            </p>
            <div className="mt-4 p-3 rounded-lg bg-gray-800/70 border border-gray-700 text-xs text-gray-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Batch:</span>
                <span className="font-mono text-gray-200">LOT-2026-MH-4422</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Procurement:</span>
                <span>Pimpalgaon APMC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Suspected:</span>
                <span className="text-amber-400 font-medium">Split Scale & Peeling</span>
              </div>
            </div>
          </div>

          <Link
            to="/verification"
            className="btn btn-primary w-full mt-5 text-xs font-semibold justify-center shadow-md shadow-amber-500/10"
          >
            Enter Verification Workspace
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recent Inspection Batches Table */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Intake Batches</h2>
            <p className="text-xs text-gray-400">Active and recently graded onion lots at this mandi</p>
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
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Loading inspection batches...
                  </td>
                </tr>
              ) : inspections.map((insp) => (
                <tr key={insp._id} className="group">
                  <td className="font-mono text-xs font-semibold text-amber-400">
                    {insp.batchInfo.batchId}
                  </td>
                  <td className="text-xs text-gray-200">
                    {insp.batchInfo.procurementCentre}
                  </td>
                  <td>
                    <div className="text-xs font-medium text-gray-200">{insp.batchInfo.farmerName || 'Unknown'}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{insp.batchInfo.farmerCode || '-'}</div>
                  </td>
                  <td className="text-xs text-gray-300">
                    {insp.batchInfo.variety || 'Standard Red'}
                  </td>
                  <td className="text-xs font-medium text-gray-200">
                    {insp.batchInfo.approximateWeightKg ? insp.batchInfo.approximateWeightKg.toLocaleString() : '-'}
                  </td>
                  <td>
                    {getStatusBadge(insp.status)}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/inspections/${insp._id}`}
                        className="btn-ghost px-2.5 py-1 text-xs"
                        title="View Detection & Grading Canvas"
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
