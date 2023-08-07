const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    // name: { type: "String", required: true },
    // email: { type: "String", unique: true, required: true },
    // password: { type: "String", required: true },
    // pic: {
    //   type: "String",
    //   required: true,
    //   default:
    //     "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    // },
    // isAdmin: {
    //   type: Boolean,
    //   required: true,
    //   default: false,
    // },
    photo: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Make the email field unique
  },
  
  password: {
    type: String,
  },
  login: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    required: true,
  },
  clinicName: {
    type: String,
    required: true,
  },
  clinicCode: {
    type: String,
    required: true,
  },
  clinicBlock: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
 
  sex: {
    type: String,
    required: true,
  },
  
  city: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  },
  { timestaps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("userLogin", userSchema);

module.exports = User;
