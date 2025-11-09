import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  encryptedContent: {
    type: String,
    required: true
  },
  nonce: {
    type: String,
    required: true
  },
  senderPublicKey: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  delivered: {
    type: Boolean,
    default: false
  },
  read: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  readAt: Date
});

messageSchema.index({ senderId: 1, recipientId: 1, timestamp: -1 });

export default mongoose.model('Message', messageSchema);
