import express from "express";
import mongoose from "mongoose";
import Item from "./itemModel.js";
import cors from "cors";


const connection_url =
  "mongodb+srv://Aditya:toytoy@cluster0.ra9uy.mongodb.net/toytoy";

mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

const connection = mongoose.connection;

connection.once("open", function() {
  console.log("MongoDB database connection established successfully");
});
//app config
const app = express();
app.use(cors());
const port = process.env.PORT || 9000;

//middleware

app.use(express.json());


//db config

//api endpoints

app.get("/api/get/addItem", async (req, res) => {
	const items = await Item.find();
  res.send(items);

})
  app.post("/api/addItem", (req, res, next) => {
  const item = new Item({
    _id: mongoose.Types.ObjectId(),
    name: req.body.name,
    price: req.body.price,
     image: req.body.image,
    category: req.body.category,
    inventory: req.body.inventory,
    type: req.body.type,
    purchasable: req.body.purchasable,
    ageGroup: req.body.ageGroup,
  });
  item
    .save()
    .then(() => {
      console.log(res)
      res.status(200).json({ item: "item added successfully" });
    })
    .catch((err) => {
      res.status(400).send("adding new todo failed");
    });
});
app.get("/", (req, res) => res.status(200).send("yo"));

//listen
app.listen(port, (req, res) => console.log(`listening on localhost: ${port}`));
