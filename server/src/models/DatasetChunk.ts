import mongoose, { Document, Schema } from 'mongoose';

export interface IDatasetChunk extends Document {
  _id: mongoose.Types.ObjectId;
  datasetId: mongoose.Types.ObjectId;
  chunkIndex: number;
  rowCount: number;
  rows: Record<string, any>[];
  createdAt: Date;
  updatedAt: Date;
}

const datasetChunkSchema = new Schema<IDatasetChunk>(
  {
    datasetId: {
      type: Schema.Types.ObjectId,
      ref: 'Dataset',
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    rowCount: {
      type: Number,
      required: true,
      default: 0,
    },
    rows: {
      type: [Schema.Types.Mixed],
      required: true,
      default: [],
    } as any,
  },
  {
    timestamps: true,
  }
);

// Compound index for fast sequential retrieval
datasetChunkSchema.index({ datasetId: 1, chunkIndex: 1 }, { unique: true });

export const DatasetChunk = mongoose.model<IDatasetChunk>('DatasetChunk', datasetChunkSchema);
