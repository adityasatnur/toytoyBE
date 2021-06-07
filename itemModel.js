import mongoose from "mongoose";

const toysSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  price: Number,
  itemDescription: String,
  image: String,
  category: Array,
  inventory: Number,
  type: String,
  purchasable: Boolean,
  ageGroup: String,
  toySet: String,
});

//Collection inside the database
export default mongoose.model("toys", toysSchema);