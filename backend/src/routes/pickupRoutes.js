import express from 'express';
import { Pickup, Donation, Request, Notification } from '../config/db.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get pickups for current user
// @route   GET /api/pickups
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let pickups = [];
    if (req.user.role === 'NGO') {
      pickups = await Pickup.find({ ngo: req.user._id });
    } else if (req.user.role === 'Donor') {
      pickups = await Pickup.find({ donor: req.user._id });
    } else if (req.user.role === 'Admin') {
      pickups = await Pickup.find();
    }

    // Enrich pickups with donation details and participant names
    const enrichedPickups = [];
    for (const pickup of pickups) {
      const donation = await Donation.findById(pickup.donation);
      const request = await Request.findById(pickup.request);
      
      enrichedPickups.push({
        ...pickup,
        donationDetails: donation,
        requestDetails: request
      });
    }

    res.json(enrichedPickups);
  } catch (error) {
    console.error('Fetch pickups error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Schedule a pickup (by NGO)
// @route   PUT /api/pickups/:id/schedule
// @access  Private (NGO only)
router.put('/:id/schedule', protect, authorizeRoles('NGO'), async (req, res) => {
  const { pickupDate, pickupTime, pickupAddress } = req.body;

  try {
    if (!pickupDate || !pickupTime) {
      return res.status(400).json({ message: 'Please provide both pickup date and time' });
    }

    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }

    // Verify NGO ownership
    if (pickup.ngo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to schedule this pickup' });
    }

    if (pickup.status !== 'Pending') {
      return res.status(400).json({ message: 'Pickup is already scheduled or completed' });
    }

    const donation = await Donation.findById(pickup.donation);

    const updatedPickup = await Pickup.findByIdAndUpdate(req.params.id, {
      pickupDate,
      pickupTime,
      pickupAddress: pickupAddress || pickup.pickupAddress,
      status: 'Scheduled',
    });

    // Notify Donor
    await Notification.create({
      recipient: pickup.donor.toString(),
      title: 'Pickup Scheduled',
      message: `NGO "${req.user.name}" scheduled pickup for "${donation ? donation.foodName : 'food'}" on ${pickupDate} at ${pickupTime}.`,
      type: 'Pickup',
      read: false
    });

    // Notify NGO
    await Notification.create({
      recipient: req.user._id.toString(),
      title: 'Pickup Scheduled Successfully',
      message: `You scheduled pickup for "${donation ? donation.foodName : 'food'}" on ${pickupDate} at ${pickupTime}.`,
      type: 'Pickup',
      read: false
    });

    res.json(updatedPickup);
  } catch (error) {
    console.error('Schedule pickup error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update pickup status (Scheduled -> Picked Up -> Delivered)
// @route   PUT /api/pickups/:id/status
// @access  Private (Donor or NGO or Admin)
router.put('/:id/status', protect, async (req, res) => {
  const { status } = req.body;

  try {
    if (!['Picked Up', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update. Must be "Picked Up" or "Delivered"' });
    }

    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }

    // Verify authorized user (Donor, NGO, or Admin)
    const isDonor = pickup.donor.toString() === req.user._id.toString();
    const isNGO = pickup.ngo.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isDonor && !isNGO && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this pickup' });
    }

    const donation = await Donation.findById(pickup.donation);
    const donationName = donation ? donation.foodName : 'food';

    // Apply status transitions and update references
    const updatedPickup = await Pickup.findByIdAndUpdate(req.params.id, { status });

    if (status === 'Picked Up') {
      // Notify both NGO and Donor
      await Notification.create({
        recipient: pickup.ngo.toString(),
        title: 'Food Picked Up',
        message: `The food listing "${donationName}" is marked as Picked Up. Now in transit.`,
        type: 'Pickup',
        read: false
      });
      await Notification.create({
        recipient: pickup.donor.toString(),
        title: 'Food Picked Up',
        message: `Your donation "${donationName}" is picked up by NGO.`,
        type: 'Pickup',
        read: false
      });
    } else if (status === 'Delivered') {
      // Update Donation and Request status to Completed / Delivered
      if (donation) {
        await Donation.findByIdAndUpdate(donation._id, { status: 'Completed' });
      }
      await Request.findByIdAndUpdate(pickup.request, { status: 'Completed' });

      // Notify NGO
      await Notification.create({
        recipient: pickup.ngo.toString(),
        title: 'Donation Completed & Delivered!',
        message: `Successfully delivered food for "${donationName}". Thank you for your contribution!`,
        type: 'Pickup',
        read: false
      });

      // Notify Donor
      await Notification.create({
        recipient: pickup.donor.toString(),
        title: 'Donation Delivered!',
        message: `Your food donation of "${donationName}" has been successfully delivered to beneficiaries.`,
        type: 'Pickup',
        read: false
      });

      // Admin notification
      await Notification.create({
        recipient: 'All',
        title: 'Donation Completed',
        message: `Donation "${donationName}" has been successfully picked up and delivered by NGO.`,
        type: 'Pickup',
        read: false
      });
    }

    res.json(updatedPickup);
  } catch (error) {
    console.error('Update pickup status error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
