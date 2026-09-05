import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { ENV } from '../src/config/env';
import { Dataset } from '../src/models/Dataset';
import { DatasetChunk } from '../src/models/DatasetChunk';
import {
  saveDatasetRows,
  getDatasetRows,
  deleteDatasetRows,
  CHUNK_SIZE,
} from '../src/services/datasetStorageService';

describe('Chunked Dataset Storage Service', () => {
  const dummyUserId = new mongoose.Types.ObjectId();
  const dummyDatasetId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(ENV.MONGO_URI);
    }
    await DatasetChunk.deleteMany({ datasetId: dummyDatasetId });
    await Dataset.deleteMany({ _id: dummyDatasetId });
  });

  afterAll(async () => {
    await DatasetChunk.deleteMany({ datasetId: dummyDatasetId });
    await Dataset.deleteMany({ _id: dummyDatasetId });
  });

  it('should split 2,500 rows into 3 chunk documents of 1,000, 1,000, and 500 rows', async () => {
    // Generate 2500 synthetic rows
    const testRows = Array.from({ length: 2500 }, (_, i) => ({
      id: i + 1,
      name: `Record_${i + 1}`,
      value: Math.round(Math.random() * 1000),
      category: i % 2 === 0 ? 'GroupA' : 'GroupB',
    }));

    // Save in chunks
    await saveDatasetRows(dummyDatasetId, testRows);

    // Verify chunk documents in MongoDB
    const chunks = await DatasetChunk.find({ datasetId: dummyDatasetId }).sort({ chunkIndex: 1 });
    expect(chunks.length).toBe(3);

    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[0].rowCount).toBe(CHUNK_SIZE);
    expect(chunks[0].rows.length).toBe(CHUNK_SIZE);
    expect(chunks[0].rows[0].id).toBe(1);

    expect(chunks[1].chunkIndex).toBe(1);
    expect(chunks[1].rowCount).toBe(CHUNK_SIZE);
    expect(chunks[1].rows.length).toBe(CHUNK_SIZE);
    expect(chunks[1].rows[0].id).toBe(1001);

    expect(chunks[2].chunkIndex).toBe(2);
    expect(chunks[2].rowCount).toBe(500);
    expect(chunks[2].rows.length).toBe(500);
    expect(chunks[2].rows[499].id).toBe(2500);
  });

  it('should retrieve all 2,500 rows seamlessly in order via getDatasetRows', async () => {
    const retrievedRows = await getDatasetRows(dummyDatasetId);
    expect(retrievedRows.length).toBe(2500);
    expect(retrievedRows[0].id).toBe(1);
    expect(retrievedRows[999].id).toBe(1000);
    expect(retrievedRows[1000].id).toBe(1001);
    expect(retrievedRows[2499].id).toBe(2500);
  });

  it('should fall back gracefully to Dataset.rows if no chunks exist (legacy support)', async () => {
    const legacyDatasetId = new mongoose.Types.ObjectId();
    await Dataset.create({
      _id: legacyDatasetId,
      userId: dummyUserId,
      name: 'Legacy Test Dataset',
      originalFilename: 'legacy.csv',
      fileSize: 100,
      rowCount: 2,
      columnCount: 1,
      columns: [{ name: 'col1', dataType: 'string', nullCount: 0, uniqueCount: 2 }],
      rows: [{ col1: 'legacy_val_1' }, { col1: 'legacy_val_2' }],
    });

    const rows = await getDatasetRows(legacyDatasetId);
    expect(rows.length).toBe(2);
    expect(rows[0].col1).toBe('legacy_val_1');

    await Dataset.findByIdAndDelete(legacyDatasetId);
  });

  it('should delete all chunk documents when deleteDatasetRows is called', async () => {
    await deleteDatasetRows(dummyDatasetId);
    const chunks = await DatasetChunk.find({ datasetId: dummyDatasetId });
    expect(chunks.length).toBe(0);

    const rowsAfterDelete = await getDatasetRows(dummyDatasetId);
    expect(rowsAfterDelete.length).toBe(0);
  });
});
