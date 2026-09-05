import mongoose, { Document, Schema } from 'mongoose';

export type DataType = 'number' | 'string' | 'boolean' | 'date';

export interface IColumnStats {
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  sum?: number;
  topValues?: Array<{ value: string; count: number }>;
}

export interface IColumnMeta {
  name: string;
  dataType: DataType;
  nullCount: number;
  uniqueCount: number;
  stats?: IColumnStats;
}

export interface IDataset extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  originalFilename: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  columns: IColumnMeta[];
  previewRows?: Record<string, any>[];
  rows: Record<string, any>[];
  createdAt: Date;
  updatedAt: Date;
}

const columnMetaSchema = new Schema<IColumnMeta>(
  {
    name: { type: String, required: true },
    dataType: {
      type: String,
      enum: ['number', 'string', 'boolean', 'date'],
      required: true,
    },
    nullCount: { type: Number, default: 0 },
    uniqueCount: { type: Number, default: 0 },
    stats: {
      min: Number,
      max: Number,
      mean: Number,
      median: Number,
      stdDev: Number,
      sum: Number,
      topValues: [{ value: String, count: Number }],
    },
  },
  { _id: false }
);

const datasetSchema = new Schema<IDataset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    rowCount: {
      type: Number,
      required: true,
      default: 0,
    },
    columnCount: {
      type: Number,
      required: true,
      default: 0,
    },
    columns: [columnMetaSchema],
    previewRows: {
      type: [Schema.Types.Mixed],
      default: [],
    } as any,
    rows: {
      type: [Schema.Types.Mixed],
      default: [],
    } as any,
  },
  {
    timestamps: true,
  }
);

// Index for user listings sorted by date
datasetSchema.index({ userId: 1, createdAt: -1 });

export const Dataset = mongoose.model<IDataset>('Dataset', datasetSchema);
