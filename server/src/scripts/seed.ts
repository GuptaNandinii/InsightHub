import fs from 'fs';
import path from 'path';
import mongoose from 'express';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Dataset } from '../models/Dataset';
import { Dashboard } from '../models/Dashboard';
import { parseCSVBuffer } from '../services/csvParser';

const seedDatabase = async () => {
  console.log('[Seed] Connecting to MongoDB...');
  await connectDB();

  try {
    // 1. Create or retrieve demo user
    const demoEmail = 'demo@insighthub.com';
    let demoUser = await User.findOne({ email: demoEmail });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo Analyst',
        email: demoEmail,
        password: 'Password123!',
        role: 'user',
      });
      console.log('[Seed] Created demo user:', demoEmail);
    } else {
      console.log('[Seed] Found existing demo user:', demoEmail);
    }

    // Clean up existing demo datasets & dashboards to ensure fresh seed
    await Dataset.deleteMany({ userId: demoUser._id });
    await Dashboard.deleteMany({ userId: demoUser._id });
    console.log('[Seed] Cleared previous demo datasets and dashboards');

    // 2. Load Sample CSVs
    const sampleDir = path.resolve(__dirname, '../../../sample_data');
    const datasetsToSeed = [
      {
        file: 'saas_sales_metrics.csv',
        name: 'SaaS Sales & Revenue Metrics',
      },
      {
        file: 'customer_churn_analysis.csv',
        name: 'Customer Churn & Retention Data',
      },
      {
        file: 'global_ecommerce_data.csv',
        name: 'Global E-Commerce Orders 2024',
      },
    ];

    const createdDatasets: Record<string, any> = {};

    for (const item of datasetsToSeed) {
      const filePath = path.join(sampleDir, item.file);
      if (!fs.existsSync(filePath)) {
        console.warn(`[Seed] File not found: ${filePath}`);
        continue;
      }

      const buffer = fs.readFileSync(filePath);
      const parsed = await parseCSVBuffer(buffer);

      const dataset = await Dataset.create({
        userId: demoUser._id,
        name: item.name,
        originalFilename: item.file,
        fileSize: buffer.length,
        rowCount: parsed.rowCount,
        columnCount: parsed.columnCount,
        columns: parsed.columns,
        rows: parsed.rows,
      });

      createdDatasets[item.file] = dataset;
      console.log(`[Seed] Imported dataset: "${item.name}" with ${parsed.rowCount} rows.`);
    }

    // 3. Create Showcase Dashboards
    const saasDataset = createdDatasets['saas_sales_metrics.csv'];
    const ecommerceDataset = createdDatasets['global_ecommerce_data.csv'];

    if (saasDataset) {
      const saasDashboard = await Dashboard.create({
        userId: demoUser._id,
        title: 'SaaS Performance & Revenue Analytics',
        description: 'Executive overview tracking regional revenue, sales rep performance, and product profitability.',
        tags: ['Sales', 'Executive', 'Revenue', 'Quarterly'],
        isPublic: true,
        shareToken: 'saas-demo-share-2026',
        widgets: [
          {
            id: 'w-1',
            title: 'Total Revenue by Region',
            chartType: 'bar',
            datasetId: saasDataset._id,
            xAxis: 'Region',
            yAxis: 'Revenue',
            aggregation: 'sum',
            colorPalette: 'indigo',
            w: 2,
            h: 1,
            x: 0,
            y: 0,
          },
          {
            id: 'w-2',
            title: 'Revenue Contribution by Segment',
            chartType: 'pie',
            datasetId: saasDataset._id,
            xAxis: 'Segment',
            yAxis: 'Revenue',
            aggregation: 'sum',
            colorPalette: 'sunset',
            w: 1,
            h: 1,
            x: 2,
            y: 0,
          },
          {
            id: 'w-3',
            title: 'Total Profit by Sales Representative',
            chartType: 'bar',
            datasetId: saasDataset._id,
            xAxis: 'SalesRep',
            yAxis: 'Profit',
            aggregation: 'sum',
            colorPalette: 'emerald',
            w: 2,
            h: 1,
            x: 0,
            y: 1,
          },
          {
            id: 'w-4',
            title: 'Units Sold by Product Line',
            chartType: 'area',
            datasetId: saasDataset._id,
            xAxis: 'Product',
            yAxis: 'UnitsSold',
            aggregation: 'sum',
            colorPalette: 'ocean',
            w: 1,
            h: 1,
            x: 2,
            y: 1,
          },
        ],
      });
      console.log(`[Seed] Created SaaS dashboard (Public Token: ${saasDashboard.shareToken})`);
    }

    if (ecommerceDataset) {
      const ecommerceDashboard = await Dashboard.create({
        userId: demoUser._id,
        title: 'Global E-Commerce & Category Insights',
        description: 'Breakdown of retail transactions across technology, furniture, and office supplies.',
        tags: ['E-Commerce', 'Operations', 'Global'],
        isPublic: true,
        shareToken: 'ecommerce-demo-share-2026',
        widgets: [
          {
            id: 'w-5',
            title: 'Sales Volume by Category',
            chartType: 'bar',
            datasetId: ecommerceDataset._id,
            xAxis: 'Category',
            yAxis: 'SalesAmount',
            aggregation: 'sum',
            colorPalette: 'ocean',
            w: 2,
            h: 1,
            x: 0,
            y: 0,
          },
          {
            id: 'w-6',
            title: 'Orders by Country',
            chartType: 'pie',
            datasetId: ecommerceDataset._id,
            xAxis: 'Country',
            yAxis: 'Quantity',
            aggregation: 'sum',
            colorPalette: 'cyberpunk',
            w: 1,
            h: 1,
            x: 2,
            y: 0,
          },
          {
            id: 'w-7',
            title: 'Sales vs Profit Correlation',
            chartType: 'scatter',
            datasetId: ecommerceDataset._id,
            xAxis: 'SalesAmount',
            yAxis: 'ProfitAmount',
            aggregation: 'none',
            colorPalette: 'indigo',
            w: 2,
            h: 1,
            x: 0,
            y: 1,
          },
          {
            id: 'w-8',
            title: 'Average Customer Rating by Category',
            chartType: 'line',
            datasetId: ecommerceDataset._id,
            xAxis: 'Category',
            yAxis: 'CustomerRating',
            aggregation: 'avg',
            colorPalette: 'emerald',
            w: 1,
            h: 1,
            x: 2,
            y: 1,
          },
        ],
      });
      console.log(`[Seed] Created E-Commerce dashboard (Public Token: ${ecommerceDashboard.shareToken})`);
    }

    console.log('[Seed] Database seeding completed successfully!');
  } catch (error) {
    console.error('[Seed] Seeding failed with error:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seedDatabase();
