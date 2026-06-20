import bcrypt from 'bcryptjs';
import { getDb } from '../config/db.js';
import { createUser } from '../models/user.model.js';
import { createService } from '../models/service.model.js';
import { createTechnician, addTechnicianService, addTechnicianAvailability, addTechnicianServiceArea } from '../models/technician.model.js';
import { createBooking, updateBooking } from '../models/booking.model.js';
import { createBid } from '../models/bid.model.js';
import { createPayment, updatePayment } from '../models/payment.model.js';
import { createInvoice } from '../models/invoice.model.js';
import { createWarranty } from '../models/warranty.model.js';
import { createReview } from '../models/review.model.js';

const db = getDb();

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed production database.');
    process.exit(1);
  }

  console.log('Seeding database...');

  // Clear existing data (in reverse dependency order)
  db.exec('DELETE FROM messages');
  db.exec('DELETE FROM review_images');
  db.exec('DELETE FROM reviews');
  db.exec('DELETE FROM warranties');
  db.exec('DELETE FROM invoices');
  db.exec('DELETE FROM payments');
  db.exec('DELETE FROM bids');
  db.exec('DELETE FROM booking_images');
  db.exec('DELETE FROM bookings');
  db.exec('DELETE FROM technician_certifications');
  db.exec('DELETE FROM technician_service_areas');
  db.exec('DELETE FROM technician_availability');
  db.exec('DELETE FROM technician_services');
  db.exec('DELETE FROM technicians');
  db.exec('DELETE FROM services');
  db.exec('DELETE FROM users');

  // Reset autoincrement
  db.exec("DELETE FROM sqlite_sequence");

  // ---- Users ----
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = createUser({
    name: 'Admin User',
    email: 'admin@repairportal.com',
    phone: '+8801700000001',
    password: adminPassword,
    role: 'admin',
    address: { street: '12 Admin Road', city: 'Dhaka', area: 'Gulshan', postalCode: '1212' },
  });

  const userPassword = await bcrypt.hash('user123', 10);
  const user1 = createUser({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+8801700000002',
    password: userPassword,
    role: 'user',
    address: { street: '12/A Gulshan Avenue', city: 'Dhaka', area: 'Gulshan', postalCode: '1212' },
  });
  const user2 = createUser({
    name: 'Sarah Customer',
    email: 'sarah@example.com',
    phone: '+8801700000003',
    password: userPassword,
    role: 'user',
    address: { street: '8 Client Ave', city: 'Dhaka', area: 'Uttara', postalCode: '1230' },
  });

  console.log('  Users created (admin + 2 customers)');

  // ---- Services (5 total) ----
  const s1 = createService({
    name: 'AC Repair & Service',
    category: 'electronics',
    description: 'Complete AC repair, gas refill, and maintenance service for all brands',
    estimatedPrice: { min: 800, max: 5000 },
    estimatedDuration: 120,
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
  });
  const s2 = createService({
    name: 'Plumbing Service',
    category: 'plumbing',
    description: 'Fix leaking pipes, install fixtures, and complete plumbing solutions',
    estimatedPrice: { min: 500, max: 3000 },
    estimatedDuration: 90,
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
  });
  const s3 = createService({
    name: 'Electrical Repair',
    category: 'electrical',
    description: 'Electrical wiring, switchboard repair, and appliance installation',
    estimatedPrice: { min: 600, max: 4000 },
    estimatedDuration: 60,
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400',
  });
  const s4 = createService({
    name: 'Refrigerator Repair',
    category: 'electronics',
    description: 'Refrigerator and freezer diagnostic and repair for all brands',
    estimatedPrice: { min: 600, max: 2500 },
    estimatedDuration: 90,
  });
  const s5 = createService({
    name: 'Carpentry Work',
    category: 'carpentry',
    description: 'Custom furniture, door repair, and woodwork',
    estimatedPrice: { min: 500, max: 5000 },
    estimatedDuration: 180,
  });

  console.log('  Services created (5)');

  // ---- Technicians (3 total) ----
  const techPassword = await bcrypt.hash('tech123', 10);

  // Technician 1: Karim - electronics + electrical
  const techUser1 = createUser({
    name: 'Karim Electronics',
    email: 'karim@example.com',
    phone: '+8801700000004',
    password: techPassword,
    role: 'technician',
    address: { street: '15 Tech St', city: 'Dhaka', area: 'Mirpur', postalCode: '1216' },
  });
  const tech1 = createTechnician({ userId: techUser1.id, experience: 8, hourlyRate: 500 });
  addTechnicianService(tech1.id, s1.id);
  addTechnicianService(tech1.id, s3.id);
  addTechnicianService(tech1.id, s4.id);
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].forEach(day => {
    addTechnicianAvailability(tech1.id, day, '09:00', '18:00', true);
  });
  addTechnicianServiceArea(tech1.id, 'Dhaka', 'Gulshan');
  addTechnicianServiceArea(tech1.id, 'Dhaka', 'Banani');
  addTechnicianServiceArea(tech1.id, 'Dhaka', 'Mirpur');

  // Technician 2: Fatima - plumbing + electrical
  const techUser2 = createUser({
    name: 'Fatima Technician',
    email: 'fatima@example.com',
    phone: '+8801700000005',
    password: techPassword,
    role: 'technician',
    address: { street: '42 Work Rd', city: 'Chattogram', area: 'Agrabad', postalCode: '4100' },
  });
  const tech2 = createTechnician({ userId: techUser2.id, experience: 5, hourlyRate: 600 });
  addTechnicianService(tech2.id, s2.id);
  addTechnicianService(tech2.id, s3.id);
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].forEach(day => {
    addTechnicianAvailability(tech2.id, day, '10:00', '19:00', true);
  });
  addTechnicianServiceArea(tech2.id, 'Chattogram', 'Agrabad');
  addTechnicianServiceArea(tech2.id, 'Chattogram', 'Nasirabad');

  // Technician 3: Rahim - plumbing + carpentry + AC
  const techUser3 = createUser({
    name: 'Rahim Plumbing',
    email: 'rahim@example.com',
    phone: '+8801700000006',
    password: techPassword,
    role: 'technician',
    address: { street: '7 Service Blvd', city: 'Dhaka', area: 'Dhanmondi', postalCode: '1205' },
  });
  const tech3 = createTechnician({ userId: techUser3.id, experience: 12, hourlyRate: 450 });
  addTechnicianService(tech3.id, s1.id);
  addTechnicianService(tech3.id, s2.id);
  addTechnicianService(tech3.id, s5.id);
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].forEach(day => {
    addTechnicianAvailability(tech3.id, day, '08:00', '17:00', true);
  });
  addTechnicianServiceArea(tech3.id, 'Dhaka', 'Dhanmondi');
  addTechnicianServiceArea(tech3.id, 'Dhaka', 'Mohammadpur');

  console.log('  Technicians created (3) with services, availability, and areas');

  // ---- Bookings (4 total, various statuses) ----

  // Booking 1: John's completed AC repair (assigned to Karim/tech1)
  const booking1 = createBooking({
    user: user1.id,
    technician: tech1.id,
    service: s1.id,
    description: 'AC not cooling properly, needs gas refill',
    preferredDate: '2026-06-15',
    preferredTime: '10:00',
    urgency: 'medium',
    address: '12/A Gulshan Avenue, Banani, Dhaka',
    estimatedCost: 1200,
    isBidding: false,
  });
  // Mark as completed
  updateBooking(booking1.id, {
    status: 'completed',
    finalCost: 1200,
    completedAt: '2026-06-15T14:00:00.000Z',
  });

  // Booking 2: John's pending plumbing (open for bidding)
  const booking2 = createBooking({
    user: user1.id,
    service: s2.id,
    description: 'Kitchen sink leaking under cabinet',
    preferredDate: '2026-06-22',
    preferredTime: '14:00',
    urgency: 'high',
    address: '12/A Gulshan Avenue, Banani, Dhaka',
    estimatedCost: 800,
    isBidding: true,
    status: 'pending',
  });

  // Booking 3: Sarah's bidding booking for electrical
  const booking3 = createBooking({
    user: user2.id,
    service: s3.id,
    description: 'Need new power points installed in living room',
    preferredDate: '2026-06-25',
    preferredTime: '09:00',
    urgency: 'low',
    address: '8 Client Ave, Uttara, Dhaka',
    estimatedCost: 1500,
    isBidding: true,
    status: 'bidding',
  });

  // Booking 4: Sarah's completed fridge repair (assigned to Fatima/tech2)
  const booking4 = createBooking({
    user: user2.id,
    technician: tech2.id,
    service: s4.id,
    description: 'Refrigerator not freezing, making strange noise',
    preferredDate: '2026-06-10',
    preferredTime: '11:00',
    urgency: 'high',
    address: '8 Client Ave, Uttara, Dhaka',
    estimatedCost: 2000,
    isBidding: false,
  });
  // Mark as completed
  updateBooking(booking4.id, {
    status: 'completed',
    finalCost: 2000,
    completedAt: '2026-06-10T15:00:00.000Z',
  });

  console.log('  Bookings created (4: 2 completed, 1 pending, 1 bidding)');

  // ---- Bids (4 total on the bidding bookings) ----
  // Bids reference users(id) for technician_id

  // Bids on booking 2 (John's plumbing)
  createBid({
    booking: booking2.id,
    technician: techUser1.id,    // Karim's user ID
    bidAmount: 700,
    message: 'I can fix this leak quickly. Have done many similar jobs in Banani.',
    estimatedDuration: 1.5,
  });
  createBid({
    booking: booking2.id,
    technician: techUser3.id,    // Rahim's user ID
    bidAmount: 650,
    message: 'Available tomorrow. Will bring all necessary parts.',
    estimatedDuration: 1.0,
  });

  // Bids on booking 3 (Sarah's electrical)
  createBid({
    booking: booking3.id,
    technician: techUser2.id,    // Fatima's user ID
    bidAmount: 1200,
    message: 'Licensed electrician. Can do the installation this week.',
    estimatedDuration: 3.0,
  });
  createBid({
    booking: booking3.id,
    technician: techUser3.id,    // Rahim's user ID
    bidAmount: 1400,
    message: 'Experienced in residential electrical work. 12 years experience.',
    estimatedDuration: 2.5,
  });

  console.log('  Bids created (4)');

  // ---- Payments (2 for completed bookings) ----
  const payment1 = createPayment({
    booking: booking1.id,
    user: user1.id,
    technician: tech1.id,
    amount: 1200,
    paymentMethod: 'bkash',
    platformFee: 60,
    technicianAmount: 1140,
  });
  updatePayment(payment1.id, {
    status: 'completed',
    transactionId: 'TXN-SEED-001',
    paidAt: '2026-06-15T14:30:00.000Z',
  });

  const payment2 = createPayment({
    booking: booking4.id,
    user: user2.id,
    technician: tech2.id,
    amount: 2000,
    paymentMethod: 'cash',
    platformFee: 100,
    technicianAmount: 1900,
  });
  updatePayment(payment2.id, {
    status: 'completed',
    transactionId: 'TXN-SEED-002',
    paidAt: '2026-06-10T15:30:00.000Z',
  });

  console.log('  Payments created (2)');

  // ---- Invoices (2 for completed bookings) ----
  const invoice1 = createInvoice({
    booking: booking1.id,
    payment: payment1.id,
    invoiceNumber: 'INV-SEED-001',
    user: user1.id,
    technician: tech1.id,
    service: { name: 'AC Repair & Service', description: 'AC gas refill and service' },
    itemsBreakdown: [{ description: 'AC Repair Service', quantity: 1, unitPrice: 1200, totalPrice: 1200 }],
    subtotal: 1200,
    platformFee: 60,
    totalAmount: 1200,
    billingAddress: { street: '12/A Gulshan Avenue', city: 'Dhaka', area: 'Banani', postalCode: '1213' },
    serviceDate: '2026-06-15',
  });

  const invoice2 = createInvoice({
    booking: booking4.id,
    payment: payment2.id,
    invoiceNumber: 'INV-SEED-002',
    user: user2.id,
    technician: tech2.id,
    service: { name: 'Refrigerator Repair', description: 'Compressor replacement and gas refill' },
    itemsBreakdown: [{ description: 'Refrigerator Repair', quantity: 1, unitPrice: 2000, totalPrice: 2000 }],
    subtotal: 2000,
    platformFee: 100,
    totalAmount: 2000,
    billingAddress: { street: '8 Client Ave', city: 'Dhaka', area: 'Uttara', postalCode: '1230' },
    serviceDate: '2026-06-10',
  });

  console.log('  Invoices created (2)');

  // ---- Warranties (2 for completed bookings) ----
  createWarranty({
    booking: booking1.id,
    invoice: invoice1.id,
    warrantyNumber: 'WAR-SEED-001',
    user: user1.id,
    technician: tech1.id,
    serviceName: 'AC Repair & Service',
    serviceCategory: 'electronics',
    warrantyDuration: 90,
    warrantyUnit: 'days',
    warrantyType: 'full-service',
    coverageDetails: [
      { item: 'Parts Replacement', description: 'Defective parts replaced free of charge', covered: true },
      { item: 'Labor Charges', description: 'Labor costs for warranty repairs', covered: true },
    ],
    terms: ['Warranty valid for 90 days', 'Physical damage voids warranty', 'Original invoice required'],
    serviceDate: '2026-06-15',
  });

  createWarranty({
    booking: booking4.id,
    invoice: invoice2.id,
    warrantyNumber: 'WAR-SEED-002',
    user: user2.id,
    technician: tech2.id,
    serviceName: 'Refrigerator Repair',
    serviceCategory: 'electronics',
    warrantyDuration: 90,
    warrantyUnit: 'days',
    warrantyType: 'full-service',
    coverageDetails: [
      { item: 'Parts Replacement', description: 'Defective parts replaced free of charge', covered: true },
      { item: 'Labor Charges', description: 'Labor costs for warranty repairs', covered: true },
    ],
    terms: ['Warranty valid for 90 days', 'Physical damage voids warranty', 'Original invoice required'],
    serviceDate: '2026-06-10',
  });

  console.log('  Warranties created (2)');

  // ---- Reviews (2 for completed bookings) ----
  createReview({
    booking: booking1.id,
    user: user1.id,
    technician: tech1.id,
    rating: { overall: 5, punctuality: 5, workQuality: 5, communication: 4, cleanliness: 5 },
    comment: 'Excellent service! Fixed my AC quickly and at a fair price. Very professional.',
    wouldRecommend: true,
  });

  createReview({
    booking: booking4.id,
    user: user2.id,
    technician: tech2.id,
    rating: { overall: 5, punctuality: 4, workQuality: 5, communication: 5, cleanliness: 5 },
    comment: 'Fantastic technician. Diagnosed the problem immediately and had it fixed in under an hour.',
    wouldRecommend: true,
  });

  console.log('  Reviews created (2)');

  console.log('\nDatabase seeded successfully!');
  console.log('Login credentials:');
  console.log('  Admin:    admin@repairportal.com / admin123');
  console.log('  Customer: john@example.com / user123');
  console.log('  Customer: sarah@example.com / user123');
  console.log('  Tech:     karim@example.com / tech123');
  console.log('  Tech:     fatima@example.com / tech123');
  console.log('  Tech:     rahim@example.com / tech123');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
