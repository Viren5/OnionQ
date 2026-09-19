import { Schema, model, Document, Types } from 'mongoose';

export type InspectionStatus =
  | 'draft'
  | 'images_uploaded'
  | 'analysis_pending'
  | 'analysis_in_progress'
  | 'analysis_complete'
  | 'verification_pending'
  | 'verification_complete'
  | 'report_generated'
  | 'cancelled';

export interface IBatchInfo {
  batchId: string;
  procurementCentre: string;
  farmerName?: string;
  farmerCode?: string;
  supplierName?: string;
  vehicleNumber?: string;
  approximateWeightKg?: number;
  variety?: string;
  notes?: string;
}

export interface IInspection extends Document {
  _id: Types.ObjectId;
  batchInfo: IBatchInfo;
  inspectorId: Types.ObjectId;
  status: InspectionStatus;
  /** Storage references (paths or cloud keys) for uploaded images */
  imageReferences: string[];
  /** Count of onions detected by AI inference, updated after analysis */
  totalOnionsDetected: number;
  createdAt: Date;
  updatedAt: Date;
}

const batchInfoSchema = new Schema<IBatchInfo>(
  {
    batchId: { type: String, required: true, trim: true },
    procurementCentre: { type: String, required: true, trim: true },
    farmerName: { type: String, trim: true },
    farmerCode: { type: String, trim: true },
    supplierName: { type: String, trim: true },
    vehicleNumber: { type: String, trim: true },
    approximateWeightKg: { type: Number, min: 0 },
    variety: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

const inspectionSchema = new Schema<IInspection>(
  {
    batchInfo: {
      type: batchInfoSchema,
      required: true,
    },
    inspectorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inspector ID is required'],
    },
    status: {
      type: String,
      enum: [
        'draft',
        'images_uploaded',
        'analysis_pending',
        'analysis_in_progress',
        'analysis_complete',
        'verification_pending',
        'verification_complete',
        'report_generated',
        'cancelled',
      ] as InspectionStatus[],
      default: 'draft',
    },
    imageReferences: {
      type: [String],
      default: [],
    },
    totalOnionsDetected: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

inspectionSchema.index({ 'batchInfo.batchId': 1 }, { unique: true });
inspectionSchema.index({ inspectorId: 1 });
inspectionSchema.index({ status: 1 });
inspectionSchema.index({ createdAt: -1 });

export const Inspection = model<IInspection>('Inspection', inspectionSchema);
