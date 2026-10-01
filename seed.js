const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load MONGODB_URI from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let MONGODB_URI = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/MONGODB_URI=(.*)/);
  if (match) MONGODB_URI = match[1].trim();
}

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// Define the schema locally (to avoid Next.js import issues)
const MenuItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  imageUrl: String,
  isAvailable: Boolean,
}, { timestamps: true });

const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

// All the fake menu items
const menuItems = [
  // Coffee
  { name: 'Cappuccino', price: 120, category: 'Coffee', description: 'Classic espresso with steamed milk and foam', isAvailable: true },
  { name: 'Cafe Latte', price: 130, category: 'Coffee', description: 'Smooth espresso with lots of steamed milk', isAvailable: true },
  { name: 'Cold Coffee', price: 150, category: 'Coffee', description: 'Chilled coffee blended with ice cream', isAvailable: true },
  { name: 'Espresso', price: 90, category: 'Coffee', description: 'Strong and pure shot of coffee', isAvailable: true },
  
  // Tea
  { name: 'Masala Chai', price: 40, category: 'Tea', description: 'Traditional Indian spiced tea', isAvailable: true },
  { name: 'Green Tea', price: 60, category: 'Tea', description: 'Fresh and healthy', isAvailable: true },
  { name: 'Lemon Iced Tea', price: 90, category: 'Tea', description: 'Refreshing iced tea with lemon', isAvailable: true },
  
  // Snacks
  { name: 'Veg Sandwich', price: 150, category: 'Snacks', description: 'Grilled sandwich with fresh veggies', isAvailable: true },
  { name: 'Paneer Tikka Wrap', price: 180, category: 'Snacks', description: 'Spicy paneer wrapped in a soft tortilla', isAvailable: true },
  { name: 'French Fries', price: 100, category: 'Snacks', description: 'Crispy golden fries', isAvailable: true },
  { name: 'Veg Burger', price: 140, category: 'Snacks', description: 'Crispy patty with fresh veggies and sauce', isAvailable: true },
  
  // Desserts
  { name: 'Chocolate Brownie', price: 110, category: 'Desserts', description: 'Warm fudgy brownie', isAvailable: true },
  { name: 'Red Velvet Pastry', price: 140, category: 'Desserts', description: 'Classic red velvet slice', isAvailable: true }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Optional: Clear existing items so you don't get duplicates
    await MenuItem.deleteMany({});
    console.log('🗑️  Cleared existing menu items');

    // Insert all items
    await MenuItem.insertMany(menuItems);
    console.log(`🎉 Successfully added ${menuItems.length} menu items!`);

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();