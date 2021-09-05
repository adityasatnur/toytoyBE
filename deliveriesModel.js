import mongoose from "mongoose";

const deliveriesSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  userId: String,
  userAddress: String,
  userPincode: String,
  items: Array,
  delivered: Boolean,
  
});

//Collection inside the database
export default mongoose.model("deliveries", deliveriesSchema);