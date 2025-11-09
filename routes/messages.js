import express from 'express';
import Message from '../models/Message.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/send', authenticate, async (req, res) => {
  try {
    const { recipientId, encryptedContent, nonce, senderPublicKey } = req.body;

    const message = new Message({
      senderId: req.userId,
      recipientId,
      encryptedContent,
      nonce,
      senderPublicKey,
      timestamp: new Date()
    });

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(recipientId).emit('new-message', {
        id: message._id,
        senderId: req.userId,
        encryptedContent,
        nonce,
        senderPublicKey,
        timestamp: message.timestamp
      });
    }

    res.status(201).json({ 
      success: true, 
      messageId: message._id 
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.get('/conversation/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const messages = await Message.find({
      $or: [
        { senderId: req.userId, recipientId: userId },
        { senderId: userId, recipientId: req.userId }
      ]
    })
    .sort({ timestamp: 1 })
    .populate('senderId', 'username publicKey')
    .populate('recipientId', 'username publicKey');

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.put('/:messageId/delivered', authenticate, async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.messageId, {
      delivered: true,
      deliveredAt: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.put('/:messageId/read', authenticate, async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.messageId, {
      read: true,
      readAt: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
