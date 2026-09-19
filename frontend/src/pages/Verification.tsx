import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  X,
  Eye,
  ChevronRight,
  Scan,
  AlertCircle,
} from 'lucide-react';
import { verificationApi } from '../api/verification.api';
import type { OnionAnalysis } from '../types';

export const Verification: React.FC = () => {
  const [pending, setPending] = useState<OnionAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null); // onionId being actioned

  useEffect(() => {
    async function loadPending() {
      try {
        const res = await verificationApi.listPending();
        setPending(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load verification queue.');
      } finally {
        setLoading(false);
      }
    }
    loadPending();
  }, []);

  const handleDecision = async (onion: OnionAnalysis, decision: 'confirm_ai' | 'override') => {
    setSubmitting(onion._id);
    try {
      await verificationApi.submitDecision(
        onion._id,
        decision,
        decision === 'override' ? 'rejected' : undefined
      );
      setPending((prev) => prev.filter((o) => o._id !== onion._id));
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit decision.';
      alert(msg);
    } finally {
      setSubmitting(null);
    }
  };

  const getConditionColor = (onion: OnionAnalysis) => {
    const grade = onion.aiClassificationGrade?.toLowerCase() || '';
    if (grade.startsWith('healthy')) return 'text-emerald-400';
    if (grade.startsWith('mold') || grade.startsWith('rotten') || grade.startsWith('sprouted')) return 'text-red-400';
    return 'text-blue-400';
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Verification Queue</h1>
          <p className="text-xs text-gray-400 mt-1">
            Onion detections that require manual inspector review before report finalisation.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold">
          <Scan className="w-4 h-4" />
          {loading ? '—' : pending.length} Pending
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error loading verification queue</p>
            <p className="text-xs mt-0.5 text-red-300">{error}</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Sequence ID</th>
                <th>AI Label</th>
                <th>Confidence</th>
                <th>Defect Flags</th>
                <th>Inspection</th>
                <th className="text-center">Decision</th>
                <th className="text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 text-xs">
                    Loading verification queue from database...
                  </td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Check className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                    <p className="text-sm font-semibold">Verification queue is empty</p>
                    <p className="text-xs mt-1 text-gray-500">All AI detections have been reviewed.</p>
                  </td>
                </tr>
              ) : (
                pending.map((onion) => (
                  <tr key={onion._id} className="group">
                    <td className="font-mono text-xs font-bold text-amber-400">
                      {onion.onionSequenceId}
                    </td>
                    <td>
                      <span className={`text-xs font-semibold ${getConditionColor(onion)}`}>
                        {onion.aiClassificationGrade || onion.classification.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-gray-300">
                      {(onion.detectionConfidence * 100).toFixed(1)}%
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {onion.detectedDefects.map((def, i) => (
                          <span
                            key={i}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              def === 'none'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {def.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-xs text-gray-400 font-mono">
                      <Link
                        to={`/inspections/${onion.inspectionId}`}
                        className="text-amber-400 hover:underline"
                      >
                        {onion.inspectionId.substring(0, 8)}...
                      </Link>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={submitting === onion._id}
                          onClick={() => handleDecision(onion, 'confirm_ai')}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Confirm
                        </button>
                        <button
                          type="button"
                          disabled={submitting === onion._id}
                          onClick={() => handleDecision(onion, 'override')}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Override
                        </button>
                      </div>
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/inspections/${onion.inspectionId}`}
                        className="btn-ghost px-2.5 py-1.5 text-xs flex items-center gap-1 justify-end"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        Open
                        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                      </Link>
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
