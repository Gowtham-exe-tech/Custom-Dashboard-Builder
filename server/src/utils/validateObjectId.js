import mongoose from 'mongoose';
import httpError from './httpError.js';

const validateObjectId = (id, label = 'id') => {
  if (!mongoose.isValidObjectId(id)) {
    throw httpError(400, `Invalid ${label}`);
  }
};

export default validateObjectId;
