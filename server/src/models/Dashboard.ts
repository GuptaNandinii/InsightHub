import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter';
export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
export type ColorPalette = 'indigo' | 'emerald' | 'cyberpunk' | 'sunset' | 'ocean' | 'monochrome';

export interface IDashboardWidget {
  id: string;
  title: string;
  chartType: ChartType;
  datasetId: mongoose.Types.ObjectId;
  xAxis: string;
  yAxis?: string;
  aggregation: AggregationType;
  colorPalette: ColorPalette;
  w: number; // grid column span: 1, 2, or 3
  h: number; // grid row span: 1 or 2
  x: number; // order position
  y: number;
  filterField?: string;
  filterValue?: string;
}

export interface IDashboard extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  tags: string[];
  isPublic: boolean;
  shareToken: string;
  widgets: IDashboardWidget[];
  createdAt: Date;
  updatedAt: Date;
}

const widgetSchema = new Schema<IDashboardWidget>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, default: 'Untitled Chart' },
    chartType: {
      type: String,
      enum: ['bar', 'line', 'area', 'pie', 'scatter'],
      default: 'bar',
    },
    datasetId: {
      type: Schema.Types.ObjectId,
      ref: 'Dataset',
      required: true,
    },
    xAxis: { type: String, required: true },
    yAxis: { type: String },
    aggregation: {
      type: String,
      enum: ['sum', 'avg', 'count', 'min', 'max', 'none'],
      default: 'none',
    },
    colorPalette: {
      type: String,
      enum: ['indigo', 'emerald', 'cyberpunk', 'sunset', 'ocean', 'monochrome'],
      default: 'indigo',
    },
    w: { type: Number, default: 2 }, // 2 columns wide by default in 3-col grid
    h: { type: Number, default: 1 },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    filterField: { type: String },
    filterValue: { type: String },
  },
  { _id: false }
);

const dashboardSchema = new Schema<IDashboard>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Dashboard title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareToken: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(16).toString('hex'),
      index: true,
    },
    widgets: {
      type: [widgetSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

dashboardSchema.index({ userId: 1, createdAt: -1 });

export const Dashboard = mongoose.model<IDashboard>('Dashboard', dashboardSchema);
