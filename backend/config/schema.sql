-- Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone TEXT NOT NULL,
  password TEXT NOT NULL,
  address_street TEXT DEFAULT '',
  address_city TEXT DEFAULT '',
  address_area TEXT DEFAULT '',
  address_postal_code TEXT DEFAULT '',
  picture TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'technician', 'admin')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_price_min REAL NOT NULL,
  estimated_price_max REAL NOT NULL,
  estimated_duration INTEGER NOT NULL,
  image TEXT DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Technicians (extends users with role='technician')
CREATE TABLE IF NOT EXISTS technicians (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  experience INTEGER NOT NULL,
  rating_average REAL NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  hourly_rate REAL NOT NULL,
  is_verified INTEGER NOT NULL DEFAULT 0,
  is_available INTEGER NOT NULL DEFAULT 1,
  total_jobs INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Technician <-> Service (many-to-many)
CREATE TABLE IF NOT EXISTS technician_services (
  technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (technician_id, service_id)
);

-- Technician availability (one row per day)
CREATE TABLE IF NOT EXISTS technician_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  start_time TEXT,
  end_time TEXT,
  available INTEGER NOT NULL DEFAULT 1,
  UNIQUE(technician_id, day_of_week)
);

-- Technician service areas
CREATE TABLE IF NOT EXISTS technician_service_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  area TEXT NOT NULL
);

-- Technician certifications
CREATE TABLE IF NOT EXISTS technician_certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issued_by TEXT,
  issued_date TEXT,
  expiry_date TEXT
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  technician_id INTEGER REFERENCES technicians(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  description TEXT NOT NULL,
  preferred_date TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low','medium','high','emergency')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','bidding','accepted','in-progress','completed','cancelled')),
  address TEXT,
  estimated_cost REAL,
  final_cost REAL,
  completed_at TEXT,
  cancelled_at TEXT,
  cancellation_reason TEXT,
  is_bidding INTEGER NOT NULL DEFAULT 0,
  bidding_deadline TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Booking images
CREATE TABLE IF NOT EXISTS booking_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL
);

-- Bids
CREATE TABLE IF NOT EXISTS bids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  technician_id INTEGER NOT NULL REFERENCES users(id),
  bid_amount REAL NOT NULL,
  message TEXT,
  estimated_duration REAL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  technician_id INTEGER NOT NULL REFERENCES technicians(id),
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bkash','nagad','rocket','card','cash')),
  transaction_id TEXT UNIQUE,
  gateway_response TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','refunded')),
  paid_at TEXT,
  refunded_at TEXT,
  refund_amount REAL DEFAULT 0,
  platform_fee REAL DEFAULT 0,
  technician_amount REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  payment_id INTEGER NOT NULL REFERENCES payments(id),
  invoice_number TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  technician_id INTEGER NOT NULL REFERENCES technicians(id),
  service_name TEXT,
  service_description TEXT,
  items_breakdown TEXT,
  subtotal REAL NOT NULL,
  platform_fee REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  billing_street TEXT,
  billing_city TEXT,
  billing_area TEXT,
  billing_postal_code TEXT,
  service_date TEXT NOT NULL,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  technician_id INTEGER NOT NULL REFERENCES technicians(id),
  rating_overall INTEGER NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
  rating_punctuality INTEGER CHECK (rating_punctuality BETWEEN 1 AND 5),
  rating_work_quality INTEGER CHECK (rating_work_quality BETWEEN 1 AND 5),
  rating_communication INTEGER CHECK (rating_communication BETWEEN 1 AND 5),
  rating_cleanliness INTEGER CHECK (rating_cleanliness BETWEEN 1 AND 5),
  comment TEXT,
  would_recommend INTEGER DEFAULT 1,
  is_anonymous INTEGER DEFAULT 0,
  technician_response TEXT,
  technician_responded_at TEXT,
  is_visible INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Review images
CREATE TABLE IF NOT EXISTS review_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL
);

-- Warranties
CREATE TABLE IF NOT EXISTS warranties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  warranty_number TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  technician_id INTEGER NOT NULL REFERENCES technicians(id),
  service_name TEXT,
  service_category TEXT,
  warranty_duration INTEGER NOT NULL,
  warranty_unit TEXT NOT NULL DEFAULT 'months' CHECK (warranty_unit IN ('days','months','years')),
  warranty_type TEXT NOT NULL DEFAULT 'full-service' CHECK (warranty_type IN ('parts','labor','full-service')),
  coverage_details TEXT,
  terms TEXT,
  service_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  claims_history TEXT,
  qr_code TEXT,
  pdf_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Messages (unified -- replaces both Chat and Message models)
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  receiver_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','image','file')),
  booking_id INTEGER REFERENCES bookings(id),
  is_read INTEGER NOT NULL DEFAULT 0,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
