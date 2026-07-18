/**
 * NyayaSetu Express Backend Server
 * Production-ready Express application implementing the multi-step cognitive + deterministic pipeline
 */

const express = require('express');
const cors = require('cors');
const { Client } = require('@elastic/elasticsearch');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS and JSON parsing middlewares
app.use(cors());
app.use(express.json());

// Serve static diagnostic frontend dashboard
app.use(express.static('public'));

// Initialize Gemini SDK with fallback safety
const geminiApiKey = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_') ? process.env.GEMINI_API_KEY : null;
if (!geminiApiKey) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY is not defined or is a placeholder in the environment. AI features will run in Mock Fallback mode.');
}
const ai = new GoogleGenAI({ apiKey: geminiApiKey || 'MOCK_API_KEY_FALLBACK' });

// Initialize Elasticsearch Client with placeholder safety
const clientOptions = {};
const cloudId = process.env.ELASTICSEARCH_CLOUD_ID && !process.env.ELASTICSEARCH_CLOUD_ID.includes('your_') ? process.env.ELASTICSEARCH_CLOUD_ID : null;
const apiKey = process.env.ELASTICSEARCH_API_KEY && !process.env.ELASTICSEARCH_API_KEY.includes('your_') ? process.env.ELASTICSEARCH_API_KEY : null;

if (cloudId) {
  clientOptions.cloud = { id: cloudId };
} else {
  clientOptions.node = process.env.ELASTICSEARCH_NODE_URL || 'http://localhost:9200';
}

if (apiKey) {
  clientOptions.auth = { apiKey: apiKey };
} else if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
  clientOptions.auth = {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD
  };
}

const esClient = new Client(clientOptions);
const INDEX_NAME = 'delhi-labor-rules';

// JSON schema to enforce on Gemini entity extraction
const extractionSchema = {
  type: 'OBJECT',
  properties: {
    hoursWorked: { type: 'NUMBER', description: 'Total hours worked by the laborer.' },
    payReceived: { type: 'NUMBER', description: 'Total amount of money paid to the laborer in Rupees.' },
    jobType: {
      type: 'STRING',
      enum: ['unskilled', 'semi-skilled', 'skilled'],
      description: 'The skill level of the worker based on their described duties.'
    },
    location: { type: 'STRING', description: 'The region or city where the work took place.' }
  },
  required: ['hoursWorked', 'payReceived', 'jobType', 'location']
};

/**
 * Endpoint to analyze a labor claim case
 * Expects: { "workerInput": "raw text description of work" }
 */
app.post('/api/analyze-case', async (req, res) => {
  const { workerInput } = req.body;

  if (!workerInput) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Request: "workerInput" field is required.'
    });
  }

  console.log(`\n📥 Received case analysis request: "${workerInput.substring(0, 100)}..."`);

  // Default fallbacks in case API services fail
  let extractedData = {
    hoursWorked: 8,
    payReceived: 0,
    jobType: 'unskilled',
    location: 'Delhi'
  };

  // =========================================================================
  // STEP A: Gemini Entity Extraction
  // =========================================================================
  try {
    if (process.env.GEMINI_API_KEY) {
      console.log('Step A: Executing Gemini Entity Extraction...');

      const prompt = `You are a precise JSON extractor. Analyze the following migrant worker input. Extract the total hours worked, the pay received, the job type (unskilled, semi-skilled, or skilled), and the location.
      
Worker Input: "${workerInput}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "Extract labor parameters strictly. If hours worked is not mentioned, default to 8. If pay received is not mentioned, default to 0. If skill category is ambiguous, classify based on standard manual labor (e.g. bricklaying/sweeping=unskilled, carpenter helper=semi-skilled, chief welder/electrician=skilled). If location is not clear, default to 'Delhi'.",
          responseMimeType: 'application/json',
          responseSchema: extractionSchema,
          temperature: 0.1
        }
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim());
        // Validate types just in case
        extractedData = {
          hoursWorked: Number(parsed.hoursWorked) || 8,
          payReceived: Number(parsed.payReceived) || 0,
          jobType: ['unskilled', 'semi-skilled', 'skilled'].includes(parsed.jobType) ? parsed.jobType : 'unskilled',
          location: parsed.location || 'Delhi'
        };
        console.log('✅ Step A successful. Extracted parameters:', extractedData);
      } else {
        throw new Error('Empty response text from Gemini');
      }
    } else {
      console.warn('⚠️ GEMINI_API_KEY is not defined. Skipping Step A and using offline fallback rules.');
      // Offline fallback logic: simple regex parser for testing
      const lower = workerInput.toLowerCase();

      // Match hours
      const hoursMatch = lower.match(/(\d+)\s*(hour|hr)/);
      if (hoursMatch) extractedData.hoursWorked = Number(hoursMatch[1]);

      // Match pay
      const payMatch = lower.match(/(?:rs\.?|₹|rupees?|paid)\s*(\d+)/) || lower.match(/(\d+)\s*(rs|rupees)/);
      if (payMatch) extractedData.payReceived = Number(payMatch[1]);

      // Match skill
      if (lower.includes('skilled') && !lower.includes('unskilled') && !lower.includes('semi-skilled')) {
        extractedData.jobType = 'skilled';
      } else if (lower.includes('semi')) {
        extractedData.jobType = 'semi-skilled';
      } else {
        extractedData.jobType = 'unskilled';
      }

      console.log('✅ Offline regex extraction parameters:', extractedData);
    }
  } catch (error) {
    console.error('❌ Step A (Gemini Entity Extraction) failed:', error.message);
    // Keep defaults
  }

  // =========================================================================
  // STEP B: Elasticsearch Semantic Grounding
  // =========================================================================
  // Default legal parameters as safe-fallbacks (Minimum Wage thresholds, standard shift)
  let baseDailyPay = 710; // Default: Daily Unskilled Base = ₹710/day
  let standardShiftHours = 8; // Default: Standard Shift = 8 hours
  let statutoryReference = 'Section 14 of the Minimum Wages Act';

  // Apply basic category fallback rules immediately before querying DB
  if (extractedData.jobType === 'semi-skilled') baseDailyPay = 780;
  if (extractedData.jobType === 'skilled') baseDailyPay = 860;

  try {
    if (process.env.ELASTICSEARCH_CLOUD_ID || process.env.ELASTICSEARCH_NODE_URL) {
      console.log('Step B: Generating search embedding and querying Elasticsearch...');

      let queryVector;
      if (process.env.GEMINI_API_KEY) {
        const embeddingResult = await ai.models.embedContent({
          model: 'gemini-embedding-2',
          contents: workerInput,
          config: {
            outputDimensionality: 768
          }
        });
        queryVector = embeddingResult.embeddings[0].values;
      } else {
        // Mock query vector for offline mode
        queryVector = Array.from({ length: 768 }, () => Math.random() - 0.5);
      }

      // Hybrid Elasticsearch query: lexical category search combined with dense vector semantic matching
      const esResponse = await esClient.search({
        index: INDEX_NAME,
        query: {
          bool: {
            must: [
              {
                match: {
                  category: {
                    query: extractedData.jobType,
                    boost: 1.5
                  }
                }
              }
            ],
            should: [
              {
                match: {
                  location: {
                    query: extractedData.location,
                    boost: 1.0
                  }
                }
              }
            ]
          }
        },
        knn: {
          field: 'vector_embedding',
          query_vector: queryVector,
          k: 3,
          num_candidates: 50,
          boost: 2.0
        },
        size: 1
      });

      if (esResponse && esResponse.hits && esResponse.hits.hits.length > 0) {
        const bestMatch = esResponse.hits.hits[0]._source;
        baseDailyPay = bestMatch.daily_base_pay || baseDailyPay;
        standardShiftHours = bestMatch.standard_shift_hours || standardShiftHours;
        statutoryReference = bestMatch.statutory_reference || statutoryReference;
        console.log(`✅ Step B successful. Grounded parameters from index: DailyBase=₹${baseDailyPay}, Shift=${standardShiftHours} hrs. Ref: ${statutoryReference}`);
      } else {
        console.warn('⚠️ Elasticsearch search returned 0 results. Using baseline default parameters.');
      }
    } else {
      console.warn('⚠️ Elasticsearch is not configured. Utilizing default local baseline parameter maps.');
    }
  } catch (error) {
    console.error('❌ Step B (Elasticsearch Grounding) failed:', error.message);
    // Keep local category defaults
  }

  // =========================================================================
  // STEP C: Deterministic Rule Engine Math
  // =========================================================================
  console.log('Step C: Executing Deterministic Rule Engine Math...');

  // Compute standard hourly wage rate: (Base Daily Pay / Standard Shift Hours)
  const standardHourlyWageRate = Number((baseDailyPay / standardShiftHours).toFixed(2));

  // Compute overtime hours: Max(0, hoursWorked - Standard Shift Hours)
  const overtimeHours = Math.max(0, extractedData.hoursWorked - standardShiftHours);

  // Compute overtime pay due: Overtime Hours * (Standard Hourly Wage Rate * 2)
  const overtimePayDue = Number((overtimeHours * (standardHourlyWageRate * 2)).toFixed(2));

  // Compute total rightful compensation: Base Daily Pay + Overtime Pay Due
  const totalRightfulCompensation = Number((baseDailyPay + overtimePayDue).toFixed(2));

  // Compute wage theft shortfall: Max(0, Total Rightful Compensation - payReceived)
  const wageTheftShortfall = Math.max(0, Number((totalRightfulCompensation - extractedData.payReceived).toFixed(2)));

  console.log(`✅ Step C results: Rate=₹${standardHourlyWageRate}/hr, OT Hours=${overtimeHours}, OT Pay=₹${overtimePayDue}, Rightful=₹${totalRightfulCompensation}, Shortfall=₹${wageTheftShortfall}`);

  // =========================================================================
  // STEP D: Automated Legal Action Alert & Log Assembly
  // =========================================================================
  console.log('Step D: Generating Statutory Violation Logs & WhatsApp Webhook Alert...');

  const violationsLog = [];
  let status = 'COMPLIANT';

  if (wageTheftShortfall > 0) {
    status = 'RED_ALERT_VIOLATION';

    if (overtimeHours > 0) {
      violationsLog.push(`Forced to work ${overtimeHours} overtime hours without mandated statutory double-pay compensation.`);
    }

    if (extractedData.payReceived < baseDailyPay) {
      violationsLog.push(`Base payout distributed falls short of the legal minimum wage threshold floor.`);
    }

    // Catch-all detail log
    if (violationsLog.length === 0) {
      violationsLog.push(`Worker compensation falls short of overall statutory guidelines by ₹${wageTheftShortfall}.`);
    }
  }

  // Draft a formal legal notification layout text targeting a WhatsApp webhook context
  const automatedMessage = `🚨 *NYAYASETU LEGAL ACTION WARNING* 🚨
*Contractor Alert:* Under ${statutoryReference}, a worker categorized as *${extractedData.jobType}* labor in *${extractedData.location}* was shorted *₹${wageTheftShortfall}* for their shift.
*Details of Claimed Incident:*
- Total Shift Length: ${extractedData.hoursWorked} hours (Statutory Shift: ${standardShiftHours} hours)
- Overtime Logged: ${overtimeHours} hours (Mandated rate: Double-time ₹${(standardHourlyWageRate * 2).toFixed(2)}/hr)
- Amount Received: ₹${extractedData.payReceived} (Statutory Daily Base Minimum: ₹${baseDailyPay})
- Total Rightful Compensation: ₹${totalRightfulCompensation} (Base: ₹${baseDailyPay} + OT Pay: ₹${overtimePayDue})

Failure to disburse the shortfall of *₹${wageTheftShortfall}* immediately represents a clear violation of the Minimum Wages Act. Please rectify this payment discrepancy to avoid formal statutory prosecution and heavy administrative penalties.`;

  // Define exact JSON response contract to align perfectly with Next.js frontend requirements
  const responseContract = {
    success: true,
    extractedData: {
      hoursWorked: extractedData.hoursWorked,
      payReceived: extractedData.payReceived,
      jobType: extractedData.jobType,
      location: extractedData.location
    },
    assessment: {
      status: status,
      rightfulCompensation: totalRightfulCompensation,
      theftAmount: wageTheftShortfall,
      violationsLog: violationsLog,
      automatedMessage: automatedMessage
    }
  };

  console.log('📤 Sending response payload matching contract specifications.');
  res.status(200).json(responseContract);
});

// Resilient Global Error Catch-All
app.use((err, req, res, next) => {
  console.error('❌ Critical Server Error caught by fallback wall:', err);
  res.status(500).json({
    success: false,
    error: 'Critical internal orchestration server error. Check node process logs.'
  });
});

// Start the server with resilient port binding
function startServer(port) {
  const server = app.listen(port, () => {
    const activePort = server.address().port;
    console.log(`🚀 NyayaSetu Engine running seamlessly on port ${activePort}.`);
    console.log(`👉 Update your test endpoint or frontend base URL to: http://localhost:${activePort}/api/analyze-case`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} is in use, trying a dynamic port instead...`);
      startServer(0);
    } else {
      console.error('❌ Server startup error:', err);
    }
  });
}

startServer(process.env.PORT || 8080);