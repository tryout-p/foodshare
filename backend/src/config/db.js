import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Setup directories
const __dirname = path.resolve();
const DATA_DIR = path.join(__dirname, 'backend', 'data');
const JSON_DB_PATH = path.join(DATA_DIR, 'db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure database file exists with initial structure
if (!fs.existsSync(JSON_DB_PATH)) {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify({
    users: [],
    donations: [],
    requests: [],
    pickups: [],
    notifications: []
  }, null, 2));
}

let isUsingMongoDB = false;

// Attempt to connect to MongoDB
export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.log('No MONGODB_URI found in environment. Falling back to persistent JSON File Database.');
    isUsingMongoDB = false;
    return false;
  }

  try {
    // Set a timeout so it fails fast if server is offline
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('MongoDB Connected successfully!');
    isUsingMongoDB = true;
    return true;
  } catch (err) {
    console.warn('MongoDB connection failed. Falling back to persistent JSON File Database.', err.message);
    isUsingMongoDB = false;
    return false;
  }
};

export const getDbMode = () => isUsingMongoDB ? 'MongoDB' : 'JSON File Database';

// Helper for JSON Database reading and writing
const readJSON = () => {
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [], donations: [], requests: [], pickups: [], notifications: [] };
  }
};

const writeJSON = (data) => {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
};

// Generic JSON Model to mock Mongoose API
class JSONModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async find(query = {}) {
    const db = readJSON();
    let items = db[this.collectionName] || [];
    return this._filterItems(items, query);
  }

  async findOne(query = {}) {
    const items = await this.find(query);
    return items[0] || null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(data) {
    const db = readJSON();
    const newItem = {
      _id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    db[this.collectionName].push(newItem);
    writeJSON(db);
    return newItem;
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const db = readJSON();
    const index = db[this.collectionName].findIndex(item => item._id === id);
    if (index === -1) return null;

    const current = db[this.collectionName][index];
    const updatedItem = {
      ...current,
      ...update,
      updatedAt: new Date().toISOString()
    };
    db[this.collectionName][index] = updatedItem;
    writeJSON(db);
    return updatedItem;
  }

  async findByIdAndDelete(id) {
    const db = readJSON();
    const index = db[this.collectionName].findIndex(item => item._id === id);
    if (index === -1) return null;

    const deleted = db[this.collectionName].splice(index, 1)[0];
    writeJSON(db);
    return deleted;
  }

  async deleteMany(query = {}) {
    const db = readJSON();
    const items = db[this.collectionName] || [];
    const remaining = items.filter(item => !this._matches(item, query));
    const deletedCount = items.length - remaining.length;
    db[this.collectionName] = remaining;
    writeJSON(db);
    return { deletedCount };
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }

  // Simple query matching helper
  _matches(item, query) {
    for (const key in query) {
      const val = query[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        // Handle simple operators like $ne, $in, $gt
        if ('$ne' in val) {
          if (item[key] === val.$ne) return false;
        } else if ('$in' in val) {
          if (!val.$in.includes(item[key])) return false;
        } else {
          // Nested object search or standard comparison
          if (JSON.stringify(item[key]) !== JSON.stringify(val)) return false;
        }
      } else {
        if (item[key] !== val) return false;
      }
    }
    return true;
  }

  _filterItems(items, query) {
    return items.filter(item => this._matches(item, query));
  }
}

// MongoDB / Mongoose Mappings
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Donor', 'NGO'], required: true },
  contactNumber: { type: String, default: '' },
  address: { type: String, default: '' }
}, { timestamps: true });

const DonationSchema = new mongoose.Schema({
  foodName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  pickupAddress: { type: String, required: true },
  description: { type: String, default: '' },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donorName: { type: String, default: '' },
  status: { type: String, enum: ['Available', 'Requested', 'Reserved', 'Completed'], default: 'Available' }
}, { timestamps: true });

const RequestSchema = new mongoose.Schema({
  donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ngoName: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Completed'], default: 'Pending' },
  message: { type: String, default: '' }
}, { timestamps: true });

const PickupSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  ngo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donation: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
  pickupDate: { type: String, required: true },
  pickupTime: { type: String, required: true },
  pickupAddress: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Scheduled', 'Picked Up', 'Delivered'], default: 'Pending' }
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
  recipient: { type: String, required: true }, // User ID or 'All'
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

// Setup Mongoose Models
let MongoUser, MongoDonation, MongoRequest, MongoPickup, MongoNotification;
try {
  MongoUser = mongoose.model('User', UserSchema);
  MongoDonation = mongoose.model('Donation', DonationSchema);
  MongoRequest = mongoose.model('Request', RequestSchema);
  MongoPickup = mongoose.model('Pickup', PickupSchema);
  MongoNotification = mongoose.model('Notification', NotificationSchema);
} catch (e) {
  // Model compile error recovery
}

// Wrapper DB Interface for dual database routes
export const User = {
  find: async (q) => isUsingMongoDB ? MongoUser.find(q).lean() : new JSONModel('users').find(q),
  findOne: async (q) => isUsingMongoDB ? MongoUser.findOne(q).lean() : new JSONModel('users').findOne(q),
  findById: async (id) => isUsingMongoDB ? MongoUser.findById(id).lean() : new JSONModel('users').findById(id),
  create: async (d) => isUsingMongoDB ? (await MongoUser.create(d)).toObject() : new JSONModel('users').create(d),
  findByIdAndUpdate: async (id, u) => isUsingMongoDB ? MongoUser.findByIdAndUpdate(id, u, { new: true }).lean() : new JSONModel('users').findByIdAndUpdate(id, u),
  findByIdAndDelete: async (id) => isUsingMongoDB ? MongoUser.findByIdAndDelete(id).lean() : new JSONModel('users').findByIdAndDelete(id),
  countDocuments: async (q) => isUsingMongoDB ? MongoUser.countDocuments(q) : new JSONModel('users').countDocuments(q),
  deleteMany: async (q) => isUsingMongoDB ? MongoUser.deleteMany(q) : new JSONModel('users').deleteMany(q),
};

export const Donation = {
  find: async (q) => isUsingMongoDB ? MongoDonation.find(q).lean() : new JSONModel('donations').find(q),
  findOne: async (q) => isUsingMongoDB ? MongoDonation.findOne(q).lean() : new JSONModel('donations').findOne(q),
  findById: async (id) => isUsingMongoDB ? MongoDonation.findById(id).lean() : new JSONModel('donations').findById(id),
  create: async (d) => isUsingMongoDB ? (await MongoDonation.create(d)).toObject() : new JSONModel('donations').create(d),
  findByIdAndUpdate: async (id, u) => isUsingMongoDB ? MongoDonation.findByIdAndUpdate(id, u, { new: true }).lean() : new JSONModel('donations').findByIdAndUpdate(id, u),
  findByIdAndDelete: async (id) => isUsingMongoDB ? MongoDonation.findByIdAndDelete(id).lean() : new JSONModel('donations').findByIdAndDelete(id),
  countDocuments: async (q) => isUsingMongoDB ? MongoDonation.countDocuments(q) : new JSONModel('donations').countDocuments(q),
  deleteMany: async (q) => isUsingMongoDB ? MongoDonation.deleteMany(q) : new JSONModel('donations').deleteMany(q),
};

export const Request = {
  find: async (q) => isUsingMongoDB ? MongoRequest.find(q).lean() : new JSONModel('requests').find(q),
  findOne: async (q) => isUsingMongoDB ? MongoRequest.findOne(q).lean() : new JSONModel('requests').findOne(q),
  findById: async (id) => isUsingMongoDB ? MongoRequest.findById(id).lean() : new JSONModel('requests').findById(id),
  create: async (d) => isUsingMongoDB ? (await MongoRequest.create(d)).toObject() : new JSONModel('requests').create(d),
  findByIdAndUpdate: async (id, u) => isUsingMongoDB ? MongoRequest.findByIdAndUpdate(id, u, { new: true }).lean() : new JSONModel('requests').findByIdAndUpdate(id, u),
  findByIdAndDelete: async (id) => isUsingMongoDB ? MongoRequest.findByIdAndDelete(id).lean() : new JSONModel('requests').findByIdAndDelete(id),
  countDocuments: async (q) => isUsingMongoDB ? MongoRequest.countDocuments(q) : new JSONModel('requests').countDocuments(q),
  deleteMany: async (q) => isUsingMongoDB ? MongoRequest.deleteMany(q) : new JSONModel('requests').deleteMany(q),
};

export const Pickup = {
  find: async (q) => isUsingMongoDB ? MongoPickup.find(q).lean() : new JSONModel('pickups').find(q),
  findOne: async (q) => isUsingMongoDB ? MongoPickup.findOne(q).lean() : new JSONModel('pickups').findOne(q),
  findById: async (id) => isUsingMongoDB ? MongoPickup.findById(id).lean() : new JSONModel('pickups').findById(id),
  create: async (d) => isUsingMongoDB ? (await MongoPickup.create(d)).toObject() : new JSONModel('pickups').create(d),
  findByIdAndUpdate: async (id, u) => isUsingMongoDB ? MongoPickup.findByIdAndUpdate(id, u, { new: true }).lean() : new JSONModel('pickups').findByIdAndUpdate(id, u),
  findByIdAndDelete: async (id) => isUsingMongoDB ? MongoPickup.findByIdAndDelete(id).lean() : new JSONModel('pickups').findByIdAndDelete(id),
  countDocuments: async (q) => isUsingMongoDB ? MongoPickup.countDocuments(q) : new JSONModel('pickups').countDocuments(q),
  deleteMany: async (q) => isUsingMongoDB ? MongoPickup.deleteMany(q) : new JSONModel('pickups').deleteMany(q),
};

export const Notification = {
  find: async (q) => isUsingMongoDB ? MongoNotification.find(q).sort({ createdAt: -1 }).lean() : new JSONModel('notifications').find(q),
  findOne: async (q) => isUsingMongoDB ? MongoNotification.findOne(q).lean() : new JSONModel('notifications').findOne(q),
  findById: async (id) => isUsingMongoDB ? MongoNotification.findById(id).lean() : new JSONModel('notifications').findById(id),
  create: async (d) => isUsingMongoDB ? (await MongoNotification.create(d)).toObject() : new JSONModel('notifications').create(d),
  findByIdAndUpdate: async (id, u) => isUsingMongoDB ? MongoNotification.findByIdAndUpdate(id, u, { new: true }).lean() : new JSONModel('notifications').findByIdAndUpdate(id, u),
  findByIdAndDelete: async (id) => isUsingMongoDB ? MongoNotification.findByIdAndDelete(id).lean() : new JSONModel('notifications').findByIdAndDelete(id),
  countDocuments: async (q) => isUsingMongoDB ? MongoNotification.countDocuments(q) : new JSONModel('notifications').countDocuments(q),
  deleteMany: async (q) => isUsingMongoDB ? MongoNotification.deleteMany(q) : new JSONModel('notifications').deleteMany(q),
};
