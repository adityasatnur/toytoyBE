import express, { Router } from "express";
import mongoose from "mongoose";
import Item from "./itemModel.js";
import User from "./userModel.js";
import cors from "cors";
import paymentRoute from "./paymentRoute.js";
import deliveriesRoute from "./deliveriesRoute.js";

const connection_url =
  "mongodb+srv://Aditya:toytoy@cluster0.ra9uy.mongodb.net/toytoy";

mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const connection = mongoose.connection;

connection.once("open", function () {
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
});

app.get("/api/get/users", async (req, res) => {
  const items = await User.find();
  res.send(items);
});

app.post("/api/post/deliverProduct", async (req, res, next) => {
  const filter = { _id: req.body.id };
  let purchased = req.body.prods[0];
  let rented = req.body.prods[1];
  let deliveredpurchased = req.body.prods[2];
  let deliveredrented = req.body.prods[3];
  
  
  let updateList = {
    userPurchasedItems:{
      undeliveredPurchasedItems: [],
      deliveredPurchasedItems: deliveredpurchased,
    },
      userRentedItems:{
        undeliveredRentedItems: [],
        deliveredRentedItems: deliveredrented,

      }

  };
  User.findOneAndUpdate(filter, updateList, {multi: true}, function (err, docs) {
    if (err) {
      console.log(err)
    } else {
        console.log("Items Added")
         updateList = {
          $push:{"userPurchasedItems.deliveredPurchasedItems": purchased,"userRentedItems.deliveredRentedItems": rented},
        }
        User.findOneAndUpdate(filter, updateList, {multi: true}, function (err, docs) {
          if (err) {
            console.log(err)
          } else {
              console.log("Items Added")
          }
        });
    }
  });
});

app.post("/api/addItem", (req, res, next) => {
  const item = new Item({
    _id: mongoose.Types.ObjectId(),
    name: req.body.name,
    price: req.body.price,
    itemDescription: req.body.description,
    image: req.body.image,
    category: req.body.category,
    inventory: req.body.inventory,
    type: req.body.type,
    purchasable: req.body.purchasable,
    cost: req.body.cost,
    popular: req.body.popular,
    ageGroup: req.body.ageGroup,
    toySet: req.body.toySet,
  });
  item
    .save()
    .then(() => {
      res.status(200).json({ item: "item added successfully" });
    })
    .catch((err) => {
      res.status(400).send("adding new todo failed");
    });
});

app.post("/api/updateUserData", async (req, res, next) => {
  const filter = { userEmail: req.body.email };
  const update = {
    userPhoneNumber: req.body.phoneNumber,
    userKidName: req.body.kidName,
    userKidSchool: req.body.kidSchoolName,
    userAddress: req.body.address,
    userPincode: req.body.pinCode,
    ReferredBy: req.body.referredBy,
  };

  // `doc` is the document _before_ `update` was applied
  User.findOneAndUpdate(filter, update, null, function (err, docs) {
    if (err) {
      res.status(400).send("Updating user failed");
    } else {
      res.status(200).json({ user: "Profile updated successfully" });
    }
  });
});

app.post("/api/updateOrCreateUser", (req, res, next) => {
  const user = new User({
    _id: mongoose.Types.ObjectId(),
    userName: req.body.userName,
    userEmail: req.body.userEmail,
    userPhoneNumber: null,
    userKidName: null,
    userKidSchool: null,
    userAddress: null,
    userPincode: null,
    userSubscriptionEndDate: null,
    userSubscriptionStartDate: null,
    userPlanType: "0",
    ReferredBy: null,
    credits: 0,
  });
  User.findOne({ userEmail: req.body.userEmail }, function (err, obj) {
    if (obj === null) {
      user
        .save()
        .then(() => {
          res.send({
            userName: req.body.userName,
            userEmail: req.body.userEmail,
            userPhoneNumber: null,
            userKidName: null,
            userKidSchool: null,
            userAddress: null,
            userPincode: null,
            userSubscriptionEndDate: null,
            userSubscriptionStartDate: null,
            userPlanType: "0",
            ReferredBy: null,
            credits: 0,
          });

          //res.status(200).json({ user: "user added successfully" });
        })
        .catch((err) => {
          res.status(400).send("adding new user failed");
        });
    } else {
      res.send(obj);
    }
  });
});

app.post("/api/addProductsToDelivery", async (req, res, next) => {
  const { userId, rentedItems } = req.body;
  const filter = { _id: userId };
  let updateList = {
    userRentedItems: {
      undeliveredRentedItems: rentedItems,
    },
    $inc: { credits: -1 },
  };
  User.findOneAndUpdate(filter, updateList, null, function (err, docs) {
    if (err) {
      console.log(err);
    } else {
      console.log("Items Added");
      res.redirect(`${"https://toytoy.co.in"}/status`);
    }
  });
});

app.use("/api", paymentRoute);
app.use("/api", deliveriesRoute);

app.get("/api", (req, res) => res.status(200).send("yo"));

//listen
app.listen(port, (req, res) => console.log(`listening on localhost: ${port}`));
