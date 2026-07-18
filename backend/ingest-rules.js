/**
 * NyayaSetu Labor Rules Ingestion Utility
 * Generates embeddings for statutory labor rules and indexes them into Elasticsearch.
 */

const { Client } = require('@elastic/elasticsearch');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

// Initialize Gemini SDK with fallback safety
const geminiApiKey = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_') ? process.env.GEMINI_API_KEY : null;
if (!geminiApiKey) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY is not defined or is a placeholder in the environment. Embedding generation will run in offline Mock mode.');
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

// Pre-defined Labor Rule chunks for Delhi wage theft evaluation
const baseRules = [
  {
    text: "Minimum wage for Unskilled workers in Delhi is set at ₹710 per day. The standard work shift is 8 hours. Work beyond this shift qualifies as overtime and must be compensated at double the normal rate under Section 14 of the Minimum Wages Act.",
    category: "unskilled",
    location: "Delhi",
    daily_base_pay: 710,
    standard_shift_hours: 8,
    statutory_reference: "Section 14, Minimum Wages Act"
  },
  {
    text: "Minimum wage for Semi-Skilled workers in Delhi is set at ₹780 per day. The standard work shift is 8 hours. Overtime beyond 8 hours daily requires double-rate compensation under Section 14 of the Minimum Wages Act.",
    category: "semi-skilled",
    location: "Delhi",
    daily_base_pay: 780,
    standard_shift_hours: 8,
    statutory_reference: "Section 14, Minimum Wages Act"
  },
  {
    text: "Minimum wage for Skilled workers in Delhi is set at ₹860 per day. The standard work shift is 8 hours. Overtime beyond 8 hours daily requires double-rate compensation under Section 14 of the Minimum Wages Act.",
    category: "skilled",
    location: "Delhi",
    daily_base_pay: 860,
    standard_shift_hours: 8,
    statutory_reference: "Section 14, Minimum Wages Act"
  }
];

const categories = ["unskilled", "semi-skilled", "skilled"];
const basePays = {
  "unskilled": 710,
  "semi-skilled": 780,
  "skilled": 860
};

const generalRulesTemplates = [
  {
    textTemplate: (category, pay) => `Under Section 8 of the Delhi Shops and Establishments Act, 1954, no adult employee shall be employed for more than 9 hours on any day or 48 hours in any week. Overtime work beyond these hours is entitled to double rate compensation. For ${category} labor, the daily wage rate is ₹${pay} per day for a standard 8-hour shift, making the normal hourly wage ₹${(pay/8).toFixed(2)} and the overtime rate ₹${((pay/8)*2).toFixed(2)} per hour.`,
    statutory_reference: "Section 8, Delhi Shops and Establishments Act, 1954",
    standard_shift_hours: 8
  },
  {
    textTemplate: (category, pay) => `Under Section 10 of the Delhi Shops and Establishments Act, 1954, the period of work of an employee must be fixed such that no period of continuous work exceeds five hours. Employees must be allowed a rest and meal interval of at least half an hour after five hours of work.`,
    statutory_reference: "Section 10, Delhi Shops and Establishments Act, 1954",
    standard_shift_hours: 8
  },
  {
    textTemplate: (category, pay) => `Under Section 11 of the Delhi Shops and Establishments Act, 1954, the spread-over period of work for an employee, inclusive of rest and meal intervals, must not exceed 10.5 hours on any day in a commercial establishment or 12 hours on any day in a shop.`,
    statutory_reference: "Section 11, Delhi Shops and Establishments Act, 1954",
    standard_shift_hours: 8
  },
  {
    textTemplate: (category, pay) => `Under Section 12 of the Delhi Shops and Establishments Act, 1954, read with the Child Labour (Prohibition and Regulation) Act, 1986, the employment of children below 14 years of age is strictly prohibited in any shop or commercial establishment.`,
    statutory_reference: "Section 12, Delhi Shops and Establishments Act, 1954",
    standard_shift_hours: 8
  },
  {
    textTemplate: (category, pay) => `Under Section 13 of the Delhi Shops and Establishments Act, 1954, young persons (between 14 and 18 years of age) are restricted to a maximum of 6 hours of work per day. They cannot work for more than 3.5 hours continuously without an interval of at least half an hour for rest or meals, and their spread-over must not exceed 8 hours on any day.`,
    statutory_reference: "Section 13, Delhi Shops and Establishments Act, 1954",
    standard_shift_hours: 6
  },
  {
    textTemplate: (category, pay) => `Under Section 14 of the Delhi Shops and Establishments Act, 1954, no young person or woman shall be allowed or required to work in any establishment during night hours. This is defined as between 9 p.m. and 7 a.m. in summer (April 1 to September 30) and between 8 p.m. and 8 a.m. in winter (October 1 to March 31).`,
    statutory_reference: "Section 14, Delhi Shops and Establishments Act, 1954",
    standard_shift_hours: 8
  },
  {
    textTemplate: (category, pay) => `Under Section 17 of the Delhi Shops and Establishments Act, 1954, every employee in a shop or commercial establishment must be allowed at least twenty-four consecutive hours of rest (weekly holiday) in every week.`,
    statutory_reference: "Section 17, Delhi Shops and Establishments Act, 1954",
    standard_shift_hours: 8
  },
  {
    textTemplate: (category, pay) => `Under Section 18 of the Delhi Shops and Establishments Act, 1954, no deduction shall be made from the wages of any employee on account of the weekly holiday or close day. Employees on daily or piece wages must be paid their full daily wages for the holiday.`,
    statutory_reference: "Section 18, Delhi Shops and Establishments Act, 1954",
    standard_shift_hours: 8
  },
  {
    textTemplate: (category, pay) => `Under Section 19 of the Delhi Shops and Establishments Act, 1954, wage periods must not exceed one month, and wages must be paid in cash on a working day within 7 days of the end of the wage period. If employment is terminated, all earned wages must be paid within 2 working days.`,
    statutory_reference: "Section 19, Delhi Shops and Establishments Act, 1954",
    standard_shift_hours: 8
  },
  {
    textTemplate: (category, pay) => `Under Section 22 of the Delhi Shops and Establishments Act, 1954, employees are entitled to privilege leave of not less than 15 days after 12 months of continuous service (30 days for watchmen/caretakers), which can accumulate up to three times the annual limit. Employees are also entitled to 12 days of casual or sickness leave per year.`,
    statutory_reference: "Section 22, Delhi Shops and Establishments Act, 1954",
    standard_shift_hours: 8
  },
  {
    textTemplate: (category, pay) => `Under Section 30 of the Delhi Shops and Establishments Act, 1954, no employer can dismiss an employee with 3 months or more of continuous service without giving at least 1 month's notice in writing or 1 month's wages in lieu of notice, except in cases of misconduct.`,
    statutory_reference: "Section 30, Delhi Shops and Establishments Act, 1954",
    standard_shift_hours: 8
  },
  {
    textTemplate: (category, pay) => `Under Section 34 of the Delhi Shops and Establishments Act, 1954, every employer must furnish every employee with a written letter of appointment containing their name, the establishment name/address, age, hours of work, date of appointment, and wage rate.`,
    statutory_reference: "Section 34, Delhi Shops and Establishments Act, 1954",
    standard_shift_hours: 8
  }
];

const laborRules = [...baseRules];
for (const category of categories) {
  const pay = basePays[category];
  for (const template of generalRulesTemplates) {
    laborRules.push({
      text: template.textTemplate(category, pay),
      category: category,
      location: "Delhi",
      daily_base_pay: pay,
      standard_shift_hours: template.standard_shift_hours,
      statutory_reference: template.statutory_reference
    });
  }
}

/**
 * Creates the Elasticsearch index with dense_vector mappings for semantic search
 */
async function initializeIndex() {
  try {
    const exists = await esClient.indices.exists({ index: INDEX_NAME });
    
    if (exists) {
      console.log(`Index "${INDEX_NAME}" already exists. Re-creating to apply latest mappings...`);
      await esClient.indices.delete({ index: INDEX_NAME });
    }

    await esClient.indices.create({
      index: INDEX_NAME,
      body: {
        mappings: {
          properties: {
            text: { type: 'text' },
            category: { type: 'keyword' },
            location: { type: 'keyword' },
            daily_base_pay: { type: 'double' },
            standard_shift_hours: { type: 'integer' },
            statutory_reference: { type: 'text' },
            vector_embedding: {
              type: 'dense_vector',
              dims: 768, // text-embedding-004 uses 768 dimensions
              index: true,
              similarity: 'cosine'
            }
          }
        }
      }
    });
    console.log(`✅ Successfully created index "${INDEX_NAME}" with dense_vector mapping.`);
  } catch (error) {
    console.error('❌ Failed to initialize Elasticsearch index:', error.message);
    throw error;
  }
}

/**
 * Generates vector embeddings for a text block using Gemini's text-embedding-004
 */
async function generateEmbedding(text) {
  if (!process.env.GEMINI_API_KEY) {
    // Generate a mock vector of 768 dimensions if no API key is present for localized dry runs
    console.log('Generating mock 768-dimension vector for local offline debugging...');
    return Array.from({ length: 768 }, () => Math.random() - 0.5);
  }
  
  try {
    const result = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: text,
      config: {
        outputDimensionality: 768
      }
    });
    
    if (result && result.embeddings && result.embeddings[0] && result.embeddings[0].values) {
      return result.embeddings[0].values;
    } else {
      throw new Error('Invalid response structure from Gemini Embedding API');
    }
  } catch (error) {
    console.error(`❌ Failed to generate embedding for text "${text.substring(0, 30)}...":`, error.message);
    throw error;
  }
}

/**
 * Main execution script to run rule ingestion pipeline
 */
async function runIngestion() {
  console.log('🚀 Starting NyayaSetu Data Ingestion Utility...');
  
  try {
    // Initialize Elasticsearch Connection & Mapping
    await initializeIndex();
    
    console.log(`Generating embeddings and indexing ${laborRules.length} labor rule chunks...`);
    
    for (let i = 0; i < laborRules.length; i++) {
      const rule = laborRules[i];
      console.log(`Processing [${i + 1}/${laborRules.length}] - Category: ${rule.category}`);
      
      const embedding = await generateEmbedding(rule.text);
      
      // Index document with high-dimensional vector
      await esClient.index({
        index: INDEX_NAME,
        id: `rule-${rule.category}-${rule.location.toLowerCase()}-${i}`,
        body: {
          text: rule.text,
          category: rule.category,
          location: rule.location,
          daily_base_pay: rule.daily_base_pay,
          standard_shift_hours: rule.standard_shift_hours,
          statutory_reference: rule.statutory_reference,
          vector_embedding: embedding
        }
      });
      
      console.log(`✅ Indexed rule for category "${rule.category}"`);
    }
    
    console.log('🎉 Elasticsearch data ingestion completed successfully!');
  } catch (error) {
    console.error('❌ Data Ingestion pipeline failed:', error);
    process.exit(1);
  }
}

// Execute the ingestion utility
runIngestion();
