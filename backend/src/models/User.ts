const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 8, maxlength: 128 },
  telegramChatId: { type: String, unique: true, sparse: true },
  telegramUsername: { type: String, trim: true, maxlength: 64 },
  telegramLinkedAt: Date,
  telegramLinkTokenHash: { type: String, select: false },
  telegramLinkTokenExpiresAt: { type: Date, select: false },
}, { timestamps: true });

// Хешування пароля перед збереженням
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
// Метод для перевірки пароля
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
