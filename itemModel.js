import mongoose from "mongoose";

const toysSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  price: Number,
  image: String,
  category: Array,
  inventory: Number,
  type: String,
  purchasable: Boolean,
  ageGroup: Number
});

//Collection inside the database
export default mongoose.model("toys", toysSchema);