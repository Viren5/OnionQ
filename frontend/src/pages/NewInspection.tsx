import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  ArrowRight,
  Sparkles,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { inspectionsApi } from '../api/inspections.api';
import type { BatchInfo } from '../types';

export const NewInspection: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [batchInfo, setBatchInfo] = useState<BatchInfo>({
    batchId: `LOT-2026-MH-${Math.floor(1000 + Math.random() * 9000)}`,
    procurementCentre: 'Lasalgaon Mandi Yard #4',
    farmerName: '',
    farmerCode: '',
    supplierName: '',
    vehicleNumber: '',
    approximateWeightKg: 4000,
    variety: 'Garwa / Nasik Red (Rabi)',
    notes: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([
    'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
  ]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchInfo.batchId || !batchInfo.procurementCentre) {
      setErrorMsg('Please specify Batch ID and Procurement Centre');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Create inspection record
      const createRes = await inspectionsApi.create(batchInfo);
      const newInspectionId = createRes.data._id;

      // 2. Upload images if any selected
      if (selectedFiles.length > 0) {
        await inspectionsApi.uploadImages(newInspectionId, selectedFiles);
      }

      // Navigate directly to the interactive inspection workspace
      navigate(`/inspections/${newInspectionId}`);
    } catch (err: unknown) {
      console.error('Failed to create inspection batch:', err);
      setErrorMsg('Failed to create batch. Please verify all inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">New Batch Intake & Inspection</h1>
        <p className="text-sm text-gray-400 mt-1">
          Register an incoming onion lot from a mandi or farmer cooperative and upload sample tray photos for AI vision grading.
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
              <select
                value={batchInfo.variety}
                onChange={(e) => setBatchInfo({ ...batchInfo, variety: e.target.value })}
                className="input"
              >
                <option value="Garwa / Nasik Red (Rabi)">Garwa / Nasik Red (Rabi)</option>
                <option value="Bhima Super (Early Red)">Bhima Super (Early Red)</option>
                <option value="Bhima Dark Red (Kharif)">Bhima Dark Red (Kharif)</option>
                <option value="White Onion (Agrifound)">White Onion (Agrifound)</option>
                <option value="Yellow Spanish Onion">Yellow Spanish Onion</option>
              </select>
            </div>

            <div>
              <label className="label">Approximate Lot Weight (Kg)</label>
              <input
                type="number"
                min="10"
                step="50"
                value={batchInfo.approximateWeightKg || ''}
                onChange={(e) =>
                  setBatchInfo({
                    ...batchInfo,
                    approximateWeightKg: Number(e.target.value),
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
              Supports JPEG, PNG up to 25MB per image. Multi-bulb overhead views recommended.
            </p>
          </label>

          {/* Previews */}
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
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[11px] text-white font-medium bg-gray-900/80 px-2 py-0.5 rounded">
                        Sample #{idx + 1}
                      </span>
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
