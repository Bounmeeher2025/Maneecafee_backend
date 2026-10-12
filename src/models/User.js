import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['owner', 'staff'], default: 'staff' },
    roleLabel: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

userSchema.statics.hashPassword = (plain) => bcrypt.hash(plain, 10)
userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash
    delete ret.__v
    return ret
  },
})

export const User = mongoose.model('User', userSchema)
