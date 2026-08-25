import express from 'express';
import { User, Donation, Request, Pickup } from '../config/db.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection and Admin-only rule to all admin routes
router.use(protect, authorizeRoles('Admin'));

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDonors = await User.countDocuments({ role: 'Donor' });
    const totalNGOs = await User.countDocuments({ role: 'NGO' });
    const totalDonations = await Donation.countDocuments();
    const totalRequests = await Request.countDocuments();
    const totalPickups = await Pickup.countDocuments();

    // Calculate meals saved based on completed donations
    const completedDonations = await Donation.find({ status: 'Completed' });
    let mealsSaved = 224; // Base demo count as requested in the screenshot
    for (const d of completedDonations) {
      // Extract numbers from quantity like "40 plates", "60 pieces", etc.
      const match = d.quantity.match(/\d+/);
      if (match) {
        mealsSaved += parseInt(match[0], 10);
      } else {
        mealsSaved += 10; // Default estimate
      }
    }

    res.json({
      totalUsers,
      totalDonors,
      totalNGOs,
      totalDonations,
      totalRequests,
      totalPickups,
      mealsSaved
    });
  } catch (error) {
    console.error('Fetch admin stats error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    // Exclude password field
    const sanitized = users.map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    res.json(sanitized);
  } catch (error) {
    console.error('Fetch users error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update a user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
router.put('/users/:id', async (req, res) => {
  const { name, role, contactNumber, address } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updated = await User.findByIdAndUpdate(req.params.id, {
      name: name || user.name,
      role: role || user.role,
      contactNumber: contactNumber !== undefined ? contactNumber : user.contactNumber,
      address: address !== undefined ? address : user.address
    });

    res.json(updated);
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't let admin delete themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all donations
// @route   GET /api/admin/donations
// @access  Private (Admin only)
router.get('/donations', async (req, res) => {
  try {
    const donations = await Donation.find();
    res.json(donations);
  } catch (error) {
    console.error('Fetch donations admin error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a donation
// @route   DELETE /api/admin/donations/:id
// @access  Private (Admin only)
router.delete('/donations/:id', async (req, res) => {
  try {
    await Donation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    console.error('Delete donation admin error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all requests list
// @route   GET /api/admin/requests
// @access  Private (Admin only)
router.get('/requests', async (req, res) => {
  try {
    const requests = await Request.find();
    const enrichedRequests = [];
    for (const r of requests) {
      const donation = await Donation.findById(r.donation);
      enrichedRequests.push({
        ...r,
        donationDetails: donation
      });
    }
    res.json(enrichedRequests);
  } catch (error) {
    console.error('Fetch requests error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a request
// @route   DELETE /api/admin/requests/:id
// @access  Private (Admin only)
router.delete('/requests/:id', async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request admin error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all pickups list
// @route   GET /api/admin/pickups
// @access  Private (Admin only)
router.get('/pickups', async (req, res) => {
  try {
    const pickups = await Pickup.find();
    const enrichedPickups = [];
    for (const p of pickups) {
      const donation = await Donation.findById(p.donation);
      const request = await Request.findById(p.request);
      enrichedPickups.push({
        ...p,
        donationDetails: donation,
        requestDetails: request
      });
    }
    res.json(enrichedPickups);
  } catch (error) {
    console.error('Fetch pickups admin error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a pickup
// @route   DELETE /api/admin/pickups/:id
// @access  Private (Admin only)
router.delete('/pickups/:id', async (req, res) => {
  try {
    await Pickup.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pickup deleted successfully' });
  } catch (error) {
    console.error('Delete pickup admin error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
