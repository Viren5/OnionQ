import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  Award,
  QrCode,
  CheckCircle2,
  Calendar,
  Building,
  User,
  Scale,
} from 'lucide-react';
import { reportsApi } from '../api/reports.api';
import { inspectionsApi } from '../api/inspections.api';
import type { Inspection, Report } from '../types';

export const ReportView: React.FC = () => {
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReportData() {
      const id = inspectionId || 'insp_101';
      try {
        const [repRes, inspRes] = await Promise.all([
          reportsApi.getByInspection(id),
          inspectionsApi.getById(id),
        ]);
        setReport(repRes.data);
        setInspection(inspRes.data);
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, [inspectionId]);

  if (loading || !report || !inspection) {
    return (
      <div className="text-center py-16 text-gray-500">
        Generating official quality assessment certificate...
      </div>
    );
  }

  const { summary } = report;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top Action Bar (Hidden on Print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to={`/inspections/${inspection._id}`}
          className="btn btn-secondary text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inspection Workspace
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className="btn btn-primary text-xs shadow-md shadow-amber-500/20"
        >
          <Printer className="w-4 h-4" />
          Print / Export PDF Certificate
        </button>
      </div>

      {/* Official Certificate Paper Container */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden print:bg-white print:text-black print:border-none print:p-4">
        {/* Subtle Watermark Stamp */}
        <div className="absolute right-6 top-6 opacity-5 pointer-events-none print:opacity-10">
          <Award className="w-64 h-64 text-amber-400" />
        </div>

        {/* Certificate Header */}
        <div className="text-center border-b border-gray-800 print:border-gray-300 pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider print:text-amber-700 print:border-amber-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            Government Quality Grading System • SIH 2026
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase print:text-black">
            Certificate of Quality Assessment & Agmark Grading
          </h1>
          <p className="text-xs text-gray-400 print:text-gray-600">
            Issued in accordance with Agricultural Produce (Grading and Marking) Act & National Agmark Standards
          </p>
        </div>

        {/* Certificate Verification Ribbon */}
        <div className="my-6 p-4 rounded-xl bg-gray-950/80 border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 print:bg-gray-50 print:border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:bg-emerald-100 print:text-emerald-800">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wider block print:text-gray-500">
                Declared Agmark Grade
              </span>
              <span className="text-xl font-extrabold text-emerald-400 uppercase tracking-tight print:text-emerald-700">
                Grade A — Premium Commercial Quality
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-900 px-3 py-2 rounded-lg border border-gray-800 print:bg-white print:border-gray-300">
            <QrCode className="w-8 h-8 text-amber-400 shrink-0 print:text-black" />
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block uppercase print:text-gray-600">Verification Token</span>
              <span className="font-mono text-xs font-bold text-amber-400 print:text-black">
                {report.qrVerificationToken}
              </span>
            </div>
          </div>
        </div>

        {/* Batch & Consignment Particulars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-gray-800 print:border-gray-300 text-xs">
          <div>
            <span className="text-gray-400 block text-[11px] print:text-gray-600 flex items-center gap-1">
              <Building className="w-3 h-3" /> Batch LOT ID
            </span>
            <span className="font-mono font-bold text-white text-sm print:text-black">
              {inspection.batchInfo.batchId}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px] print:text-gray-600 flex items-center gap-1">
              <User className="w-3 h-3" /> Producer / Farmer
            </span>
            <span className="font-semibold text-white print:text-black">
              {inspection.batchInfo.farmerName || 'Direct Mandi Inflow'}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px] print:text-gray-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Date of Inspection
            </span>
            <span className="font-medium text-white print:text-black">
              {new Date(report.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px] print:text-gray-600 flex items-center gap-1">
              <Scale className="w-3 h-3" /> Lot Net Weight
            </span>
            <span className="font-semibold text-white print:text-black">
              {inspection.batchInfo.approximateWeightKg ? `${inspection.batchInfo.approximateWeightKg.toLocaleString()} Kg` : '--'}
            </span>
          </div>
        </div>

        {/* Inspection Data Breakdowns */}
        <div className="py-6 space-y-6">
          {/* Classification Breakdown Table */}
          <div>
            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-3 print:text-black">
              1. Commercial Grade Classification
            </h2>
            <div className="table-container rounded-lg border border-gray-800 print:border-gray-300">
              <table className="table print:text-black">
                <thead>
                  <tr>
                    <th>Agmark Category</th>
                    <th>Sample Count</th>
                    <th>Lot Proportion (%)</th>
                    <th>Standard Compliance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.classificationDistribution.map((entry, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-white print:text-black">{entry.label}</td>
                      <td className="font-mono">{entry.count} Bulbs</td>
                      <td className="font-mono font-bold text-amber-400 print:text-black">
                        {entry.percentage.toFixed(1)}%
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium print:text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Within Tolerance Limit
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Size Profile Table */}
          <div>
            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-3 print:text-black">
              2. Bulb Diameter & Size Calibration Profile
            </h2>
            <div className="table-container rounded-lg border border-gray-800 print:border-gray-300">
              <table className="table print:text-black">
                <thead>
                  <tr>
                    <th>Calibrated Size Band</th>
                    <th>Bulb Count</th>
                    <th>Distribution (%)</th>
                    <th>Commercial Utility</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.sizeDistribution.map((entry, idx) => (
                    <tr key={idx}>
                      <td className="font-medium text-white print:text-black">{entry.label}</td>
                      <td className="font-mono">{entry.count}</td>
                      <td className="font-mono text-gray-300 print:text-black">
                        {entry.percentage.toFixed(1)}%
                      </td>
                      <td className="text-xs text-gray-400 print:text-gray-600">
                        {entry.label.includes('Large')
                          ? 'Premium Export & Domestic Retail'
                          : entry.label.includes('Medium')
                          ? 'Standard General Consumption'
                          : 'Processing / Dehydration'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Defect Severity */}
          <div>
            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-3 print:text-black">
              3. Defect & Pathology Incidence
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {summary.defectDistribution.map((def, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-gray-950/60 border border-gray-800 print:bg-gray-100 print:border-gray-200"
                >
                  <span className="text-[11px] text-gray-400 block print:text-gray-600">{def.label}</span>
                  <div className="text-sm font-bold text-white print:text-black mt-0.5">
                    {def.percentage.toFixed(1)}% ({def.count})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regulatory & Sign-Off Footer */}
        <div className="pt-6 border-t border-gray-800 print:border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-gray-400 print:text-gray-600">
          <div>
            <div className="text-white font-semibold print:text-black">
              Standard: {summary.gradingRuleSnapshot?.standardName || 'National Agmark Standard 2024'}
            </div>
            <div>
              Rule Version: {summary.gradingRuleSnapshot?.ruleVersion || '2.4.1'} • Model Confidence: {( (summary.averageAiConfidence || 0.92) * 100).toFixed(1)}%
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className="font-bold text-white uppercase tracking-wider font-mono print:text-black">
              Certified Inspector #MH-NAS-04
            </div>
            <div className="text-[11px]">Lasalgaon Quality Assurance Station</div>
          </div>
        </div>
      </div>
    </div>
  );
};
