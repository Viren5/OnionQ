import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  ArrowRight,
  Sparkles,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';
import { inspectionsApi } from '../api/inspections.api';
import type { BatchInfo } from '../types';

export const NewInspection: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State — all empty so user must enter real data
  const [batchInfo, setBatchInfo] = useState<BatchInfo>({
    batchId: '',
    procurementCentre: '',
    farmerName: '',
    farmerCode: '',
    supplierName: '',
    vehicleNumber: '',
    approximateWeightKg: undefined,
    variety: '',
    notes: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchInfo.batchId.trim() || !batchInfo.procurementCentre.trim()) {
      setErrorMsg('Please specify Batch ID and Procurement Centre');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Create inspection record in MongoDB
      const createRes = await inspectionsApi.create(batchInfo);
      const newInspectionId = createRes.data._id;

      // 2. Upload actual images if any selected
      if (selectedFiles.length > 0) {
        await inspectionsApi.uploadImages(newInspectionId, selectedFiles);
      }

      navigate(`/inspections/${newInspectionId}`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create batch. Please verify all inputs and ensure the backend is running.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">New Batch Intake & Inspection</h1>
        <p className="text-sm text-gray-400 mt-1">
          Register an incoming onion lot and upload sample tray photos for AI vision quality analysis.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Lot Identification */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <FileText className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
              Batch & Farmer Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Batch LOT Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. LOT-2026-MH-4421"
                value={batchInfo.batchId}
                onChange={(e) => setBatchInfo({ ...batchInfo, batchId: e.target.value })}
                className="input font-mono"
              />
            </div>

            <div>
              <label className="label">Procurement Hub / APMC Yard *</label>
              <input
                type="text"
                required
                placeholder="e.g. Lasalgaon APMC Yard #4"
                value={batchInfo.procurementCentre}
                onChange={(e) => setBatchInfo({ ...batchInfo, procurementCentre: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Farmer / Producer Name</label>
              <input
                type="text"
                placeholder="e.g. Rameshwar Patil"
                value={batchInfo.farmerName || ''}
                onChange={(e) => setBatchInfo({ ...batchInfo, farmerName: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Farmer Registration Code (Kisan ID)</label>
              <input
                type="text"
                placeholder="e.g. MH-NAS-48201"
                value={batchInfo.farmerCode || ''}
                onChange={(e) => setBatchInfo({ ...batchInfo, farmerCode: e.target.value })}
                className="input font-mono"
              />
            </div>

            <div>
              <label className="label">Onion Variety</label>
              <input
                type="text"
                placeholder="e.g. Nasik Red (Rabi), Bhima Super, White Onion..."
                value={batchInfo.variety || ''}
                onChange={(e) => setBatchInfo({ ...batchInfo, variety: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Approximate Lot Weight (Kg)</label>
              <input
                type="number"
                min="1"
                step="50"
                placeholder="e.g. 4000"
                value={batchInfo.approximateWeightKg || ''}
                onChange={(e) =>
                  setBatchInfo({
                    ...batchInfo,
                    approximateWeightKg: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="input"
              />
            </div>

            <div>
              <label className="label">Transport Vehicle Number</label>
              <input
                type="text"
                placeholder="e.g. MH-15-EG-8291"
                value={batchInfo.vehicleNumber || ''}
                onChange={(e) => setBatchInfo({ ...batchInfo, vehicleNumber: e.target.value })}
                className="input font-mono uppercase"
              />
            </div>

            <div>
              <label className="label">Cooperative / Supplier Society</label>
              <input
                type="text"
                placeholder="e.g. Sahyadri Farmers Producer Co."
                value={batchInfo.supplierName || ''}
                onChange={(e) => setBatchInfo({ ...batchInfo, supplierName: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Field Observations / Quality Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Harvested 4 days prior, sun cured, sampled from middle crates..."
              value={batchInfo.notes || ''}
              onChange={(e) => setBatchInfo({ ...batchInfo, notes: e.target.value })}
              className="input resize-none"
            />
          </div>
        </div>

        {/* Sample Image Upload */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                Sample Tray Image Capture
              </h2>
            </div>
            <span className="text-xs text-gray-400">High-resolution overhead tray photos</span>
          </div>

          {/* Dropzone */}
          <label className="border-2 border-dashed border-gray-700 hover:border-amber-500/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-950/40 group">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-colors mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-200">
              Drag and drop onion tray images, or <span className="text-amber-400 underline">browse files</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPEG, PNG up to 25MB per image. Multi-bulb overhead views recommended for best detection.
            </p>
          </label>

          {/* Previews of actual selected files */}
          {previews.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Selected Sample Images ({previews.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-800 group aspect-video">
                    <img
                      src={src}
                      alt={`Tray sample ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 bg-gray-950/80 rounded p-0.5 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-gray-950/80 text-[10px] text-gray-300 px-1.5 py-0.5 rounded">
                      {selectedFiles[idx]?.name?.substring(0, 16) || `Sample #${idx + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form Submission */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/inspections')}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary shadow-lg shadow-amber-500/20"
          >
            {submitting ? (
              <span>Registering Batch...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create Batch & Launch Vision Inspector</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
