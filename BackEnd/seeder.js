/**
 * ============================================================================
 * AgriSmart - Large-Scale Data Seeder
 * ============================================================================
 *
 * Generates 2000 realistic agricultural products with dummy farmers
 * for performance testing, pagination, search/filter, and analytics.
 *
 * Usage:
 *   node seeder.js              → Seed data (adds to existing)
 *   node seeder.js --delete     → Delete existing products + farmers, then seed
 *   node seeder.js --count 3000 → Generate 3000 products instead of default 2000
 *
 * Tech choices:
 * - No faker.js: Keeps dependencies minimal; custom generators are sufficient
 * - insertMany: MongoDB bulk insert for ~100x speed vs individual .save()
 * - Batching: 500 records per batch to prevent memory spikes
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Resolve .env from same directory as this file
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

// Models
import User from './models/User.js';
import Product from './models/Product.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_PRODUCT_COUNT = 2000;
const BATCH_SIZE = 500;
const FARMER_COUNT = 10;

// Parse CLI arguments
const args = process.argv.slice(2);
const shouldDelete = args.includes('--delete');
const countArg = args.find((arg) => arg.startsWith('--count='));
const PRODUCT_COUNT = countArg ? parseInt(countArg.split('=')[1], 10) : DEFAULT_PRODUCT_COUNT;

// ============================================================================
// REALISTIC INDIAN AGRICULTURAL DATA
// ============================================================================

const CATEGORIES = ['grains', 'vegetables', 'fruits', 'dairy', 'spices', 'seeds', 'other'];

// Products mapped by category
const PRODUCT_CATALOG = {
  grains: [
    { names: ['Basmati Rice', 'Sona Masoori Rice', 'Wheat', 'Bajra', 'Jowar', 'Ragi', 'Maize', 'Oats', 'Barley', 'Quinoa'], unit: 'kg' },
    { names: ['Organic Basmati Rice', 'Brown Rice', 'Parboiled Rice', 'Puffed Rice', 'Poha'], unit: 'kg' },
  ],
  vegetables: [
    { names: ['Tomato', 'Potato', 'Onion', 'Brinjal', 'Okra', 'Cauliflower', 'Cabbage', 'Spinach', 'Fenugreek', 'Bottle Gourd'], unit: 'kg' },
    { names: ['Bitter Gourd', 'Ridge Gourd', 'Snake Gourd', 'Pumpkin', 'Carrot', 'Beetroot', 'Radish', 'Capsicum', 'Chili', 'Cucumber'], unit: 'kg' },
    { names: ['Green Beans', 'Drumstick', 'Sweet Potato', 'Yam', 'Taro', 'Cluster Beans', 'Ivy Gourd', 'Pointed Gourd'], unit: 'kg' },
    { names: ['Coriander Leaves', 'Mint Leaves', 'Curry Leaves', 'Spring Onion', 'Dill Leaves', 'Amaranth Leaves'], unit: 'bundle' },
    { names: ['Garlic', 'Ginger', 'Turmeric Root', 'Bamboo Shoot', 'Baby Corn', 'Sweet Corn'], unit: 'kg' },
  ],
  fruits: [
    { names: ['Alphonso Mango', 'Dasheri Mango', 'Banana', 'Coconut', 'Papaya', 'Guava', 'Pomegranate', 'Watermelon', 'Muskmelon'], unit: 'kg' },
    { names: ['Apple', 'Orange', 'Sweet Lime', 'Grapes', 'Pineapple', 'Sapota', 'Custard Apple', 'Jackfruit', 'Mangosteen'], unit: 'kg' },
    { names: ['Litchi', 'Dragon Fruit', 'Kiwi', 'Pear', 'Peach', 'Plum', 'Cherry', 'Avocado', 'Strawberry'], unit: 'kg' },
    { names: ['Lemon', 'Indian Gooseberry', 'Tamarind', 'Dates', 'Figs', 'Apricot'], unit: 'kg' },
  ],
  dairy: [
    { names: ['Fresh Cow Milk', 'Buffalo Milk', 'Organic Milk', 'Curd', 'Buttermilk', 'Paneer'], unit: 'litre' },
    { names: ['Ghee', 'Fresh Cream', 'Cheese', 'Butter', 'Khoya', 'Rabri'], unit: 'kg' },
  ],
  pulses: [
    { names: ['Toor Dal', 'Moong Dal', 'Masoor Dal', 'Chana Dal', 'Urad Dal', 'Rajma', 'Chickpeas', 'Green Gram'], unit: 'kg' },
    { names: ['Black Gram', 'Horse Gram', 'Lentils', 'Cowpeas', 'Moth Beans', 'Pigeon Peas'], unit: 'kg' },
  ],
  spices: [
    { names: ['Turmeric Powder', 'Red Chili Powder', 'Coriander Powder', 'Cumin Seeds', 'Mustard Seeds', 'Fenugreek Seeds'], unit: 'kg' },
    { names: ['Cardamom', 'Cinnamon', 'Cloves', 'Black Pepper', 'Bay Leaves', 'Star Anise', 'Nutmeg', 'Saffron'], unit: 'kg' },
    { names: ['Asafoetida', 'Carom Seeds', 'Fennel Seeds', 'Sesame Seeds', 'Poppy Seeds', 'Dry Mango Powder'], unit: 'kg' },
  ],
  seeds: [
    { names: ['Hybrid Tomato Seeds', 'Bt Cotton Seeds', 'Hybrid Wheat Seeds', 'Paddy Seeds', 'Sunflower Seeds'], unit: 'kg' },
    { names: ['Hybrid Maize Seeds', 'Mustard Seeds', 'Groundnut Seeds', 'Soybean Seeds', 'Vegetable Seed Mix'], unit: 'kg' },
  ],
  other: [
    { names: ['Natural Honey', 'Jaggery', 'Organic Compost', 'Vermicompost', 'Bio-fertilizer'], unit: 'kg' },
    { names: ['Coconut Oil', 'Mustard Oil', 'Groundnut Oil', 'Sesame Oil', 'Sunflower Oil'], unit: 'litre' },
    { names: ['Handmade Basket', 'Gardening Tools', 'Spray Pump', 'Irrigation Pipe', 'Mulch Sheet'], unit: 'piece' },
  ],
};

const DESCRIPTIONS = [
  'Farm-fresh produce grown with organic farming practices. Pesticide-free and rich in nutrients.',
  'Direct from the farm to your doorstep. Hand-picked at peak ripeness for best flavor.',
  'Grown using traditional Indian farming methods. Naturally ripened under the sun.',
  'Premium quality harvested from fertile alluvial soil. Rich aroma and superior taste.',
  'Sustainably grown with drip irrigation. Freshly harvested daily for maximum freshness.',
  'Certified organic produce from our family farm. No chemical fertilizers used.',
  'Heritage variety grown for generations. Known for its exceptional taste and texture.',
  'Cultivated in the foothills with natural spring water. Pesticide-free and healthy.',
  'Harvested at dawn for maximum freshness. Stored in temperature-controlled facilities.',
  'Farmer-direct pricing ensures best value. Support local farmers with every purchase.',
  'Naturally sweet and aromatic. Perfect for traditional Indian recipes.',
  'High-yield variety grown with modern agricultural techniques. Consistent quality.',
  'Rich in minerals from volcanic soil. Deep color and intense flavor.',
  'Rain-fed cultivation in monsoon season. Earthy taste and firm texture.',
  'Clay pot matured for enhanced flavor. Traditional processing methods used.',
];

const STATES = [
  { state: 'Punjab', cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Firozpur', 'Moga', 'Sangrur'] },
  { state: 'Haryana', cities: ['Karnal', 'Hisar', 'Rohtak', 'Ambala', 'Panipat', 'Sonipat', 'Bhiwani', 'Sirsa'] },
  { state: 'Uttar Pradesh', cities: ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Meerut', 'Ghaziabad', 'Allahabad', 'Gorakhpur'] },
  { state: 'Maharashtra', cities: ['Nashik', 'Pune', 'Nagpur', 'Aurangabad', 'Solapur', 'Kolhapur', 'Sangli', 'Satara'] },
  { state: 'Karnataka', cities: ['Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Shimoga', 'Davanagere', 'Bellary', 'Bijapur'] },
  { state: 'Tamil Nadu', cities: ['Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli', 'Erode', 'Vellore', 'Thanjavur', 'Tirunelveli'] },
  { state: 'Kerala', cities: ['Kochi', 'Kozhikode', 'Thrissur', 'Kottayam', 'Palakkad', 'Malappuram', 'Kannur', 'Alappuzha'] },
  { state: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar'] },
  { state: 'Rajasthan', cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Alwar', 'Sikar'] },
  { state: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Darjeeling', 'Asansol', 'Siliguri', 'Durgapur', 'Malda', 'Bankura'] },
  { state: 'Bihar', cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Arrah', 'Begusarai', 'Katihar'] },
  { state: 'Madhya Pradesh', cities: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna'] },
  { state: 'Andhra Pradesh', cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Kakinada', 'Rajahmundry'] },
  { state: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Mahbubnagar', 'Nalgonda', 'Adilabad'] },
  { state: 'Odisha', cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak'] },
  { state: 'Assam', cities: ['Guwahati', 'Dibrugarh', 'Jorhat', 'Silchar', 'Nagaon', 'Tezpur', 'Tinsukia', 'Goalpara'] },
];

const FARMER_NAMES = [
  'Ramesh Patel', 'Suresh Kumar', 'Mahesh Yadav', 'Rajesh Singh', 'Dinesh Sharma',
  'Ganesh Rao', 'Lakshman Reddy', 'Narayan Iyer', 'Balaji Naidu', 'Krishnan Nair',
  'Harish Choudhary', 'Prakash Joshi', 'Subhash Gupta', 'Manoj Tiwari', 'Vikram Desai',
  'Arun Mishra', 'Sanjay Bhatt', 'Deepak Pandey', 'Ravi Thakur', 'Ajay Verma',
];

const FARM_NAMES = [
  'Green Valley Farm', 'Sunrise Organic Farm', 'Krishi Mandir', 'Nature\'s Bounty',
  'Heritage Farms', 'Sustainable Harvest', 'Golden Fields', 'Riverbank Agriculture',
  'Hillside Plantation', 'Fertile Acres', 'Earth\'s Gift Farm', 'Prosperity Farms',
  'Rainbow Harvest', 'Evergreen Estate', 'Sunshine Organics', 'Blessed Lands',
  'Annapurna Farms', 'Vasundhara Krishi', 'Prakriti Organics', 'Shakti Agriculture',
];

const IMAGE_URLS = {
  grains: [
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    'https://images.unsplash.com/photo-1568347355280-d34bf3993420?w=400',
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
  ],
  vegetables: [
    'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400',
    'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400',
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400',
  ],
  fruits: [
    'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400',
    'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?w=400',
    'https://images.unsplash.com/photo-1601039641847-7857b994d704?w=400',
  ],
  dairy: [
    'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400',
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
  ],
  pulses: [
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?w=400',
    'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=400',
  ],
  spices: [
    'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400',
  ],
  seeds: [
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
    'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400',
  ],
  other: [
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
    'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=400',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
  ],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Random integer between min and max (inclusive) */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Random element from array */
const randPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Random float between min and max with given decimals */
const randFloat = (min, max, decimals = 0) => {
  const val = Math.random() * (max - min) + min;
  return Number(val.toFixed(decimals));
};

/** Random boolean with given probability */
const randBool = (probability = 0.5) => Math.random() < probability;

/** Pick N unique random elements */
const randPickN = (arr, n) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

/** Generate a random date within last 90 days */
const randRecentDate = (daysBack = 90) => {
  const date = new Date();
  date.setDate(date.getDate() - randInt(0, daysBack));
  return date;
};

// ============================================================================
// DATA GENERATORS
// ============================================================================

/**
 * Generate a realistic farmer document matching the User schema
 */
function generateFarmer(index) {
  const stateData = STATES[index % STATES.length];
  const city = randPick(stateData.cities);
  const farmName = FARM_NAMES[index % FARM_NAMES.length];

  return {
    name: FARMER_NAMES[index % FARMER_NAMES.length],
    email: `farmer${index + 1}@agrismart.demo`,
    password: 'farmer123',
    phone: `+91${randInt(7000000000, 9999999999)}`,
    role: 'farmer',
    avatar: '',
    isVerified: true,
    otp: { code: null, expiresAt: null },
    location: {
      address: `${randInt(1, 500)}, ${city} Road`,
      city,
      state: stateData.state,
      country: 'India',
      coordinates: {
        lat: randFloat(8, 35, 4),
        lng: randFloat(68, 97, 4),
      },
    },
    farmDetails: {
      farmName,
      farmSize: randFloat(2, 50, 1),
      soilType: randPick(['clay', 'sandy', 'loamy', 'black', 'red', 'alluvial']),
      crops: randPickN(['Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane', 'Pulses'], randInt(2, 4)),
    },
    stats: {
      totalSales: randInt(0, 500),
      totalOrders: randInt(0, 100),
      rating: randFloat(3.5, 5, 1),
      reviewCount: randInt(0, 50),
    },
    isActive: true,
    lastLogin: randRecentDate(30),
  };
}

/**
 * Generate a realistic product document matching the Product schema
 */
function generateProduct(index, farmerIds) {
  const category = randPick(CATEGORIES);
  const catalogGroups = PRODUCT_CATALOG[category] || PRODUCT_CATALOG.other;
  const catalog = randPick(catalogGroups);
  const productName = randPick(catalog.names);
  const unit = catalog.unit || 'kg';

  const stateData = randPick(STATES);
  const city = randPick(stateData.cities);

  // Price varies by category
  let priceMin = 10, priceMax = 500;
  if (category === 'dairy') { priceMin = 40; priceMax = 800; }
  if (category === 'fruits') { priceMin = 30; priceMax = 300; }
  if (category === 'spices') { priceMin = 100; priceMax = 5000; }
  if (category === 'grains') { priceMin = 20; priceMax = 200; }

  // Quantity varies by unit
  let qtyMin = 10, qtyMax = 1000;
  if (unit === 'piece') { qtyMin = 5; qtyMax = 100; }
  if (unit === 'litre') { qtyMin = 10; qtyMax = 500; }
  if (unit === 'dozen') { qtyMin = 5; qtyMax = 50; }
  if (unit === 'bundle') { qtyMin = 20; qtyMax = 200; }

  const price = randFloat(priceMin, priceMax, category === 'spices' ? 0 : 0);
  const quantity = randInt(qtyMin, qtyMax);
  const isOrganic = randBool(0.35); // 35% organic

  // Generate 1-3 images
  const categoryImages = IMAGE_URLS[category] || IMAGE_URLS.other;
  const images = randPickN(categoryImages, randInt(1, 3));

  // Generate tags
  const allTags = [
    'fresh', 'organic', 'local', 'seasonal', 'premium', 'handpicked',
    'natural', 'farm-direct', 'heritage', 'export-quality', 'sweet',
    'aromatic', 'crispy', 'juicy', 'ripe', 'green', 'raw', 'processed',
    'whole', 'powdered', 'hybrid', 'traditional', 'wild', 'cultivated',
  ];
  const tags = randPickN(allTags, randInt(2, 5));
  if (isOrganic) tags.push('organic');

  return {
    name: `${isOrganic ? 'Organic ' : ''}${productName}`,
    description: `${randPick(DESCRIPTIONS)} ${productName} from ${city}, ${stateData.state}. ${isOrganic ? 'Certified organic farming practices used.' : 'Best quality assured.'}`,
    category,
    price,
    quantity,
    unit,
    images,
    farmer: randPick(farmerIds),
    location: {
      address: `${randInt(1, 200)}, Village Road`,
      city,
      state: stateData.state,
      coordinates: {
        lat: randFloat(8, 35, 4),
        lng: randFloat(68, 97, 4),
      },
    },
    rating: randFloat(3.0, 5, 1),
    reviews: [],
    isAvailable: randBool(0.92), // 92% available
    tags,
    harvestDate: randRecentDate(60),
    expiryDate: new Date(Date.now() + randInt(7, 180) * 24 * 60 * 60 * 1000),
    organic: isOrganic,
    createdAt: randRecentDate(90),
    updatedAt: new Date(),
  };
}

// ============================================================================
// SEEDER LOGIC
// ============================================================================

async function seedDatabase() {
  const startTime = Date.now();
  console.log('\n' + '='.repeat(70));
  console.log('  AgriSmart - Large-Scale Data Seeder');
  console.log('='.repeat(70));
  console.log(`\n  Configuration:`);
  console.log(`    - Products to generate: ${PRODUCT_COUNT.toLocaleString()}`);
  console.log(`    - Farmers to create: ${FARMER_COUNT}`);
  console.log(`    - Batch size: ${BATCH_SIZE}`);
  console.log(`    - Delete existing: ${shouldDelete ? 'YES' : 'NO'}`);
  console.log('');

  try {
    // 1. Connect to MongoDB
    console.log('[1/5] Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agriSmart';
    await mongoose.connect(mongoUri);
    console.log(`      Connected: ${mongoose.connection.host}\n`);

    // 2. Optionally delete existing data
    if (shouldDelete) {
      console.log('[2/5] Deleting existing data...');
      const deletedProducts = await Product.deleteMany({});
      const deletedFarmers = await User.deleteMany({ role: 'farmer', email: /agrismart\.demo/ });
      console.log(`      Deleted ${deletedProducts.deletedCount} products`);
      console.log(`      Deleted ${deletedFarmers.deletedCount} demo farmers\n`);
    } else {
      console.log('[2/5] Skipping deletion (--delete not passed)\n');
    }

    // 3. Create farmers
    console.log('[3/5] Creating farmers...');
    const farmerDocs = [];
    for (let i = 0; i < FARMER_COUNT; i++) {
      farmerDocs.push(generateFarmer(i));
    }

    const createdFarmers = await User.insertMany(farmerDocs, { ordered: false });
    const farmerIds = createdFarmers.map((f) => f._id);
    console.log(`      Created ${createdFarmers.length} farmers`);
    console.log(`      Farmer IDs: ${farmerIds.map((id) => id.toString().slice(-6)).join(', ')}\n`);

    // 4. Generate and insert products in batches
    console.log(`[4/5] Generating ${PRODUCT_COUNT.toLocaleString()} products in batches...`);
    let totalInserted = 0;
    const totalBatches = Math.ceil(PRODUCT_COUNT / BATCH_SIZE);

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const batchStart = batchNum * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, PRODUCT_COUNT);
      const batchSize = batchEnd - batchStart;

      const productsBatch = [];
      for (let i = batchStart; i < batchEnd; i++) {
        productsBatch.push(generateProduct(i, farmerIds));
      }

      const result = await Product.insertMany(productsBatch, { ordered: false });
      totalInserted += result.length;

      const progress = ((batchNum + 1) / totalBatches) * 100;
      process.stdout.write(
        `\r      Batch ${batchNum + 1}/${totalBatches} | ` +
        `${totalInserted.toLocaleString()}/${PRODUCT_COUNT.toLocaleString()} inserted | ` +
        `${progress.toFixed(1)}%`
      );
    }
    console.log('\n');

    // 5. Summary statistics
    console.log('[5/5] Building summary statistics...');
    const stats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalQuantity: { $sum: '$quantity' },
          organicCount: { $sum: { $cond: ['$organic', 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalOrganic = await Product.countDocuments({ organic: true });
    const totalAvailable = await Product.countDocuments({ isAvailable: true });
    const avgPrice = await Product.aggregate([{ $group: { _id: null, avg: { $avg: '$price' } } }]);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(70));
    console.log('  SEEDING COMPLETE');
    console.log('='.repeat(70));
    console.log(`\n  Performance:`);
    console.log(`    Duration: ${duration}s`);
    console.log(`    Rate: ${(totalInserted / Number(duration)).toFixed(0)} products/sec`);
    console.log(`\n  Summary:`);
    console.log(`    Total products: ${totalInserted.toLocaleString()}`);
    console.log(`    Organic products: ${totalOrganic.toLocaleString()} (${((totalOrganic / totalInserted) * 100).toFixed(1)}%)`);
    console.log(`    Available products: ${totalAvailable.toLocaleString()} (${((totalAvailable / totalInserted) * 100).toFixed(1)}%)`);
    console.log(`    Average price: ₹${avgPrice[0]?.avg?.toFixed(2) || 'N/A'}`);
    console.log(`\n  By Category:`);
    stats.forEach((s) => {
      console.log(
        `    ${s._id.padEnd(12)} | ${s.count.toString().padStart(4)} items | ` +
        `Avg ₹${s.avgPrice.toFixed(0)} | Organic ${s.organicCount}`
      );
    });
    console.log('\n' + '='.repeat(70) + '\n');

    // Print a sample product
    const sample = await Product.findOne().populate('farmer', 'name farmDetails.farmName');
    console.log('Sample Product:');
    console.log(JSON.stringify({
      name: sample.name,
      category: sample.category,
      price: sample.price,
      quantity: sample.quantity,
      unit: sample.unit,
      organic: sample.organic,
      farmer: sample.farmer?.name,
      location: sample.location,
      tags: sample.tags,
    }, null, 2));
    console.log('');

  } catch (error) {
    console.error('\n[ERROR] Seeding failed:', error.message);
    if (error.writeErrors) {
      console.error(`       ${error.writeErrors.length} write errors occurred`);
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.\n');
    process.exit(0);
  }
}

// Run seeder
seedDatabase();

