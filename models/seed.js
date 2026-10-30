const Product = require('./Product');
const User = require('./User');
const SiteSettings = require('./SiteSettings');
const Order = require('./Order');

const defaultProducts = [
  {
    title: 'Circular LED Magic Mirror Photo Frame',
    originalPrice: 2999,
    discountedPrice: 1999,
    discountBadge: '-33%',
    category: 'led-mirror',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=700&q=80',
    rating: 4.9,
    reviewsCount: 142,
    description: 'Magic dual mode mirror! When turned off, it is a crystal-clear makeup vanity mirror. Flip the switch and the LED backlighting reveals your personalized high-resolution memory photo inside.',
    inStock: true,
    isTopSelling: true
  },
  {
    title: 'Heart Shaped Magic Mirror with LED Light',
    originalPrice: 3499,
    discountedPrice: 2299,
    discountBadge: '-34%',
    category: 'led-mirror',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=700&q=80',
    rating: 5.0,
    reviewsCount: 98,
    description: 'Heart-shaped personalized LED glowing vanity mirror with USB / battery power support. Perfect surprise gift for anniversaries, birthdays, and Valentine\'s day.',
    inStock: true,
    isTopSelling: true
  },
  {
    title: 'Personalized Birthday Collage Wooden Frame',
    originalPrice: 2499,
    discountedPrice: 1599,
    discountBadge: '-36%',
    category: 'birthday',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=700&q=80',
    rating: 4.8,
    reviewsCount: 76,
    description: 'Celebrate special birthdays with up to 6 custom photos, name engraving, and custom birthdate typography on a premium matte black textured frame.',
    inStock: true,
    isTopSelling: false
  },
  {
    title: 'Royal Wedding Vow Acrylic Floating Frame',
    originalPrice: 4500,
    discountedPrice: 2999,
    discountBadge: '-33%',
    category: 'wedding',
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=700&q=80',
    rating: 5.0,
    reviewsCount: 115,
    description: 'Luxurious floating dual-glass acrylic frame with golden foil borders. Showcases bride and groom portrait alongside wedding date and vows in elegant calligraphy.',
    inStock: true,
    isTopSelling: true
  },
  {
    title: 'Happy Birthday Spotify Song Plaque Frame',
    originalPrice: 2200,
    discountedPrice: 1450,
    discountBadge: '-34%',
    category: 'birthday',
    image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=700&q=80',
    rating: 4.9,
    reviewsCount: 63,
    description: 'Custom acrylic Spotify-style music plaque featuring your favorite song, scannable QR code, and personal celebration photo printed on crystal glass.',
    inStock: true,
    isTopSelling: true
  },
  {
    title: 'Forever & Always Anniversary Deep Shadow Box',
    originalPrice: 3999,
    discountedPrice: 2599,
    discountBadge: '-35%',
    category: 'anniversary',
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=700&q=80',
    rating: 4.9,
    reviewsCount: 89,
    description: '3D Shadow box frame with fairy string warm LED lights, mini wooden clothespins holding memorable polaroids, and dried rose petals.',
    inStock: true,
    isTopSelling: true
  },
  {
    title: 'Eternal Couple Silhouette LED Lamp Frame',
    originalPrice: 3200,
    discountedPrice: 2100,
    discountBadge: '-34%',
    category: 'anniversary',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=700&q=80',
    rating: 4.7,
    reviewsCount: 54,
    description: 'Customized engraved acrylic night lamp with warm white LED wooden stand, engraved with couple names and wedding anniversary calendar date.',
    inStock: true,
    isTopSelling: false
  },
  {
    title: 'Barat & Walima Classic Gold Border Frame',
    originalPrice: 4200,
    discountedPrice: 2799,
    discountBadge: '-33%',
    category: 'wedding',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80',
    rating: 4.9,
    reviewsCount: 102,
    description: 'Heavy luxury carved synthetic wood frame with gold leaf finish. Includes anti-glare protective glass and premium archival photo print.',
    inStock: true,
    isTopSelling: true
  },
  {
    title: 'Custom 9-Photo Family Grid Frame',
    originalPrice: 3800,
    discountedPrice: 2450,
    discountBadge: '-35%',
    category: 'top-selling',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=700&q=80',
    rating: 4.8,
    reviewsCount: 130,
    description: 'Modern minimalist 9-window square collage frame. Fits nine 4x4 inch square photos, perfect for Instagram feeds and family journey stories.',
    inStock: true,
    isTopSelling: true
  }
];

const defaultSettings = {
  topBar: {
    announcement: 'Free Delivery on All Frames',
    phone: '+92 300 1234567'
  },
  header: {
    brandName: 'FRAME CRAFT',
    tagline: 'Customized Frames For You'
  },
  navigation: [
    { id: 'nav-home', label: 'Home', target: '#hero' },
    { id: 'nav-shop', label: 'Shop', target: '#products-section', category: 'all' },
    { id: 'nav-birthday', label: 'Birthday Frame', target: '#products-section', category: 'birthday' },
    { id: 'nav-led-mirror', label: 'Led Magic Mirror Frames', target: '#products-section', category: 'led-mirror' },
    { id: 'nav-anniversary', label: 'Anniversary Frames', target: '#products-section', category: 'anniversary' },
    { id: 'nav-wedding', label: 'Wedding Frame', target: '#products-section', category: 'wedding' },
    { id: 'nav-top-selling', label: 'Top Selling', target: '#products-section', category: 'top-selling' }
  ],
  hero: {
    badge: 'BESTSELLER 2026',
    title: 'CUSTOMIZED FRAMES FOR YOU',
    subtitle: 'Bring your sweetest memories to life with premium handcrafted photo frames, customized glowing LED magic mirrors, acrylic plaques, and multi-photo wall collages.',
    ctaText: 'Order Now',
    ctaLink: '#products-section',
    secondaryCtaText: 'View Top Selling',
    secondaryCtaLink: '#products-section',
    heroImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    featureBadges: [
      '100% High-Grade Solid Wood & Acrylic',
      'Free Express Nationwide Delivery',
      'HD Ultra-Vibrant Photo Printing'
    ]
  },
  categories: [
    { id: 'all', name: 'All Frames', description: 'Browse our complete catalog of personalized frame styles' },
    { id: 'birthday', name: 'Birthday Frame', description: 'Celebrate birthdays with heartfelt custom photo memories' },
    { id: 'led-mirror', name: 'Led Magic Mirror Frames', description: 'Magical dual-mode mirror that lights up with your photo' },
    { id: 'anniversary', name: 'Anniversary Frames', description: 'Commemorate love stories with romantic date-engraved frames' },
    { id: 'wedding', name: 'Wedding Frame', description: 'Preserve your wedding vows and couple portraits forever' },
    { id: 'top-selling', name: 'Top Selling', description: 'Our most popular customer-favorite custom gifts' }
  ],
  footer: {
    about: 'Frame Craft is Pakistan leading personalized photo frame studio. From magical LED illusion mirrors to wooden anniversary collage boards, we convert your digital memories into tangible, timeless gifts.',
    phone: '+92 300 1234567',
    email: 'support@framecraft.com',
    address: 'Shop #14, Mall Road Art District, Lahore, Pakistan',
    hours: 'Mon - Sat: 10:00 AM - 10:00 PM',
    socials: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com',
      tiktok: 'https://tiktok.com'
    },
    quickLinks: [
      { title: 'Home', url: '#hero' },
      { title: 'All Products', url: '#products-section' },
      { title: 'Led Magic Mirrors', url: '#products-section' },
      { title: 'Track My Order', url: '#account' },
      { title: 'Shipping Policy', url: '#' }
    ]
  }
};

async function seedDatabase() {
  try {
    // 1. Seed Admin User
    const adminExists = await User.findOne({ role: 'Admin' });
    if (!adminExists) {
      await User.create({
        name: 'Store Administrator',
        username: 'admin',
        email: 'admin@framecraft.com',
        password: 'admin123',
        role: 'Admin',
        phone: '+92 300 1234567'
      });
      console.log('✔ Initial Admin user created in MongoDB (admin / admin123)');
    }

    // 2. Seed Default Customer
    const customerExists = await User.findOne({ email: 'talha@example.com' });
    if (!customerExists) {
      await User.create({
        name: 'Muhammad Talha',
        username: 'talha',
        email: 'talha@example.com',
        password: 'password123',
        role: 'Customer',
        phone: '+92 300 9876543',
        city: 'Lahore',
        address: 'Street 5, Model Town, Lahore'
      });
      console.log('✔ Demo Customer user created in MongoDB (talha@example.com / password123)');
    }

    // 3. Seed Site Settings
    const settingsCount = await SiteSettings.countDocuments();
    if (settingsCount === 0) {
      await SiteSettings.create(defaultSettings);
      console.log('✔ Default SiteSettings created in MongoDB');
    }

    // 4. Seed Products
    const productsCount = await Product.countDocuments();
    if (productsCount === 0) {
      await Product.insertMany(defaultProducts);
      console.log(`✔ ${defaultProducts.length} Default Products seeded in MongoDB`);
    }

  } catch (error) {
    console.error('Error during initial MongoDB seeding:', error);
  }
}

module.exports = seedDatabase;
