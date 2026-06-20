import bcrypt from 'bcryptjs';
import { getDb } from '../config/db.js';
import { createUser } from '../models/user.model.js';
import { createService } from '../models/service.model.js';
import { createTechnician, addTechnicianService, addTechnicianAvailability, addTechnicianServiceArea } from '../models/technician.model.js';
import { createBooking } from '../models/booking.model.js';

const db = getDb();

async function seed() {
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

  // Create admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = createUser({
    name: 'Admin User',
    email: 'admin@repairportal.com',
    phone: '+8801700000001',
    password: adminPassword,
    role: 'admin',
  });
  console.log('Created admin:', admin.email);

  // Create users
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
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+8801700000003',
    password: userPassword,
    role: 'user',
  });

  // Create services
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

  // Create technicians
  const techPassword = await bcrypt.hash('tech123', 10);
  const techUser1 = createUser({
    name: 'Karim Electronics',
    email: 'karim@example.com',
    phone: '+8801700000004',
    password: techPassword,
    role: 'technician',
  });
  const tech1 = createTechnician({ userId: techUser1.id, experience: 8, hourlyRate: 500 });
  addTechnicianService(tech1.id, s1.id);
  addTechnicianService(tech1.id, s3.id);
  addTechnicianAvailability(tech1.id, 'saturday', '09:00', '18:00', true);
  addTechnicianAvailability(tech1.id, 'sunday', '10:00', '17:00', true);
  addTechnicianServiceArea(tech1.id, 'Dhaka', 'Gulshan');
  addTechnicianServiceArea(tech1.id, 'Dhaka', 'Banani');

  const techUser2 = createUser({
    name: 'Rahim Plumbing',
    email: 'rahim@example.com',
    phone: '+8801700000005',
    password: techPassword,
    role: 'technician',
  });
  const tech2 = createTechnician({ userId: techUser2.id, experience: 12, hourlyRate: 400 });
  addTechnicianService(tech2.id, s2.id);
  addTechnicianAvailability(tech2.id, 'saturday', '08:00', '20:00', true);
  addTechnicianAvailability(tech2.id, 'sunday', '08:00', '20:00', true);
  addTechnicianServiceArea(tech2.id, 'Dhaka', 'Mirpur');
  addTechnicianServiceArea(tech2.id, 'Dhaka', 'Uttara');

  // Create sample bookings
  const booking1 = createBooking({
    user: user1.id,
    technician: tech1.id,
    service: s1.id,
    description: 'AC not cooling properly, gas might be low',
    preferredDate: '2026-07-01',
    preferredTime: '10:00',
    urgency: 'high',
    address: '12/A Gulshan Avenue, Dhaka',
    isBidding: false,
    status: 'pending',
  });

  console.log('Seed complete!');
  console.log('Login credentials:');
  console.log('  Admin: admin@repairportal.com / admin123');
  console.log('  User:  john@example.com / user123');
  console.log('  Tech:  karim@example.com / tech123');
}

seed().catch(console.error);
