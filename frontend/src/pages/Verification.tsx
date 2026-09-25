import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, Eye, ChevronRight, Scan, AlertCircle } from "lucide-react";

import { verificationApi } from "../api/verification.api";
import type { OnionAnalysis } from "../types";

export const Verification: React.FC = () => {
  const [pending, setPending] = useState<OnionAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // ============================================================
  // LOAD PENDING VERIFICATIONS
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function loadPending() {
      try {
        setLoading(true);
        setError(null);

        const res = await verificationApi.listPending();

        if (mounted) {
          setPending(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (err: any) {
        console.error("Failed to load verification queue:", err);

        if (mounted) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load verification queue.",
          );

          setPending([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPending();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================
  // SUBMIT HUMAN DECISION
  // ============================================================

  const handleDecision = async (
    onion: OnionAnalysis,
    decision: "confirm_ai" | "override",
  ) => {
    if (!onion?._id) {
      return;
    }

    setSubmitting(onion._id);

    try {
      await verificationApi.submitDecision(
        onion._id,
        decision,
        decision === "override" ? "rejected" : undefined,
      );

      setPending((prev) => prev.filter((item) => item._id !== onion._id));
    } catch (err: any) {
      console.error("Failed to submit verification decision:", err);

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit decision.";

      alert(msg);
    } finally {
      setSubmitting(null);
    }
  };

  // ============================================================
  // CONDITION COLOR
  // ============================================================

  const getConditionColor = (onion: OnionAnalysis) => {
    const grade = String(
      onion?.aiClassificationGrade || onion?.classification || "",
    ).toLowerCase();

    if (grade.startsWith("healthy") || grade.startsWith("grade_a")) {
      return "text-emerald-400";
    }

    if (
      grade.startsWith("mold") ||
      grade.startsWith("rotten") ||
      grade.startsWith("sprouted") ||
      grade.startsWith("rejected")
    ) {
      return "text-red-400";
    }

    if (grade.startsWith("urs")) {
      return "text-yellow-400";
    }

    return "text-blue-400";
  };

  // ============================================================
  // SAFE CLASSIFICATION LABEL
  // ============================================================

  const getClassificationLabel = (onion: OnionAnalysis) => {
    const classification = String(onion?.classification || "").trim();

    if (!classification) {
      return "Unclassified";
    }

    return classification
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // ============================================================
  // SAFE DEFECT LIST
  // ============================================================

  const getDefects = (onion: OnionAnalysis) => {
    return Array.isArray(onion?.detectedDefects) ? onion.detectedDefects : [];
  };

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            AI Verification Queue
          </h1>

          <p className="text-xs text-gray-400 mt-1">
            Onion detections that require manual inspector review before report
            finalisation.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold">
          <Scan className="w-4 h-4" />
          {loading ? "—" : pending.length} Pending
        </div>
      </div>

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

          <div>
            <p className="font-semibold">Error loading verification queue</p>

            <p className="text-xs mt-0.5 text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* ========================================================
          MAIN TABLE
      ======================================================== */}

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
              {/* ==================================================
                  LOADING
              ================================================== */}

              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-gray-500 text-xs"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Scan className="w-6 h-6 text-amber-400 animate-pulse" />

                      <span>Loading verification queue from database...</span>
                    </div>
                  </td>
                </tr>
              ) : /* ==================================================
                   ERROR WITH NO DATA
                   ================================================== */

              error ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />

                    <p className="text-sm font-semibold text-red-300">
                      Unable to load verification queue
                    </p>

                    <p className="text-xs mt-1 text-gray-500">
                      Check that the backend server is running.
                    </p>
                  </td>
                </tr>
              ) : /* ==================================================
                   EMPTY
                   ================================================== */

              pending.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Check className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />

                    <p className="text-sm font-semibold">
                      Verification queue is empty
                    </p>

                    <p className="text-xs mt-1 text-gray-500">
                      All AI detections have been reviewed.
                    </p>

                    <Link
                      to="/inspections"
                      className="inline-flex items-center gap-1 mt-4 text-xs text-amber-400 hover:text-amber-300"
                    >
                      View inspections
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ) : (
                /* ==================================================
                   PENDING ITEMS
                   ================================================== */

                pending.map((onion) => {
                  const defects = getDefects(onion);

                  const confidence = Number(onion?.detectionConfidence || 0);

                  const inspectionId = String(onion?.inspectionId || "");

                  return (
                    <tr key={onion._id} className="group">
                      {/* ==================================================
                          SEQUENCE
                          ================================================== */}

                      <td className="font-mono text-xs font-bold text-amber-400">
                        {onion?.onionSequenceId || "N/A"}
                      </td>

                      {/* ==================================================
                          AI LABEL
                          ================================================== */}

                      <td>
                        <span
                          className={`text-xs font-semibold ${getConditionColor(
                            onion,
                          )}`}
                        >
                          {onion?.aiClassificationGrade ||
                            getClassificationLabel(onion)}
                        </span>
                      </td>

                      {/* ==================================================
                          CONFIDENCE
                          ================================================== */}

                      <td className="font-mono text-xs text-gray-300">
                        {(confidence * 100).toFixed(1)}%
                      </td>

                      {/* ==================================================
                          DEFECTS
                          ================================================== */}

                      <td>
                        <div className="flex flex-wrap gap-1">
                          {defects.length === 0 ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-400">
                              none
                            </span>
                          ) : (
                            defects.map((def, index) => {
                              const normalized = String(def || "")
                                .trim()
                                .toLowerCase();

                              const isClean =
                                normalized === "none" || normalized === "clean";

                              return (
                                <span
                                  key={index}
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    isClean
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : "bg-red-500/10 text-red-400"
                                  }`}
                                >
                                  {String(def || "unknown").replace(/_/g, " ")}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>

                      {/* ==================================================
                          INSPECTION
                          ================================================== */}

                      <td className="text-xs text-gray-400 font-mono">
                        {inspectionId ? (
                          <Link
                            to={`/inspections/${inspectionId}`}
                            className="text-amber-400 hover:underline"
                          >
                            {inspectionId.substring(0, 8)}
                            ...
                          </Link>
                        ) : (
                          <span className="text-gray-600">N/A</span>
                        )}
                      </td>

                      {/* ==================================================
                          DECISION
                          ================================================== */}

                      <td>
                        <div className="flex items-center justify-center gap-2">
                          {/* CONFIRM */}

                          <button
                            type="button"
                            disabled={submitting === onion._id}
                            onClick={() => handleDecision(onion, "confirm_ai")}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Confirm
                          </button>

                          {/* OVERRIDE */}

                          <button
                            type="button"
                            disabled={submitting === onion._id}
                            onClick={() => handleDecision(onion, "override")}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            Override
                          </button>
                        </div>
                      </td>

                      {/* ==================================================
                          VIEW
                          ================================================== */}

                      <td className="text-right">
                        {inspectionId ? (
                          <Link
                            to={`/inspections/${inspectionId}`}
                            className="btn-ghost px-2.5 py-1.5 text-xs flex items-center gap-1 justify-end"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            Open
                            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
