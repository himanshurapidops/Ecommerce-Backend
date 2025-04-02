
import { model, Schema } from 'mongoose';

const addressSchema = new Schema(
  {
    addressLine1: {
      type: String,
      required: [true, 'Address Line 1 is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
    },
    country: {
      type: String,
      default: 'India',
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
    },
    selected: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Address = model('Address', addressSchema);
export default Address;
    