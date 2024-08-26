import mongoose from 'mongoose';

const { Schema } = mongoose;


const roomSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ['available', 'full'],
    default: 'available'
  }
});

export default mongoose.model('Room', roomSchema);

