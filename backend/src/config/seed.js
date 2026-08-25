import bcrypt from 'bcryptjs';
import { User, Donation, Request, Pickup, Notification } from './db.js';

export const seedDatabase = async () => {
  try {
    // Check if users already exist
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Skipping automatic seeding.');
      return;
    }

    console.log('Seeding database with realistic college project demo data...');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 1. Create Users
    // Admin
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@foodshare.org',
      password: hashedPassword,
      role: 'Admin',
      contactNumber: '+91 77765 43210',
      address: 'FoodShare HQ, Tech Park, Ahmedabad - 380054'
    });

    // Donors (3)
    const donor1 = await User.create({
      name: 'Green Palace Banquet',
      email: 'donor@foodshare.org',
      password: hashedPassword,
      role: 'Donor',
      contactNumber: '+91 98765 43210',
      address: 'Sector 15, Near City Palace, Ahmedabad, Gujarat - 380015'
    });

    const donor2 = await User.create({
      name: 'Metro Bakery & Confectionery',
      email: 'bakery@foodshare.org',
      password: hashedPassword,
      role: 'Donor',
      contactNumber: '+91 99000 11223',
      address: 'Shop 4, Market Plaza, Ahmedabad, Gujarat - 380015'
    });

    const donor3 = await User.create({
      name: 'Organic Harvest Farms',
      email: 'farms@foodshare.org',
      password: hashedPassword,
      role: 'Donor',
      contactNumber: '+91 99111 22334',
      address: 'Village Rancharda, Sanand Road, Ahmedabad, Gujarat - 382115'
    });

    // NGOs (2)
    const ngo1 = await User.create({
      name: 'Feeding Hands Foundation',
      email: 'ngo@foodshare.org',
      password: hashedPassword,
      role: 'NGO',
      contactNumber: '+91 88665 43210',
      address: 'Shanti Ashram Campus, Ashram Road, Ahmedabad, Gujarat - 380009'
    });

    const ngo2 = await User.create({
      name: 'Robin Hood Army Volunteers',
      email: 'robinhood@foodshare.org',
      password: hashedPassword,
      role: 'NGO',
      contactNumber: '+91 88776 55443',
      address: 'Youth Hub, CG Road, Ahmedabad, Gujarat - 380009'
    });

    console.log('Users seeded: 1 Admin, 3 Donors, 2 NGOs.');

    // 2. Create Food Donations
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const in12Hours = new Date();
    in12Hours.setHours(in12Hours.getHours() + 12);

    // Veg Biryani
    const don1 = await Donation.create({
      foodName: 'Veg Biryani (Buffet Surplus)',
      category: 'Cooked Meal',
      quantity: '40 plates',
      expiryDate: tomorrow.toISOString(),
      pickupAddress: donor1.address,
      description: 'Extra buffet surplus biryani from a wedding reception. Hygienically stored in steel containers. Keep refrigerated.',
      donor: donor1._id.toString(),
      donorName: donor1.name,
      status: 'Available'
    });

    // Breads
    const don2 = await Donation.create({
      foodName: 'Assorted Breads & Buns',
      category: 'Bakery',
      quantity: '60 pieces',
      expiryDate: dayAfter.toISOString(),
      pickupAddress: donor2.address,
      description: 'Freshly baked buns and loaves left over from today sales. Good for consumption till tomorrow night.',
      donor: donor2._id.toString(),
      donorName: donor2.name,
      status: 'Requested'
    });

    // Paneer Curry
    const don3 = await Donation.create({
      foodName: 'Paneer Curry & Rotis',
      category: 'Cooked Meal',
      quantity: 'Serves 80',
      expiryDate: in12Hours.toISOString(),
      pickupAddress: donor1.address,
      description: 'Surplus dinner from corporate catering event. Paneer butter masala and butter rotis. Packed hot.',
      donor: donor1._id.toString(),
      donorName: donor1.name,
      status: 'Reserved'
    });

    // Veggies
    const don4 = await Donation.create({
      foodName: 'Fresh Vegetables Crate',
      category: 'Fruits & Vegetables',
      quantity: '25 kg',
      expiryDate: dayAfter.toISOString(),
      pickupAddress: donor3.address,
      description: 'Slightly outer-leaf damaged but fully edible cauliflowers, tomatoes, and spinach harvested yesterday.',
      donor: donor3._id.toString(),
      donorName: donor3.name,
      status: 'Available'
    });

    // Completed donation (to count for meals saved stats)
    const don5 = await Donation.create({
      foodName: 'Daal Khichdi & Sabji',
      category: 'Cooked Meal',
      quantity: '100 plates',
      expiryDate: new Date(Date.now() - 86400000).toISOString(), // Expired yesterday
      pickupAddress: donor1.address,
      description: 'Surplus food from family gathering.',
      donor: donor1._id.toString(),
      donorName: donor1.name,
      status: 'Completed'
    });

    console.log('Donations seeded.');

    // 3. Create Requests
    // Pending request from ngo1 for Bakery products
    const req1 = await Request.create({
      donation: don2._id.toString(),
      ngo: ngo1._id.toString(),
      ngoName: ngo1.name,
      status: 'Pending',
      message: 'We can collect this and distribute it to children at the shelter tonight.'
    });

    // Approved request for Paneer curry
    const req2 = await Request.create({
      donation: don3._id.toString(),
      ngo: ngo1._id.toString(),
      ngoName: ngo1.name,
      status: 'Approved',
      message: 'Ideal for our community kitchen dinner service.'
    });

    // Completed request
    const req3 = await Request.create({
      donation: don5._id.toString(),
      ngo: ngo2._id.toString(),
      ngoName: ngo2.name,
      status: 'Completed',
      message: 'Requesting to distribute at slums near CG road.'
    });

    console.log('Requests seeded.');

    // 4. Create Pickups
    // Scheduled pickup for Paneer curry (ngo1 -> donor1)
    const pick1 = await Pickup.create({
      request: req2._id.toString(),
      ngo: ngo1._id.toString(),
      donor: donor1._id.toString(),
      donation: don3._id.toString(),
      pickupDate: new Date(tomorrow).toISOString().slice(0, 10),
      pickupTime: '18:30',
      pickupAddress: donor1.address,
      status: 'Scheduled'
    });

    // Completed pickup
    const pick2 = await Pickup.create({
      request: req3._id.toString(),
      ngo: ngo2._id.toString(),
      donor: donor1._id.toString(),
      donation: don5._id.toString(),
      pickupDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      pickupTime: '16:00',
      pickupAddress: donor1.address,
      status: 'Delivered'
    });

    console.log('Pickups seeded.');

    // 5. Create System Notifications
    // Admin notifications
    await Notification.create({
      recipient: 'All',
      title: 'Platform Initialized',
      message: 'FoodShare platform seeded with initial demo accounts and listings successfully.',
      type: 'Info',
      read: false
    });

    // Donor notifications
    await Notification.create({
      recipient: donor1._id.toString(),
      title: 'Food Request Received',
      message: `NGO "${ngo1.name}" requested your donation: "Paneer Curry & Rotis".`,
      type: 'Request',
      read: false
    });

    // NGO notifications
    await Notification.create({
      recipient: ngo1._id.toString(),
      title: 'Request Approved!',
      message: `Your request for "Paneer Curry & Rotis" has been approved by "${donor1.name}". Please schedule pickup.`,
      type: 'Approval',
      read: false
    });

    console.log('Notifications seeded.');
    console.log('Database seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding database:', err.message);
  }
};
