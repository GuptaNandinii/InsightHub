import mongoose from 'mongoose';
import { Dataset } from '../models/Dataset';
import { DatasetChunk } from '../models/DatasetChunk';

export const CHUNK_SIZE = 1000;

/**
 * Save dataset rows in chunks of CHUNK_SIZE into DatasetChunk collection
 * to prevent hitting the MongoDB 16MB single document limit.
 */
export async function saveDatasetRows(
  datasetId: mongoose.Types.ObjectId | string,
  rows: Record<string, any>[]
): Promise<void> {
  // Delete existing chunks if overwriting / updating dataset
  await DatasetChunk.deleteMany({ datasetId });

  if (!rows || rows.length === 0) {
    return;
  }

  const chunkDocs = [];
  const totalChunks = Math.ceil(rows.length / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const chunkRows = rows.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    chunkDocs.push({
      datasetId,
      chunkIndex: i,
      rowCount: chunkRows.length,
      rows: chunkRows,
    });
  }

  // Insert in batches of 25 chunks to prevent large bulk write payloads
  const BATCH_SIZE = 25;
  for (let b = 0; b < chunkDocs.length; b += BATCH_SIZE) {
    const batch = chunkDocs.slice(b, b + BATCH_SIZE);
    await DatasetChunk.insertMany(batch, { ordered: true });
  }
}

/**
 * Retrieve all rows for a given dataset.
 * Checks DatasetChunk first. If none exist (e.g. legacy documents or test fixtures),
 * gracefully falls back to Dataset.rows or Dataset.previewRows.
 */
export async function getDatasetRows(
  datasetId: mongoose.Types.ObjectId | string
): Promise<Record<string, any>[]> {
  const chunks = await DatasetChunk.find({ datasetId })
    .sort({ chunkIndex: 1 })
    .lean();

  if (chunks.length > 0) {
    return chunks.flatMap((c) => c.rows);
  }

  // Fallback for legacy or test datasets
  const dataset = await Dataset.findById(datasetId)
    .select('rows previewRows')
    .lean();

  if (!dataset) return [];

  if (dataset.rows && dataset.rows.length > 0) {
    return dataset.rows;
  }

  return (dataset as any).previewRows || [];
}

/**
 * Cascading delete of all chunk documents for a dataset
 */
export async function deleteDatasetRows(
  datasetId: mongoose.Types.ObjectId | string
): Promise<void> {
  await DatasetChunk.deleteMany({ datasetId });
}
