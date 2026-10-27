import mongoose from 'mongoose';

// Stores a connection label and a supported internal dataset key, never raw database credentials.
const dataConnectionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 120 
  },
  sourceType: { 
    type: String, 
    enum: ['internal'], 
    default: 'internal' 
  },
  dataset: { 
    type: String, 
    enum: ['orders'], 
    required: true, 
    default: 'orders' 
  },
  description: { 
    type: String, 
    trim: true, 
    maxlength: 300, 
    default: '' 
  }
}, { timestamps: true, versionKey: false });

dataConnectionSchema.index({ name: 1, dataset: 1 }, { unique: true });

const DataConnection = mongoose.model('DataConnection', dataConnectionSchema);
export default DataConnection;
