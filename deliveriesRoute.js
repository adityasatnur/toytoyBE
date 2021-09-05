import express from 'express';
const router = express.Router()
import Deliveries from "./deliveriesModel.js";


router.get("/getDeliveryItems", async (req, res) => {
    const deliveries = await Deliveries.find();
    res.send(deliveries);
  });
export default router
