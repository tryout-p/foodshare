import express from 'express';
import { Notification } from '../config/db.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Get notifications for this user OR admin notifications ('All') if user is Admin
    let notifications = [];
    if (req.user.role === 'Admin') {
      notifications = await Notification.find({
        $in: [req.user._id.toString(), 'All']
      });
    } else {
      notifications = await Notification.find({
        recipient: req.user._id.toString()
      });
    }

    // Sort manual for JSON DB fallback (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Verify recipient matches (or is Admin for 'All' type notifications)
    const isRecipient = notification.recipient === req.user._id.toString();
    const isAdminNotification = notification.recipient === 'All' && req.user.role === 'Admin';

    if (!isRecipient && !isAdminNotification) {
      return res.status(403).json({ message: 'Not authorized to read this notification' });
    }

    const updated = await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json(updated);
  } catch (error) {
    console.error('Mark notification read error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    let unread = [];
    if (req.user.role === 'Admin') {
      const all = await Notification.find();
      unread = all.filter(n => !n.read && (n.recipient === req.user._id.toString() || n.recipient === 'All'));
    } else {
      unread = await Notification.find({ recipient: req.user._id.toString(), read: false });
    }

    for (const item of unread) {
      await Notification.findByIdAndUpdate(item._id, { read: true });
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Read all notifications error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
