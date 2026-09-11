import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  Award,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { verificationApi } from '../api/verification.api';
import type { OnionAnalysis, OnionClassification } from '../types';

export const VerificationQueue: React.FC = () => {
  const [pendingItems, setPendingItems] = useState<OnionAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [reasonMap, setReasonMap] = useState<Record<string, string>>({});
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    async function loadPending() {
      try {
        const res = await verificationApi.listPending();
        setPendingItems(res.data);
      } catch (err) {
        console.error('Failed to load verification queue:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPending();
  }, []);

  const handleDecision = async (
    onion: OnionAnalysis,
    decision: 'confirm_ai' | 'override',
    newClass?: OnionClassification
  ) => {
    const reason = reasonMap[onion._id] || (decision === 'confirm_ai' ? 'Confirmed by visual inspection' : 'Overridden based on physical skin scale assessment');

    try {
      await verificationApi.submitDecision(onion._id, decision, newClass, reason);
      // Remove from pending list
      setPendingItems((prev) => prev.filter((item) => item._id !== onion._id));
      setProcessedCount((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to submit verification decision:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Human-in-the-Loop Verification Queue
            </h1>
            <span className="badge badge-amber">
              {pendingItems.length} Pending Review
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Review borderline or low-confidence AI classifications before certifying Agmark quality compliance.
          </p>
        </div>

        {processedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{processedCount} Bulb(s) Verified This Session</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">
          Loading pending verifications...
        </div>
      ) : pendingItems.length === 0 ? (
        <div className="card text-center py-16 space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckSquare className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Verification Queue is Clear!</h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            All AI classifications meet high-confidence quality thresholds. You can proceed to generate final Agmark certificates for active batches.
          </p>
          <div className="pt-2">
            <Link to="/inspections" className="btn btn-primary text-xs">
              Back to Inspection Batches
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingItems.map((onion) => (
            <div
              key={onion._id}
              className="card grid grid-cols-1 md:grid-cols-3 gap-6 hover:border-gray-700 transition-colors"
            >
              {/* Left Column: Visual Crop */}
              <div className="flex flex-col justify-between space-y-3">
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black/60 border border-gray-800">
                  <img
                    src={onion.sourceImageReference}
                    alt={`Bulb ${onion.onionSequenceId}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-gray-950/90 text-amber-400 font-mono text-xs font-bold px-2 py-0.5 rounded border border-amber-500/20">
                    {onion.onionSequenceId}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-gray-950/90 text-gray-200 font-mono text-[10px] px-2 py-0.5 rounded">
                    Ø {onion.sizeEstimate?.diameterMm?.toFixed(1) || '48.0'} mm
                  </div>
                </div>

                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Inspection Ref:</span>
                    <span className="font-mono text-gray-300">{onion.inspectionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shape Profile:</span>
                    <span className="text-gray-300 capitalize">{onion.shape || 'Globe'}</span>
                  </div>
                </div>
              </div>

              {/* Middle Column: AI Evaluation */}
              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      AI Suggested Grade
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {(onion.detectionConfidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white capitalize">
                        {onion.classification.replace('_', ' ')}
                      </span>
                      <span className="badge badge-amber text-[10px]">Uncertain Margin</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-snug">
                      {onion.aiClassificationGrade || 'Borderline classification based on scale defect analysis.'}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Detected Defect Flags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {onion.detectedDefects.map((def, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-300 font-medium"
                      >
                        {def.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label text-xs">Inspector Justification / Audit Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Minor outer skin slip, bulb flesh intact..."
                    value={reasonMap[onion._id] || ''}
                    onChange={(e) =>
                      setReasonMap({ ...reasonMap, [onion._id]: e.target.value })
                    }
                    className="input text-xs py-1.5"
                  />
                </div>
              </div>

              {/* Right Column: Human Decision Controls */}
              <div className="flex flex-col justify-between p-4 rounded-xl bg-gray-950/60 border border-gray-800/80 space-y-3">
                <div>
                  <span className="text-xs font-bold text-gray-200 uppercase tracking-wider block mb-1">
                    Inspector Action
                  </span>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    Confirm AI recommendation or override with the correct commercial grade.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleDecision(onion, 'confirm_ai')}
                    className="btn btn-secondary w-full justify-start text-xs text-gray-200 hover:text-white hover:border-gray-600"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Confirm AI ({onion.classification.replace('_', ' ')})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecision(onion, 'override', 'grade_a')}
                    className="btn btn-secondary w-full justify-start text-xs text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30"
                  >
                    <Award className="w-4 h-4 shrink-0" />
                    <span>Override to Grade A (Commercial)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecision(onion, 'override', 'urs')}
                    className="btn btn-secondary w-full justify-start text-xs text-yellow-400 hover:bg-yellow-500/10 border-yellow-500/30"
                  >
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    <span>Override to URS (Secondary)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecision(onion, 'override', 'rejected')}
                    className="btn btn-secondary w-full justify-start text-xs text-red-400 hover:bg-red-500/10 border-red-500/30"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Override to Reject (Cull)</span>
                  </button>
                </div>

                <div className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  Recorded in Government Quality Audit Log
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
