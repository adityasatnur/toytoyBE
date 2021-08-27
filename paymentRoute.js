import formidable from 'formidable';
import express from 'express';
const router = express.Router()
import { v4 as uuidv4 } from 'uuid';
import https from 'https';
import PaytmChecksum from './Paytm/checksum.mjs';
import config from './Paytm/config.js';
import User from "./userModel.js";

router.post('/callback', (req, res) => {
    const orderId = req.query.orderId;
    const userId = req.query.userId;
    let buyoutItems = req.query.buyoutItemsId;
    let rentedItems = req.query.rentedItemsId;
    let plans = undefined;
    if(req.query.plansId === 'undefined') {
        plans = undefined
    }else{
        plans = req.query.plansId;
    }
    let buyoutItemsList = buyoutItems.split(',');
    let rentedItemsList = rentedItems.split(',');
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, file) => {

        let paytmChecksum = fields.CHECKSUMHASH;
        delete fields.CHECKSUMHASH;

        var isVerifySignature = PaytmChecksum.verifySignature(fields, config.key, paytmChecksum);
        if (isVerifySignature) {

            var paytmParams = {};
            paytmParams["MID"] = config.mid;
            paytmParams["ORDERID"] = orderId;

            /*
            * Generate checksum by parameters we have
            * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
            */
            PaytmChecksum.generateSignature(paytmParams, config.key).then(function (checksum) {

                paytmParams["CHECKSUMHASH"] = checksum;

                var post_data = JSON.stringify(paytmParams);

                var options = {

                    /* for Staging */
                    hostname: 'securegw-stage.paytm.in',

                    /* for Production */
                     //hostname: 'securegw.paytm.in',

                    port: 443,
                    path: '/order/status',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': post_data.length
                    }
                };

                var response = "";
                var post_req = https.request(options, function (post_res) {
                    post_res.on('data', function (chunk) {
                        response += chunk;
                    });

                    post_res.on('end', function () {
                        let result = JSON.parse(response)
                        if (result.STATUS === 'TXN_SUCCESS') {
                            //store in db
                            
                            const filter = { _id: userId };
                            if(plans){
                                let update = null;
                                let days = 0;
                                switch(plans){
                                    case "Plan1":
                                    days = 30;
                                    break;
                                    case "Plan2":
                                    days = 90;
                                    break;
                                    case "Plan3":
                                    days = 180;
                                    break;
                                }
                                Date.prototype.addDays = function(days) {
                                    var date = new Date(this.valueOf());
                                    date.setDate(date.getDate() + days);
                                    return date;
                                }
                                
                                var date = new Date();
                                 update = {
                                    userSubscriptionStartDate: date,
                                    userSubscriptionEndDate: date.addDays(days),
                                    userPlanType: plans
                                };
                                User.findOneAndUpdate(filter, update, null, function (err, docs) {
                                  if (err) {
                                    console.log(err)
                                  } else {
                                      console.log("Profile updated successfully")
                                  }
                                });
                            }
                            let updateList = null;

                                if(buyoutItemsList && rentedItemsList){
                                    updateList = {
                                        userPurchasedItems: {
                                            undeliveredPurchasedItems:buyoutItemsList,
                                        },
                                        userRentedItems: {
                                            undeliveredRentedItems:rentedItemsList,
                                        },
                                        $inc: {"credits": -1}
                                    };
                                }else if(buyoutItemsList){
                                    updateList = {
                                        userPurchasedItems: {
                                            undeliveredPurchasedItems:buyoutItemsList,
                                        }
                                    };
                                }else if(rentedItemsList){
                                    updateList = {
                                        userRentedItems: {
                                            undeliveredRentedItems:rentedItemsList,
                                        },
                                        $inc: {"credits": -1}

                                    };
                                }else{
                                    updateList = undefined;
                                }
                                
                                User.findOneAndUpdate(filter, updateList, null, function (err, docs) {
                                  if (err) {
                                    console.log(err)
                                  } else {
                                      console.log("Items Added")
                                  }
                                });
                          

                            res.redirect(`${'https://toytoy.co.in'}/status/${orderId}`)
                        }else{
                            res.redirect(`${'https://toytoy.co.in'}/status/${orderId}`)
                        }



                    });
                });

                post_req.write(post_data);
                post_req.end();
            });
        } else {
            console.log("Checksum Mismatched");
        }
    })

})

router.post('/payment', (req, res) => {

    let orderID = uuidv4();

    const { amount, userId, buyoutItems,rentedItems, plans } = req.body;

    /* import checksum generation utility */
    const totalAmount = JSON.stringify(amount);
    var paytmParams = {};
paytmParams.body = {
    "requestType"   : "Payment",
    "mid"           : config.mid,
    "websiteName"   : config.website,
    "orderId"       : orderID,
     "callbackUrl"   : `${'http://localhost:9000'}/api/callback?orderId=${orderID}&userId=${userId}&buyoutItemsId=${buyoutItems}&rentedItemsId=${rentedItems}&plansId=${plans && plans._id}`,
     //"callbackUrl"   : `${'https://toytoy.co.in'}/api/callback?orderId=${orderID}&userId=${userId}&buyoutItemsId=${buyoutItems}&rentedItemsId=${rentedItems}&plansId=${plans && plans._id}`,
    "txnAmount"     : {
        "value"     : totalAmount,
        "currency"  : "INR",
    },
    "userInfo"      : {
        "custId"    : "CUST_001",
    },
};

    PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), config.key)
    .then(function (checksum) {
        paytmParams.head = {
            "signature"    : checksum
        };
        
        var post_data = JSON.stringify(paytmParams);
        var options = {

            /* for Staging */
            hostname: 'securegw-stage.paytm.in',
    
            /* for Production */
             //hostname: 'securegw.paytm.in',
    
            port: 443,
            path: `/theia/api/v1/initiateTransaction?mid=${config.mid}&orderId=${orderID}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length
            }
        };
    
        var response = "";
        var post_req = https.request(options, function(post_res) {
            post_res.on('data', function (chunk) {
                response += chunk;
            });
    
            post_res.on('end', function(){
                console.log('Response: ', response);
                let resp = JSON.parse(response)
                let data = {
                    "mid": config.mid,
                    "orderId": orderID,
                    "txnToken": resp.body.txnToken
                }
                res.json(data)
            });
        });
    
        post_req.write(post_data);
        post_req.end();

        // res.json(paytmParams)
    }).catch(function (error) {
        console.log(error);
    });

})

router.post('/buyCredits', (req, res) => {

    let orderID = uuidv4();

    const { amount, credits, userId } = req.body;

    /* import checksum generation utility */
    const totalAmount = JSON.stringify(amount);
    var paytmParams = {};
paytmParams.body = {
    "requestType"   : "Payment",
    "mid"           : config.mid,
    "websiteName"   : config.website,
    "orderId"       : orderID,
     "callbackUrl"   : `${'http://localhost:9000'}/api/buyCreditsCallback?orderId=${orderID}&credits=${credits}&userId=${userId}`,
     //"callbackUrl"   : `${'https://toytoy.co.in'}/api/buyCreditsCallback?orderId=${orderID}&credits=${credits}&userId=${userId}`,
    "txnAmount"     : {
        "value"     : totalAmount,
        "currency"  : "INR",
    },
    "userInfo"      : {
        "custId"    : "CUST_001",
    },
};

    PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), config.key)
    .then(function (checksum) {
        paytmParams.head = {
            "signature"    : checksum
        };
        
        var post_data = JSON.stringify(paytmParams);
        var options = {

            /* for Staging */
            hostname: 'securegw-stage.paytm.in',
    
            /* for Production */
             //hostname: 'securegw.paytm.in',
    
            port: 443,
            path: `/theia/api/v1/initiateTransaction?mid=${config.mid}&orderId=${orderID}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length
            }
        };
    
        var response = "";
        var post_req = https.request(options, function(post_res) {
            post_res.on('data', function (chunk) {
                response += chunk;
            });
    
            post_res.on('end', function(){
                console.log('Response: ', response);
                let resp = JSON.parse(response)
                let data = {
                    "mid": config.mid,
                    "orderId": orderID,
                    "txnToken": resp.body.txnToken
                }
                res.json(data)
            });
        });
    
        post_req.write(post_data);
        post_req.end();

        // res.json(paytmParams)
    }).catch(function (error) {
        console.log(error);
    });

})

router.post('/buyCreditsCallback', (req, res) => {
    const orderId = req.query.orderId;
    const userId = req.query.userId;
    const credits = Number(req.query.credits);
   
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, file) => {

        let paytmChecksum = fields.CHECKSUMHASH;
        delete fields.CHECKSUMHASH;

        var isVerifySignature = PaytmChecksum.verifySignature(fields, config.key, paytmChecksum);
        if (isVerifySignature) {

            var paytmParams = {};
            paytmParams["MID"] = config.mid;
            paytmParams["ORDERID"] = orderId;

            /*
            * Generate checksum by parameters we have
            * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
            */
            PaytmChecksum.generateSignature(paytmParams, config.key).then(function (checksum) {

                paytmParams["CHECKSUMHASH"] = checksum;

                var post_data = JSON.stringify(paytmParams);

                var options = {

                    /* for Staging */
                    hostname: 'securegw-stage.paytm.in',

                    /* for Production */
                     //hostname: 'securegw.paytm.in',

                    port: 443,
                    path: '/order/status',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': post_data.length
                    }
                };

                var response = "";
                var post_req = https.request(options, function (post_res) {
                    post_res.on('data', function (chunk) {
                        response += chunk;
                    });

                    post_res.on('end', function () {
                        let result = JSON.parse(response)
                        if (result.STATUS === 'TXN_SUCCESS') {
                            //store in db
                            
                            const filter = { _id: userId };
                                let updateList = {
                                    $inc: {"credits":credits}
                                }
                                User.findOneAndUpdate(filter, updateList, null, function (err, docs) {
                                  if (err) {
                                    console.log(err)
                                  } else {
                                      console.log("Items Added")
                                  }
                                });
                          

                            res.redirect(`${'https://toytoy.co.in'}/status/${orderId}`)
                        }else{
                            res.redirect(`${'https://toytoy.co.in'}/status/${orderId}`)
                        }



                    });
                });

                post_req.write(post_data);
                post_req.end();
            });
        } else {
            console.log("Checksum Mismatched");
        }
    })

})

export default router
