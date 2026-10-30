const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  topBar: {
    announcement: {
      type: String,
      default: 'Free Delivery on All Frames'
    },
    phone: {
      type: String,
      default: '+92 300 1234567'
    }
  },
  header: {
    brandName: {
      type: String,
      default: 'FRAME CRAFT'
    },
    tagline: {
      type: String,
      default: 'Customized Frames For You'
    }
  },
  navigation: [{
    id: String,
    label: String,
    target: String,
    category: String
  }],
  hero: {
    badge: {
      type: String,
      default: 'BESTSELLER 2026'
    },
    title: {
      type: String,
      default: 'CUSTOMIZED FRAMES FOR YOU'
    },
    subtitle: {
      type: String,
      default: 'Bring your sweetest memories to life with premium handcrafted photo frames, customized glowing LED magic mirrors, acrylic plaques, and multi-photo wall collages.'
    },
    ctaText: {
      type: String,
      default: 'Order Now'
    },
    ctaLink: {
      type: String,
      default: '#products-section'
    },
    secondaryCtaText: {
      type: String,
      default: 'View Top Selling'
    },
    secondaryCtaLink: {
      type: String,
      default: '#products-section'
    },
    heroImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'
    },
    featureBadges: [{
      type: String
    }]
  },
  categories: [{
    id: String,
    name: String,
    description: String
  }],
  footer: {
    about: {
      type: String,
      default: 'Frame Craft is Pakistan leading personalized photo frame studio. From magical LED illusion mirrors to wooden anniversary collage boards, we convert your digital memories into tangible, timeless gifts.'
    },
    phone: {
      type: String,
      default: '+92 300 1234567'
    },
    email: {
      type: String,
      default: 'support@framecraft.com'
    },
    address: {
      type: String,
      default: 'Shop #14, Mall Road Art District, Lahore, Pakistan'
    },
    hours: {
      type: String,
      default: 'Mon - Sat: 10:00 AM - 10:00 PM'
    },
    socials: {
      facebook: { type: String, default: 'https://facebook.com' },
      instagram: { type: String, default: 'https://instagram.com' },
      youtube: { type: String, default: 'https://youtube.com' },
      tiktok: { type: String, default: 'https://tiktok.com' }
    },
    quickLinks: [{
      title: String,
      url: String
    }]
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
