import mongoose from 'mongoose';

const { Schema } = mongoose;


const roomSchema = new Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  status: {
    type: String,
    enum: ['available', 'full', 'in-progress'],
    default: 'available',
  },
  deleted: {
    type: Boolean,
    default: false, 
  },
});

export default mongoose.model('Room', roomSchema);

