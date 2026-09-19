import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { Inspection, type InspectionStatus } from '../models/Inspection';
import { getOrCreateDefaultInspector } from '../utils/defaultUser';

const router = Router();

// Configure disk storage for real image uploads
const uploadDir = path.resolve(config.uploadDir);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `tray_${Date.now()}_${uuidv4().substring(0, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are accepted'));
    }
  },
});

// List inspections from MongoDB
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query as { status?: InspectionStatus; search?: string };
    const query: Record<string, any> = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { 'batchInfo.batchId': regex },
        { 'batchInfo.procurementCentre': regex },
        { 'batchInfo.farmerName': regex },
        { 'batchInfo.variety': regex },
      ];
    }

    const inspections = await Inspection.find(query)
      .populate('inspectorId', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: inspections,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch inspections: ${err.message}`,
      code: 'DB_ERROR',
    });
  }
});

// Create inspection in MongoDB
router.post('/', async (req: Request, res: Response) => {
  try {
    const { batchInfo } = req.body;
    if (!batchInfo || !batchInfo.batchId || !batchInfo.procurementCentre) {
      return res.status(400).json({
        success: false,
        message: 'batchId and procurementCentre are required',
        code: 'VALIDATION_ERROR',
      });
    }

    const inspector = await getOrCreateDefaultInspector();

    const newInspection = await Inspection.create({
      batchInfo,
      inspectorId: inspector._id,
      status: 'draft',
      imageReferences: [],
    });

    const populated = await Inspection.findById(newInspection._id).populate(
      'inspectorId',
      'name email role'
    );

    res.status(201).json({
      success: true,
      message: 'Inspection batch created successfully',
      data: populated,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `An inspection batch with ID '${req.body.batchInfo?.batchId}' already exists.`,
        code: 'DUPLICATE_BATCH_ID',
      });
    }
    res.status(500).json({
      success: false,
      message: `Failed to create inspection: ${err.message}`,
      code: 'DB_ERROR',
    });
  }
});

// Get inspection by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const inspection = await Inspection.findById(req.params.id).populate(
      'inspectorId',
      'name email role'
    );

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: `Inspection batch not found with ID: ${req.params.id}`,
        code: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: inspection,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Failed to retrieve inspection: ${err.message}`,
      code: 'DB_ERROR',
    });
  }
});

// Update inspection
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await Inspection.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('inspectorId', 'name email role');

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Inspection batch not found with ID: ${req.params.id}`,
        code: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Failed to update inspection: ${err.message}`,
      code: 'DB_ERROR',
    });
  }
});

// Cancel inspection
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const updated = await Inspection.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    ).populate('inspectorId', 'name email role');

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Inspection batch not found with ID: ${req.params.id}`,
        code: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      message: 'Inspection cancelled',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Failed to cancel inspection: ${err.message}`,
      code: 'DB_ERROR',
    });
  }
});

// Upload images for an inspection
router.post('/:id/images', upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files were uploaded',
        code: 'NO_FILES',
      });
    }

    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: `Inspection batch not found with ID: ${req.params.id}`,
        code: 'NOT_FOUND',
      });
    }

    // Build URL paths for uploaded images
    const serverOrigin = `${req.protocol}://${req.get('host')}`;
    const newImageUrls = files.map((f) => `${serverOrigin}/uploads/${f.filename}`);

    inspection.imageReferences.push(...newImageUrls);
    if (inspection.status === 'draft') {
      inspection.status = 'images_uploaded';
    }
    await inspection.save();

    const populated = await Inspection.findById(inspection._id).populate(
      'inspectorId',
      'name email role'
    );

    res.json({
      success: true,
      message: `${files.length} image(s) uploaded successfully`,
      data: populated,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Failed to upload images: ${err.message}`,
      code: 'UPLOAD_ERROR',
    });
  }
});

export default router;
