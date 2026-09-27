import { Request, Response } from 'express';
import { Message, Conversation } from '../models/Message';
import User from '../models/User';

export const getConversations = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const conversations = await Conversation.find({ participants: user._id })
      .populate('participants', 'firstName lastName role')
      .populate('job', 'title')
      .sort({ lastMessageAt: -1 });
    
    res.json({ success: true, data: conversations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: user._id
    });
    
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'firstName lastName role')
      .sort({ createdAt: 1 });
    
    // Mark unread as read
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: user._id }, readAt: null },
      { readAt: new Date() }
    );
    
    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const sender = (req as any).user;
    const { recipientId, content, jobId, subject } = req.body;
    
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }
    
    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [sender._id, recipientId] }
    });
    
    if (!conversation) {
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ success: false, message: 'Recipient not found' });
      }
      
      conversation = await Conversation.create({
        participants: [sender._id, recipientId],
        job: jobId,
        subject: subject || 'New conversation',
        lastMessage: content.slice(0, 100),
        lastMessageAt: new Date()
      });
    }
    
    const message = await Message.create({
      conversation: conversation._id,
      sender: sender._id,
      content: content.trim(),
      job: jobId
    });
    
    // Update conversation
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: content.slice(0, 100),
      lastMessageAt: new Date()
    });
    
    const populated = await message.populate('sender', 'firstName lastName role');
    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const conversations = await Conversation.find({ participants: user._id });
    const conversationIds = conversations.map((c: any) => c._id);
    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: user._id },
      readAt: null
    });
    res.json({ success: true, data: { unreadCount } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

