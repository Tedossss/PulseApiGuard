import mongoose, { type Model } from "mongoose"
import bcrypt from "bcryptjs"

export interface UserFields {
  email: string
  password: string
  telegramChatId?: string
  telegramUsername?: string
  telegramLinkedAt?: Date
  telegramLinkTokenHash?: string
  telegramLinkTokenExpiresAt?: Date
}

interface UserMethods {
  matchPassword(enteredPassword: string): Promise<boolean>
}

type UserModel = Model<UserFields, object, UserMethods>

const userSchema = new mongoose.Schema<UserFields, UserModel, UserMethods>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 8, maxlength: 128 },
    telegramChatId: { type: String, unique: true, sparse: true },
    telegramUsername: { type: String, trim: true, maxlength: 64 },
    telegramLinkedAt: Date,
    telegramLinkTokenHash: { type: String, select: false },
    telegramLinkTokenExpiresAt: { type: Date, select: false },
  },
  { timestamps: true },
)

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.method("matchPassword", function (enteredPassword: string) {
  return bcrypt.compare(enteredPassword, this.password)
})

const User = mongoose.model<UserFields, UserModel>("User", userSchema)

export default User
