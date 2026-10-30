const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    default: 'Standard Delivery'
  },
  items: [{
    id: String,
    title: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'Cash on Delivery (COD)'
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Delivered'],
    default: 'Pending'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret.orderId || ret._id.toString();
      ret.orderDate = ret.createdAt;
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('Order', orderSchema);
