const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    default: 'birthday'
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discountedPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discountBadge: {
    type: String,
    default: '-30%'
  },
  image: {
    type: String,
    required: true,
    default: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=700&q=80'
  },
  description: {
    type: String,
    default: 'Premium handcrafted customized frame.'
  },
  rating: {
    type: Number,
    default: 5.0
  },
  reviewsCount: {
    type: Number,
    default: 1
  },
  inStock: {
    type: Boolean,
    default: true
  },
  isTopSelling: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      // Ensure currentPrice alias exists for frontend compatibility
      ret.currentPrice = ret.discountedPrice;
      delete ret.__v;
      return ret;
    }
  }
});

// Virtual currentPrice alias for backwards compatibility
productSchema.virtual('currentPrice').get(function () {
  return this.discountedPrice;
});

module.exports = mongoose.model('Product', productSchema);
