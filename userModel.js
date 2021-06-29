import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  userName: String,
  userEmail: String,
  userPhoneNumber: Number,
  userKidName: String,
  userKidSchool: String,
  userAddress: String,
  userPincode: Number,
  userSubscriptionEndDate: Date,
  userSubscriptionStartDate: Date,
  userPlanType: String,
  ReferredBy: String
});

//Collection inside the database
export default mongoose.model("users", userSchema);