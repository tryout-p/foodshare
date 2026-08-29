import express from 'express';
import { Request, Donation, Notification, Pickup, User } from '../config/db.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Submit a request for food donation
// @route   POST /api/requests
// @access  Private (NGO only)
router.post('/', protect, authorizeRoles('NGO'), async (req, res) => {
  const { donationId, message } = req.body;

  try {
    if (!donationId) {
      return res.status(400).json({ message: 'Donation ID is required' });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Check if donation is available
    if (donation.status !== 'Available') {
      return res.status(400).json({ message: 'This food donation is no longer available' });
    }

    // Create request
    const request = await Request.create({
      donation: donationId,
      ngo: req.user._id,
      ngoName: req.user.name,
      status: 'Pending',
      message: message || '',
    });

    // Update donation status to Requested
    await Donation.findByIdAndUpdate(donationId, { status: 'Requested' });

    // Notify NGO
    await Notification.create({
      recipient: req.user._id.toString(),
      title: 'Food Request Submitted',
      message: `Your request for "${donation.foodName}" is submitted and pending donor approval.`,
      type: 'Request',
      read: false
    });

    // Notify Donor
    await Notification.create({
      recipient: donation.donor.toString(),
      title: 'Food Request Received',
      message: `NGO "${req.user.name}" has requested your donation: "${donation.foodName}".`,
      type: 'Request',
      read: false
    });

    // Notify Admin
    await Notification.create({
      recipient: 'All',
      title: 'New Food Request',
      message: `NGO "${req.user.name}" requested food listing "${donation.foodName}" by donor "${donation.donorName}".`,
      type: 'Request',
      read: false
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get requests sent by NGO
// @route   GET /api/requests/my-requests
// @access  Private (NGO only)
router.get('/my-requests', protect, authorizeRoles('NGO'), async (req, res) => {
  try {
    const requests = await Request.find({ ngo: req.user._id });
    
    // Resolve donations information manually for JSON Fallback and ease
    const enrichedRequests = [];
    for (const reqObj of requests) {
      const donation = await Donation.findById(reqObj.donation);
      enrichedRequests.push({
        ...reqObj,
        donationDetails: donation
      });
    }
    
    res.json(enrichedRequests);
  } catch (error) {
    console.error('Fetch my requests error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get requests received by Donor
// @route   GET /api/requests/received
// @access  Private (Donor only)
router.get('/received', protect, authorizeRoles('Donor'), async (req, res) => {
  try {
    // 1. Get all donations by this donor
    const donorDonations = await Donation.find({ donor: req.user._id });
    const donationIds = donorDonations.map(d => d._id);

    // 2. Get requests matching those donation IDs
    const requests = await Request.find();
    const donorRequests = requests.filter(r => donationIds.includes(r.donation));

    // Enrich requests with donation details
    const enrichedRequests = [];
    for (const reqObj of donorRequests) {
      const donation = donorDonations.find(d => d._id === reqObj.donation);
      enrichedRequests.push({
        ...reqObj,
        donationDetails: donation
      });
    }

    res.json(enrichedRequests);
  } catch (error) {
    console.error('Fetch received requests error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Approve a request (by Donor or Admin)
// @route   PUT /api/requests/:id/approve
// @access  Private (Donor or Admin)
router.put('/:id/approve', protect, authorizeRoles('Donor', 'Admin'), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const donation = await Donation.findById(request.donation);
    if (!donation) {
      return res.status(404).json({ message: 'Associated donation not found' });
    }

    // Verify donor ownership (bypass if Admin)
    if (donation.donor.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to approve this request' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request is already processed' });
    }

    // 1. Approve this request
    const approvedRequest = await Request.findByIdAndUpdate(req.params.id, { status: 'Approved' });

    // 2. Reject other requests for this donation
    const allRequests = await Request.find({ donation: donation._id });
    for (const otherReq of allRequests) {
      if (otherReq._id !== request._id && otherReq.status === 'Pending') {
        await Request.findByIdAndUpdate(otherReq._id, { status: 'Rejected' });
        // Notify other NGO
        await Notification.create({
          recipient: otherReq.ngo.toString(),
          title: 'Request Declined',
          message: `Your request for "${donation.foodName}" was declined because another NGO request was approved.`,
          type: 'Approval',
          read: false
        });
      }
    }

    // 3. Update donation status to Reserved
    await Donation.findByIdAndUpdate(donation._id, { status: 'Reserved' });

    // 4. Automatically create a Pickup entry in Pending state
    const pickup = await Pickup.create({
      request: request._id,
      ngo: request.ngo,
      donor: donation.donor,
      donation: donation._id,
      pickupDate: '',
      pickupTime: '',
      pickupAddress: donation.pickupAddress,
      status: 'Pending',
    });

    // 5. Create notifications
    // Notify requesting NGO
    await Notification.create({
      recipient: request.ngo.toString(),
      title: 'Food Request Approved!',
      message: `Your request for "${donation.foodName}" has been approved by ${req.user.role === 'Admin' ? 'Admin' : `"${req.user.name}"`}. Please schedule a pickup.`,
      type: 'Approval',
      read: false
    });

    // Notify Donor
    await Notification.create({
      recipient: donation.donor.toString(),
      title: 'Request Approved',
      message: `Request for your donation "${donation.foodName}" has been approved by ${req.user.role === 'Admin' ? 'Admin' : 'you'}.`,
      type: 'Approval',
      read: false
    });

    // Notify Admin
    await Notification.create({
      recipient: 'All',
      title: 'Request Approved',
      message: `${req.user.role === 'Admin' ? 'Admin' : `Donor "${req.user.name}"`} approved request from NGO "${request.ngoName}" for "${donation.foodName}".`,
      type: 'Approval',
      read: false
    });

    res.json({ request: approvedRequest, pickup });
  } catch (error) {
    console.error('Approve request error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Reject a request (by Donor or Admin)
// @route   PUT /api/requests/:id/reject
// @access  Private (Donor or Admin)
router.put('/:id/reject', protect, authorizeRoles('Donor', 'Admin'), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const donation = await Donation.findById(request.donation);
    if (!donation) {
      return res.status(404).json({ message: 'Associated donation not found' });
    }

    // Verify donor ownership (bypass if Admin)
    if (donation.donor.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request is already processed' });
    }

    // Reject request
    const rejectedRequest = await Request.findByIdAndUpdate(req.params.id, { status: 'Rejected' });

    // Check if there are other pending requests for this donation. If not, reset donation status to Available.
    const otherPending = await Request.countDocuments({ donation: donation._id, status: 'Pending' });
    if (otherPending === 0) {
      await Donation.findByIdAndUpdate(donation._id, { status: 'Available' });
    }

    // Notify NGO
    await Notification.create({
      recipient: request.ngo.toString(),
      title: 'Request Rejected',
      message: `Your request for "${donation.foodName}" was rejected by ${req.user.role === 'Admin' ? 'Admin' : `"${req.user.name}"`}.`,
      type: 'Approval',
      read: false
    });

    res.json(rejectedRequest);
  } catch (error) {
    console.error('Reject request error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
