import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  AlertTriangle,
  Scan,
  BarChart3,
  FileCheck,
  QrCode,
  AlertCircle,
  Printer,
} from 'lucide-react';
import { reportsApi } from '../api/reports.api';
import type { Report, DistributionEntry } from '../types';

const getGradeInfo = (grade: string) => {
  switch (grade) {
    case 'grade_a':
      return { label: 'Grade A — High Quality', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    case 'urs':
      return { label: 'Unclassified / Marginal', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    case 'rejected':
      return { label: 'Rejected — Below Standard', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
    case 'mixed':
      return { label: 'Mixed Grade Lot', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' };
    default:
      return { label: 'Grade Pending Official Verification', color: 'text-gray-400', bg: 'bg-gray-800 border-gray-700' };
  }
};

const DistBar: React.FC<{ entries: DistributionEntry[] }> = ({ entries }) => {
  const colors = ['bg-emerald-500', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-gray-500'];
  return (
    <div className="space-y-2.5">
      {entries.map((entry, idx) => (
        <div key={entry.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-200 font-medium capitalize">{entry.label.replace(/_/g, ' ')}</span>
            <span className="font-mono text-gray-300">
              {entry.count} <span className="text-gray-500">({entry.percentage.toFixed(1)}%)</span>
            </span>
          </div>
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${colors[idx % colors.length]} transition-all duration-700`}
              style={{ width: `${entry.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export const QualityReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      if (!id) return;
      try {
        const res = await reportsApi.getByInspection(id);
        setReport(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load quality report.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-500 text-sm">
        Loading quality certificate...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Report not available</p>
            <p className="text-xs mt-1 text-red-300">
              {error || 'No report found for this inspection. Run AI analysis and generate a certificate first.'}
            </p>
            <Link to="/inspections" className="text-xs text-amber-400 mt-3 inline-block hover:underline">
              ← Back to Inspections
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { summary } = report;
  const gradeInfo = getGradeInfo(summary.finalGrade);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/inspections/${report.inspectionId}`}
            className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-400" />
              <h1 className="text-xl font-bold text-white">Quality Analysis Certificate</h1>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Generated on {new Date(report.createdAt).toLocaleString('en-IN')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-secondary text-xs"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* Final Grade Result */}
      <div className={`flex items-center justify-between p-5 rounded-xl border ${gradeInfo.bg}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gray-950/40">
            <Award className={`w-7 h-7 ${gradeInfo.color}`} />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 block">
              FINAL QUALITY DETERMINATION
            </span>
            <span className={`text-2xl font-extrabold tracking-tight ${gradeInfo.color}`}>
              {gradeInfo.label}
            </span>
            {summary.finalGrade === 'not_graded' && (
              <p className="text-xs text-gray-400 mt-1">
                Automatic AGMARK grading rules have not been configured. Grade determined by authorised inspector.
              </p>
            )}
          </div>
        </div>
        {report.qrVerificationToken && (
          <div className="flex flex-col items-center gap-1 shrink-0">
            <QrCode className="w-10 h-10 text-gray-400" />
            <span className="text-[10px] text-gray-500">Verify QR</span>
          </div>
        )}
      </div>

      {/* Summary Stats — all from real analysis data */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card py-3 text-center">
          <div className="text-2xl font-bold text-white">{summary.totalOnionsDetected}</div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">Onions Scanned</div>
        </div>
        <div className="card py-3 text-center">
          <div className="text-2xl font-bold text-white">{summary.totalOnionsVerified}</div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">Verified by Inspector</div>
        </div>
        <div className="card py-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {summary.classificationDistribution
              .find((d) => d.label === 'grade_a' || d.label === 'healthy')
              ?.percentage.toFixed(1) || '0'}%
          </div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">Healthy / Grade A</div>
        </div>
        <div className="card py-3 text-center">
          <div className="text-2xl font-bold text-amber-400">
            {summary.averageAiConfidence
              ? `${(summary.averageAiConfidence * 100).toFixed(1)}%`
              : '—'}
          </div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">Avg. AI Confidence</div>
        </div>
      </div>

      {/* Distribution Breakdowns — from real MongoDB aggregation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Classification</h2>
          </div>
          {summary.classificationDistribution.length > 0 ? (
            <DistBar entries={summary.classificationDistribution} />
          ) : (
            <p className="text-xs text-gray-500">No classification data available.</p>
          )}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Defect Flags</h2>
          </div>
          {summary.defectDistribution.length > 0 ? (
            <DistBar entries={summary.defectDistribution} />
          ) : (
            <p className="text-xs text-gray-500">No defect distribution data recorded.</p>
          )}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <Scan className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Size Distribution</h2>
          </div>
          {summary.sizeDistribution.length > 0 ? (
            <DistBar entries={summary.sizeDistribution} />
          ) : (
            <p className="text-xs text-gray-500 italic">
              Size classification not yet supported.<br />
              Diameter estimation requires calibrated camera setup.
            </p>
          )}
        </div>
      </div>

      {/* Grading Standards Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-amber-400">
          <BarChart3 className="w-4 h-4" />
          Grading Standards Disclosure
        </div>
        <p>
          Automatic AGMARK / BIS grade thresholds have not been configured in this deployment.
          The quality determination above is based on raw AI detection results (healthy / mold / rotten / sprouted)
          and may be overridden by an authorised field inspector.
        </p>
        <p className="text-amber-300/60">
          Final acceptance or rejection decisions must be confirmed by a NAFED/NCCF/APMC-authorised quality inspector.
        </p>
        {report.summary.gradingRuleSnapshot && (
          <p className="text-emerald-300 font-mono text-[11px]">
            Rule Set: {report.summary.gradingRuleSnapshot.standardName} (v{report.summary.gradingRuleSnapshot.ruleVersion})
          </p>
        )}
      </div>
    </div>
  );
};
