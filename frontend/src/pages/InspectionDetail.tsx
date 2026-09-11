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
      } catch (err) {
        console.error('Failed to load inspection workspace:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInspection();
  }, [id]);

  const handleRunAnalysis = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      await analysisApi.triggerAnalysis(id);
      const detRes = await analysisApi.getResults(id);
      setDetections(detRes.data);
      if (detRes.data.length > 0) {
        setSelectedOnion(detRes.data[0]);
      }
    } catch (err) {
      console.error('Analysis trigger failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!id) return;
    setGeneratingReport(true);
    try {
      await reportsApi.generate(id);
      navigate(`/reports/${id}`);
    } catch (err) {
      console.error('Report generation failed:', err);
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

  if (loading || !inspection) {
    return (
      <div className="text-center py-16 text-gray-500">
        Loading AI detection workspace...
      </div>
    );
  }

  // Calculate quick metrics
  const gradeACount = detections.filter((d) => d.classification === 'grade_a').length;
  const ursCount = detections.filter((d) => d.classification === 'urs').length;
  const rejectCount = detections.filter((d) => d.classification === 'rejected').length;

  const currentImage =
    inspection.imageReferences[0] ||
    'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=1200&q=80';

  const getBorderColor = (classification: OnionClassification, isSelected: boolean) => {
    if (isSelected) return 'border-amber-400 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/30';
    switch (classification) {
      case 'grade_a':
        return 'border-emerald-500 bg-emerald-500/10 hover:border-emerald-300';
      case 'urs':
        return 'border-yellow-500 bg-yellow-500/10 hover:border-yellow-300';
      case 'rejected':
        return 'border-red-500 bg-red-500/10 hover:border-red-300';
      default:
        return 'border-blue-500 bg-blue-500/10 hover:border-blue-300';
    }
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
              <span className="badge badge-amber">{inspection.status.replace('_', ' ')}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {inspection.batchInfo.procurementCentre} • Farmer: {inspection.batchInfo.farmerName || 'Unknown'} (
              {inspection.batchInfo.variety || 'Red Onion'})
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="btn btn-secondary text-xs"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Inference Running...' : 'Re-run AI Detection'}
          </button>

          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="btn btn-primary text-xs shadow-md shadow-amber-500/20"
          >
            <FileCheck className="w-4 h-4" />
            {generatingReport ? 'Compiling Report...' : 'Finalize & Generate Certificate'}
          </button>
        </div>
      </div>

      {/* Summary Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400 block uppercase">Total Detected</span>
            <span className="text-lg font-bold text-white">{detections.length} Bulbs</span>
          </div>
          <Scan className="w-5 h-5 text-gray-500" />
        </div>

        <div className="p-3 rounded-xl bg-gray-900 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-400 block uppercase font-medium">Grade A</span>
            <span className="text-lg font-bold text-emerald-400">
              {gradeACount} ({detections.length ? ((gradeACount / detections.length) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <Award className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="p-3 rounded-xl bg-gray-900 border border-yellow-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-yellow-400 block uppercase font-medium">URS Secondary</span>
            <span className="text-lg font-bold text-yellow-400">
              {ursCount} ({detections.length ? ((ursCount / detections.length) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        </div>

        <div className="p-3 rounded-xl bg-gray-900 border border-red-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-red-400 block uppercase font-medium">Rejected / Culls</span>
            <span className="text-lg font-bold text-red-400">
              {rejectCount} ({detections.length ? ((rejectCount / detections.length) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Canvas */}
        <div className="lg:col-span-2 card p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400 pb-2 border-b border-gray-800">
            <span className="flex items-center gap-1.5 font-medium text-gray-200">
              <Scan className="w-3.5 h-3.5 text-amber-400" />
              Overhead Tray Bounding Box Visualizer
            </span>
            <span className="text-[11px] text-gray-400">Click any box to inspect individual bulb metrics</span>
          </div>

          {/* Canvas container with relative overlay */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/60 border border-gray-800 group select-none">
            <img
              src={currentImage}
              alt="Sampled Onion Lot"
              className="w-full h-full object-cover"
            />

            {/* Render Bounding Boxes */}
            {detections.map((onion) => {
              const isSelected = selectedOnion?._id === onion._id;
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
                  className={`absolute border-2 rounded cursor-pointer transition-all duration-150 flex flex-col justify-between p-1 ${getBorderColor(
                    onion.classification,
                    isSelected
                  )}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-gray-950/90 text-white font-mono text-[9px] font-bold px-1 rounded shadow">
                      {onion.onionSequenceId}
                    </span>
                    <span
                      className={`text-[8px] font-bold px-1 rounded uppercase ${
                        onion.classification === 'grade_a'
                          ? 'bg-emerald-500 text-gray-950'
                          : onion.classification === 'urs'
                          ? 'bg-yellow-500 text-gray-950'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {onion.classification.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-[8px] font-mono text-gray-200 bg-gray-950/80 px-1 rounded self-start">
                    {onion.sizeEstimate?.diameterMm?.toFixed(1)}mm
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detections Strip / Mini Thumbnails */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Detected Bulbs in Sample ({detections.length})
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {detections.map((d) => {
                const isSelected = selectedOnion?._id === d._id;
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
                        d.classification === 'grade_a'
                          ? 'bg-emerald-400'
                          : d.classification === 'urs'
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                      }`}
                    />
                    {d.onionSequenceId}
                  </button>
                );
              })}
            </div>
          </div>
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
              {/* Classification Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  selectedOnion.classification === 'grade_a'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : selectedOnion.classification === 'urs'
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold block text-gray-400">
                    Agmark Classification
                  </span>
                  <span className="text-base font-bold capitalize">
                    {selectedOnion.classification.replace('_', ' ')}
                  </span>
                </div>
                {selectedOnion.verificationStatus === 'overridden' && (
                  <span className="text-[10px] bg-amber-500 text-gray-950 font-bold px-2 py-0.5 rounded">
                    Human Overridden
                  </span>
                )}
              </div>

              {/* Physical Size & Dimensions */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/60">
                  <span className="text-gray-400 block text-[11px]">Calibrated Diameter</span>
                  <span className="text-base font-bold text-white font-mono">
                    {selectedOnion.sizeEstimate?.diameterMm || '--'} mm
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/60">
                  <span className="text-gray-400 block text-[11px]">Size Category</span>
                  <span className="text-base font-bold text-white capitalize">
                    {selectedOnion.sizeEstimate?.category || 'Standard'}
                  </span>
                </div>
              </div>

              {/* Confidence Score Bar */}
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

              {/* Detected Defects */}
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Identified Surface Defects
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

              {/* Quick Inspector Override Controls */}
              <div className="pt-2 border-t border-gray-800 space-y-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Inspector Manual Classification Override
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInlineClassificationOverride('grade_a')}
                    className="btn btn-secondary py-1.5 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <Check className="w-3 h-3" /> Grade A
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInlineClassificationOverride('urs')}
                    className="btn btn-secondary py-1.5 text-xs text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
                  >
                    URS
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInlineClassificationOverride('rejected')}
                    className="btn btn-secondary py-1.5 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 text-xs">
              Select an onion bounding box on the canvas to inspect its parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
