import express from 'express';
import { Donation, Notification, User } from '../config/db.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Create a new food donation
// @route   POST /api/donations
// @access  Private (Donor only)
router.post('/', protect, authorizeRoles('Donor'), async (req, res) => {
  const { foodName, category, quantity, expiryDate, pickupAddress, description } = req.body;

  try {
    if (!foodName || !category || !quantity || !expiryDate || !pickupAddress) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const donation = await Donation.create({
      foodName,
      category,
      quantity,
      expiryDate,
      pickupAddress,
      description: description || '',
      donor: req.user._id,
      donorName: req.user.name,
      status: 'Available',
    });

    // Notify Donor
    await Notification.create({
      recipient: req.user._id.toString(),
      title: 'Donation Added',
      message: `Your food donation of "${foodName}" (${quantity}) was successfully listed!`,
      type: 'Donation',
      read: false
    });

    // Notify all NGOs
    const ngos = await User.find({ role: 'NGO' });
    for (const ngo of ngos) {
      await Notification.create({
        recipient: ngo._id.toString(),
        title: 'New Food Donation Available',
        message: `Donor "${req.user.name}" listed "${foodName}" (${quantity}) in category "${category}".`,
        type: 'Donation',
        read: false
      });
    }

    // Notify Admin
    await Notification.create({
      recipient: 'All',
      title: 'New Donation Created',
      message: `Donor "${req.user.name}" created a new donation listing: "${foodName}".`,
      type: 'Donation',
      read: false
    });

    res.status(201).json(donation);
  } catch (error) {
    console.error('Create donation error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all donations (with optional filters for NGOs and Admins)
// @route   GET /api/donations
// @access  Private (Admin or NGO)
router.get('/', protect, async (req, res) => {
  const { category, status } = req.query;
  const filter = {};

  if (category) {
    filter.category = category;
  }
  if (status) {
    filter.status = status;
  }

  try {
    const donations = await Donation.find(filter);
    res.json(donations);
  } catch (error) {
    console.error('Fetch donations error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get current donor's listings
// @route   GET /api/donations/my-donations
// @access  Private (Donor only)
router.get('/my-donations', protect, authorizeRoles('Donor'), async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id });
    res.json(donations);
  } catch (error) {
    console.error('Fetch my donations error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get single donation detail
// @route   GET /api/donations/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    res.json(donation);
  } catch (error) {
    console.error('Fetch single donation error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Edit a donation listing
// @route   PUT /api/donations/:id
// @access  Private (Donor only)
router.put('/:id', protect, authorizeRoles('Donor'), async (req, res) => {
  const { foodName, category, quantity, expiryDate, pickupAddress, description, status } = req.body;

  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Verify ownership
    if (donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this donation' });
    }

    const updatedData = {
      foodName: foodName || donation.foodName,
      category: category || donation.category,
      quantity: quantity || donation.quantity,
      expiryDate: expiryDate || donation.expiryDate,
      pickupAddress: pickupAddress || donation.pickupAddress,
      description: description !== undefined ? description : donation.description,
      status: status || donation.status,
    };

    const updatedDonation = await Donation.findByIdAndUpdate(req.params.id, updatedData);

    res.json(updatedDonation);
  } catch (error) {
    console.error('Update donation error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a donation listing
// @route   DELETE /api/donations/:id
// @access  Private (Donor or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Authorize owner or Admin
    if (donation.donor.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete this donation' });
    }

    await Donation.findByIdAndDelete(req.params.id);

    res.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    console.error('Delete donation error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
