import { Schema, model, Document, Types } from 'mongoose';
import type { OnionClassification } from './OnionAnalysis';

export type VerificationDecision = 'confirm_ai' | 'override';

export interface IVerification extends Document {
  _id: Types.ObjectId;
  onionAnalysisId: Types.ObjectId;
  inspectionId: Types.ObjectId;
  inspectorId: Types.ObjectId;
  decision: VerificationDecision;
  /** The classification the inspector assigned (if overriding AI) */
  inspectorClassification?: OnionClassification;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const verificationSchema = new Schema<IVerification>(
  {
    onionAnalysisId: {
      type: Schema.Types.ObjectId,
      ref: 'OnionAnalysis',
      required: [true, 'OnionAnalysis ID is required'],
    },
    inspectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Inspection',
      required: [true, 'Inspection ID is required'],
    },
    inspectorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inspector ID is required'],
    },
    decision: {
      type: String,
      enum: ['confirm_ai', 'override'] as VerificationDecision[],
      required: [true, 'Decision is required'],
    },
    inspectorClassification: {
      type: String,
      enum: ['grade_a', 'urs', 'rejected', 'unclassified'] as OnionClassification[],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

verificationSchema.index({ onionAnalysisId: 1 });
verificationSchema.index({ inspectionId: 1 });
verificationSchema.index({ inspectorId: 1 });

export const Verification = model<IVerification>('Verification', verificationSchema);
