import { model, Schema } from 'mongoose';

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Provide fullName!'],
    },
    email: {
      type: String,
      required: [true, 'Provide Email!'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Provide Password!'],
    },
    mobile: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Inactive',
    },
    role: {
      type: String,
      enum: ['ADMIN', 'USER'],
      default: 'USER',
    },
  },
  { timestamps: true }
);

const User = model('User', userSchema);
export default User;
