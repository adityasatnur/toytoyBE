import formidable from 'formidable';
import express from 'express';
const router = express.Router()
import { v4 as uuidv4 } from 'uuid';
import https from 'https';
import PaytmChecksum from './Paytm/checksum.mjs';
import config from './Paytm/config.js';

router.post('/callback/:orderId', (req, res) => {
    var orderId = req.params.orderId;

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
                    // hostname: 'securegw.paytm.in',

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
                        }

                        res.redirect(`${'https://toytoy.co.in'}/status/${orderId}`)


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

    const { amount, email, phone } = req.body;

    /* import checksum generation utility */
    const totalAmount = JSON.stringify(amount);
    var paytmParams = {};
paytmParams.body = {
    "requestType"   : "Payment",
    "mid"           : config.mid,
    "websiteName"   : "WEBSTAGING",
    "orderId"       : orderID,
    "callbackUrl"   : `${config.PORT}/api/callback/${orderID}`,
    "txnAmount"     : {
        "value"     : "1.00",
        "currency"  : "INR",
    },
    "userInfo"      : {
        "custId"    : "CUST_001",
    },
};

    // var params = {};

    /* initialize an array */
    // params['MID'] = config.mid,
    //     params['WEBSITE'] = config.website,
    //     params['CHANNEL_ID'] = config.channel,
    //     params['INDUSTRY_TYPE_ID'] = config.industryType,
    //     params['ORDERID'] = "OREDRID_12",
    //     params['CUST_ID'] = "12",
    //     params['TXN_AMOUNT'] = totalAmount,
    //     params['CALLBACK_URL'] = 'http://localhost:8080/api/callback',
    //     params['EMAIL'] = email,
    //     params['MOBILE_NO'] = phone

    /**
    * Generate checksum by parameters we have
    * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
    */
    PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), config.key)
    .then(function (checksum) {
        paytmParams.head = {
            "signature"    : checksum
        };
        // let paytmParams = {
        //     ...params,
        //     "CHECKSUMHASH": checksum
        // }
        var post_data = JSON.stringify(paytmParams);
        var options = {

            /* for Staging */
            hostname: 'securegw-stage.paytm.in',
    
            /* for Production */
            // hostname: 'securegw.paytm.in',
    
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

export default router
