// let config = {
//     mid: "cPUHWO89231686491559",
//     key: "DxHzdjoHJrZRUnfH",
//     website: "WEBSTAGING",
//     channel: "WEB",
//     industryType:"Retail",
//     PORT:"http://localhost:8080",
//      hostname: 'securegw-stage.paytm.in',
//      callbackURL:function(orderID,userId,buyoutItems, rentedItems, plans ){
//        return `http://localhost:9000/api/callback?orderId=${orderID}&userId=${userId}&buyoutItemsId=${buyoutItems}&rentedItemsId=${rentedItems}&plansId=${plans && plans._id}`
//      },
//      callbackURLCredits:function(orderID,userId, credits){
//       return `http://localhost:9000/api/buyCreditsCallback?orderId=${orderID}&credits=${credits}&userId=${userId}`
//      }
//    };
  //PROD
  let config = {
    mid: "hOwGIE00896949538752",
    key: "rcXlKFUVjjuc3fnT",
    website: "DEFAULT",
    channel: "WEB",
    industryType:"Retail",
    //PORT:"http://localhost:8080",
    hostname: 'securegw.paytm.in',
   PORT: "https://toytoylib.azurewebsites.net",
  callbackURL:function(orderID,userId,buyoutItems, rentedItems, plans ){
    return `https://toytoylib.azurewebsites.net/api/callback?orderId=${orderID}&userId=${userId}&buyoutItemsId=${buyoutItems}&rentedItemsId=${rentedItems}&plansId=${plans && plans._id}`
  },
  callbackURLCredits:function(orderID,userId, credits){
    return `https://toytoylib.azurewebsites.net/api/buyCreditsCallback?orderId=${orderID}&credits=${credits}&userId=${userId}`
   }
  };
export default config;