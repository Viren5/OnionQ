import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Award,
  AlertTriangle,
  FileCheck,
  Scan,
  Maximize2,
  Check,
  AlertCircle,
  Image,
} from 'lucide-react';
import { inspectionsApi } from '../api/inspections.api';
import { analysisApi } from '../api/analysis.api';
import { reportsApi } from '../api/reports.api';
import type { Inspection, OnionAnalysis, OnionClassification } from '../types';

export const InspectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [detections, setDetections] = useState<OnionAnalysis[]>([]);
  const [selectedOnion, setSelectedOnion] = useState<OnionAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInspection() {
      if (!id) return;
      try {
        const [inspRes, detRes] = await Promise.all([
          inspectionsApi.getById(id),
          analysisApi.getResults(id),
        ]);
        setInspection(inspRes.data);
        setDetections(detRes.data);
        if (detRes.data.length > 0) {
          setSelectedOnion(detRes.data[0]);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to load inspection workspace.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadInspection();
  }, [id]);

  const handleRunAnalysis = async () => {
    if (!id) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      await analysisApi.triggerAnalysis(id);
      const [inspRes, detRes] = await Promise.all([
        inspectionsApi.getById(id),
        analysisApi.getResults(id),
      ]);
      setInspection(inspRes.data);
      setDetections(detRes.data);
      if (detRes.data.length > 0) {
        setSelectedOnion(detRes.data[0]);
      } else {
        setSelectedOnion(null);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'AI analysis failed. Ensure the Python AI service is running.';
      setAnalysisError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!id) return;
    setGeneratingReport(true);
    setReportError(null);
    try {
      await reportsApi.generate(id);
      navigate(`/reports/${id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Report generation failed.';
      setReportError(msg);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleInlineClassificationOverride = (newClass: OnionClassification) => {
    if (!selectedOnion) return;
    const updated = {
      ...selectedOnion,
      classification: newClass,
      verificationStatus: 'overridden' as const,
    };
    setSelectedOnion(updated);
    setDetections((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-500">
        Loading AI detection workspace...
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to load inspection</p>
            <p className="text-xs mt-1 text-red-300">{error || 'Inspection not found.'}</p>
            <Link to="/inspections" className="text-xs text-amber-400 mt-3 inline-block hover:underline">
              ← Back to Inspections
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate real metrics from actual detections
  const healthyCount = detections.filter((d) => d.classification === 'grade_a').length;
  const defectiveCount = detections.filter((d) => d.classification === 'rejected').length;
  const pendingCount = detections.filter((d) => d.verificationStatus === 'pending').length;

  const currentImage = inspection.imageReferences[0] || null;

  const getConditionColors = (onion: OnionAnalysis, isSelected: boolean) => {
    if (isSelected) return 'border-amber-400 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/30';
    const grade = onion.aiClassificationGrade?.toLowerCase() || '';
    if (grade.startsWith('healthy')) return 'border-emerald-500 bg-emerald-500/10 hover:border-emerald-300';
    if (grade.startsWith('mold') || grade.startsWith('rotten') || grade.startsWith('sprouted')) return 'border-red-500 bg-red-500/10 hover:border-red-300';
    return 'border-blue-500 bg-blue-500/10 hover:border-blue-300';
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/inspections"
            className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-mono">{inspection.batchInfo.batchId}</h1>
              <span className="badge badge-amber">{inspection.status.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {inspection.batchInfo.procurementCentre}
              {inspection.batchInfo.farmerName ? ` • ${inspection.batchInfo.farmerName}` : ''}
              {inspection.batchInfo.variety ? ` (${inspection.batchInfo.variety})` : ''}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={analyzing || inspection.imageReferences.length === 0}
            title={inspection.imageReferences.length === 0 ? 'Upload images first before running analysis' : ''}
            className="btn btn-secondary text-xs disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'AI Running...' : 'Run AI Detection'}
          </button>

          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={generatingReport || detections.length === 0}
            title={detections.length === 0 ? 'Run AI detection first' : ''}
            className="btn btn-primary text-xs shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            <FileCheck className="w-4 h-4" />
            {generatingReport ? 'Compiling Report...' : 'Generate Quality Certificate'}
          </button>
        </div>
      </div>

      {/* Inline error messages for analysis / report */}
      {analysisError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{analysisError}</span>
        </div>
      )}
      {reportError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{reportError}</span>
        </div>
      )}

      {/* Summary Stat Strip — from real detections */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 block uppercase">AI Detected</span>
            <span className="text-lg font-bold text-white">{detections.length} Bulbs</span>
          </div>
          <Scan className="w-5 h-5 text-gray-500" />
        </div>

        <div className="p-3 rounded-xl bg-gray-900 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-400 block uppercase font-medium">Healthy</span>
            <span className="text-lg font-bold text-emerald-400">
              {healthyCount}
              {detections.length > 0 && (
                <span className="text-sm font-normal ml-1 text-emerald-300/70">
                  ({((healthyCount / detections.length) * 100).toFixed(0)}%)
                </span>
              )}
            </span>
          </div>
          <Award className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="p-3 rounded-xl bg-gray-900 border border-red-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-red-400 block uppercase font-medium">Defective</span>
            <span className="text-lg font-bold text-red-400">
              {defectiveCount}
              {detections.length > 0 && (
                <span className="text-sm font-normal ml-1 text-red-300/70">
                  ({((defectiveCount / detections.length) * 100).toFixed(0)}%)
                </span>
              )}
            </span>
          </div>
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>

        <div className="p-3 rounded-xl bg-gray-900 border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-400 block uppercase font-medium">Pending Review</span>
            <span className="text-lg font-bold text-amber-400">{pendingCount}</span>
          </div>
          <span className="w-3 h-3 rounded-full bg-amber-400" />
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Canvas */}
        <div className="lg:col-span-2 card p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-gray-800">
            <span className="flex items-center gap-1.5 font-medium text-gray-200">
              <Scan className="w-3.5 h-3.5 text-amber-400" />
              Overhead Tray Detection Canvas
            </span>
            <span className="text-[11px] text-gray-400">
              {detections.length > 0
                ? 'Click any bounding box to inspect individual bulb metrics'
                : 'Run AI Detection to see bounding box overlays on the image'}
            </span>
          </div>

          {/* Canvas container with real uploaded image */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/60 border border-gray-800 group select-none">
            {currentImage ? (
              <img
                src={currentImage}
                alt="Sampled Onion Lot"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-2">
                <Image className="w-10 h-10" />
                <p className="text-xs text-center">No images uploaded yet.<br />Upload sample tray photos to proceed.</p>
              </div>
            )}

            {/* Real YOLO Bounding Boxes */}
            {detections.map((onion) => {
              const isSelected = selectedOnion?._id === onion._id;
              const grade = onion.aiClassificationGrade?.toLowerCase() || '';
              const isHealthy = grade.startsWith('healthy');
              const isDefective = grade.startsWith('mold') || grade.startsWith('rotten') || grade.startsWith('sprouted');
              return (
                <div
                  key={onion._id}
                  onClick={() => setSelectedOnion(onion)}
                  style={{
                    left: `${onion.boundingBox.x}%`,
                    top: `${onion.boundingBox.y}%`,
                    width: `${onion.boundingBox.width}%`,
                    height: `${onion.boundingBox.height}%`,
                  }}
                  className={`absolute border-2 rounded cursor-pointer transition-all duration-150 flex flex-col justify-between p-1 ${getConditionColors(onion, isSelected)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-gray-950/90 text-white font-mono text-[9px] font-bold px-1 rounded shadow">
                      {onion.onionSequenceId}
                    </span>
                    <span
                      className={`text-[8px] font-bold px-1 rounded uppercase ${
                        isHealthy
                          ? 'bg-emerald-500 text-gray-950'
                          : isDefective
                          ? 'bg-red-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {grade.split(' ')[0] || onion.classification}
                    </span>
                  </div>
                  <div className="text-[8px] font-mono text-gray-200 bg-gray-950/80 px-1 rounded self-start">
                    {(onion.detectionConfidence * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detections Strip */}
          {detections.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Detected Bulbs ({detections.length})
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {detections.map((d) => {
                  const isSelected = selectedOnion?._id === d._id;
                  const grade = d.aiClassificationGrade?.toLowerCase() || '';
                  const isHealthy = grade.startsWith('healthy');
                  const isDefective = !isHealthy && d.classification === 'rejected';
                  return (
                    <button
                      key={d._id}
                      type="button"
                      onClick={() => setSelectedOnion(d)}
                      className={`shrink-0 px-3 py-2 rounded-lg border text-xs font-mono transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isHealthy ? 'bg-emerald-400' : isDefective ? 'bg-red-400' : 'bg-blue-400'
                        }`}
                      />
                      {d.onionSequenceId}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {detections.length === 0 && inspection.imageReferences.length > 0 && !analyzing && (
            <div className="text-center py-6 text-gray-500 text-xs border border-dashed border-gray-800 rounded-xl">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-amber-400/50" />
              Images uploaded. Click <strong className="text-gray-300">Run AI Detection</strong> to analyse this batch.
            </div>
          )}
        </div>

        {/* Right Col: Selected Onion Inspector */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                Bulb Inspector
              </h2>
            </div>
            {selectedOnion && (
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {selectedOnion.onionSequenceId}
              </span>
            )}
          </div>

          {selectedOnion ? (
            <div className="space-y-4">
              {/* AI Result Banner */}
              <div className="p-3.5 rounded-xl border bg-gray-800/60 border-gray-700/60">
                <span className="text-[10px] uppercase tracking-wider font-semibold block text-gray-400 mb-1">
                  AI Detected Condition
                </span>
                <span className="text-base font-bold text-white">
                  {selectedOnion.aiClassificationGrade || selectedOnion.classification.replace('_', ' ')}
                </span>
                {selectedOnion.verificationStatus === 'overridden' && (
                  <span className="ml-2 text-[10px] bg-amber-500 text-gray-950 font-bold px-2 py-0.5 rounded">
                    Inspector Overridden
                  </span>
                )}
                {selectedOnion.verificationStatus === 'pending' && (
                  <span className="ml-2 text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded">
                    Verification Required
                  </span>
                )}
              </div>

              {/* Confidence Score */}
              <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Model Confidence</span>
                  <span className="font-mono font-bold text-amber-400">
                    {(selectedOnion.detectionConfidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${selectedOnion.detectionConfidence * 100}%` }}
                    className={`h-full rounded-full ${
                      selectedOnion.detectionConfidence > 0.8
                        ? 'bg-emerald-400'
                        : selectedOnion.detectionConfidence > 0.6
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    }`}
                  />
                </div>
              </div>

              {/* Bounding Box Coordinates */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-gray-800/60 border border-gray-700/60">
                  <span className="text-gray-400 block text-[11px]">Position (x, y)</span>
                  <span className="font-mono font-bold text-white">
                    {selectedOnion.boundingBox.x.toFixed(1)}%, {selectedOnion.boundingBox.y.toFixed(1)}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-800/60 border border-gray-700/60">
                  <span className="text-gray-400 block text-[11px]">Size (w × h)</span>
                  <span className="font-mono font-bold text-white">
                    {selectedOnion.boundingBox.width.toFixed(1)}% × {selectedOnion.boundingBox.height.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Detected Defects */}
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Detected Condition Flags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedOnion.detectedDefects.map((def, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2.5 py-1 rounded-md border font-medium ${
                        def === 'none'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {def.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Inspector Override Controls */}
              <div className="pt-2 border-t border-gray-800 space-y-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Inspector Manual Override
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInlineClassificationOverride('grade_a')}
                    className="btn btn-secondary py-1.5 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <Check className="w-3 h-3" /> Healthy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInlineClassificationOverride('urs')}
                    className="btn btn-secondary py-1.5 text-xs text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
                  >
                    Marginal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInlineClassificationOverride('rejected')}
                    className="btn btn-secondary py-1.5 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                  >
                    Defective
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-xs">
              {detections.length === 0
                ? 'Run AI Detection to populate the canvas with real bounding boxes.'
                : 'Select a bounding box on the canvas to inspect its parameters.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
