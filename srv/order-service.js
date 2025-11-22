const cds = require('@sap/cds');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendMail } = require('./utils/mail'); // ✅ Import mail utility
const SECRET_KEY = process.env.REFRESH_SECRET; // Store secret in .env

module.exports = cds.service.impl(async function () {
    const { Orders, Shops, OrderItems, Products, Users } = this.entities;

    // Middleware to Validate JWT Token
   async function verifyToken(req) {
                 const token = req.headers.authorization?.split(' ')[1];
                 if (!token) return req.error(401, 'Unauthorized: No token provided');
         
                 try {
                     const decoded = jwt.verify(token, SECRET_KEY);
                     const user = await cds.run(SELECT.one.from('cap.dukanmitra.Users').where({ phoneNumber: decoded.phoneNumber }));
         
                     if (!user) return req.error(404, 'User not found');
                     return user;  // Return user data for further processing
                 } catch (error) {
                     return req.error(401, 'Invalid or expired token');
                 }
             }

    this.before('*', 'Orders', async (req) => {
    const user = await verifyToken(req);  // Validate Token and Fetch User
    if (!user) return req.error(404, 'User not found');
    });

    this.before('*', 'OrderItems', async (req) => {
    const user = await verifyToken(req);  // Validate Token and Fetch User
    if (!user) return req.error(404, 'User not found');
    });

    this.before('CREATE', 'Orders', async (req) => {

        const user = await verifyToken(req);
        if (!user) return req.error(404, 'User not found');
        

// email =
// 'lanebazaar@gmail.com'
// firstName =
// 'Sheshnath'
// isVerified =
// true
// lastLogin =
// null
// lastName =
// 'Agrahari'



// ownerPhone_phoneNumber =
// '8800755400'
// rating =
// null
// shopAddress =
// 'Maupakar Maharajganj '
// shopCity =
// 'MRJ'
// shopId =
// 'b2e59873-cff0-4c62-abdb-cc5acc38bfbb'
// shopLocation =
// 'Maupakar '
// shopName =
// 'MRJ Vegitables Centre '
// shopOffer =
// '10'
// shopType =
// 'Vegetable'

try{
        const {orderItems, paymentMethod, shippingAddress } = req.data;
        const shopDetal = await SELECT.one.from(Shops).where({ shopId: req.data.shop.shopId });
        if (!shopDetal) return req.error(400, 'Shop not avalable or Closed');
        const userShopDetail = await SELECT.one.from(Users).where({ phoneNumber: shopDetal.ownerPhone_phoneNumber });

        //const userShopDetail = await cds.run(SELECT.one.from('Users').where({ phoneNumber: shopDetal.ownerPhone_phoneNumber}));
        if (!orderItems || orderItems.length === 0) return req.error(400, 'Order must contain at least one item.');

        // Calculate total amount and check stock
        let totalAmount = 0;
        for (const item of orderItems) {
            const product = await SELECT.one.from(Products).where({ productId: item.product.productId });
            if (!product) return req.error(404, `Product not found: ${item.product.productId}`);
           totalAmount += product.sellPrice * item.quantity;

            req.data.orderId =  Math.random().toString().substring(2,10);
            req.data.user_phoneNumber = user.phoneNumber;
            req.data.totalAmount = totalAmount;
            req.data.status = "Pending";
             

          
//     const html_user = `
//         <h1> Order No. ${req.data.orderId} <h>
//         <p>Your Shop Name: <strong>${shopDetal.shopName}</strong></p>
//         <a id="orderLink" href="https://dukanmitra.com/iframe/order-details.html/${req.data.orderId}" role="button">Click here</a>
//         <p><strong>https://dukanmitra.com/iframe/order-details.html?orderId=${req.data.orderId}</strong></p>
//     `;

//     const html_shop = `
//         <h1> Order No. ${req.data.orderId} <h>
//         <p>Your Order From: <strong>${user.phoneNumber}</strong></p>
//         <a id="orderLink" href="https://dukanmitra.com/iframe/order-details.html/${req.data.orderId}" role="button">Click here</a>
//         <p><strong>https://dukanmitra.com/iframe/shop-order-details.html?orderId=${req.data.orderId}</strong></p>
//     `;
// http://localhost:4004/iframe/shop-order-details.html?orderId=90332362

//     await sendMail(user.email, "Order From Dukan Mitra - "+req.data.orderId, html_user);
//     await sendMail(userShopDetail.email, "Order From Dukan Mitra - "+req.data.orderId, html_shop);
     } 
     const html_user = `
  <div style="font-family: Arial, sans-serif; color:#333; padding:20px; background:#f7f7f7;">
    
    <div style="max-width:600px; margin:auto; background:#ffffff; padding:25px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">

      <h2 style="text-align:center; color:#4CAF50;">🛒 Order Confirmation</h2>

      <p style="font-size:16px;">Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
      <p style="font-size:15px;">Thank you for placing your order with <strong>Dukan Mitra</strong>. Below are your order details:</p>

      <table style="width:100%; margin-top:15px;">
        <tr>
          <td style="padding:8px 0;"><strong>Order No:</strong></td>
          <td>${req.data.orderId}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;"><strong>Shop Name:</strong></td>
          <td>${shopDetal.shopName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;"><strong>Shop Phone:</strong></td>
          <td>${shopDetal.ownerPhone_phoneNumber}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;"><strong>Shop Address:</strong></td>
          <td>${shopDetal.shopAddress}, ${shopDetal.shopCity}</td>
        </tr>
      </table>

      <div style="text-align:center; margin:25px 0;">
        <a href="https://dukanmitra.com/iframe/order-details.html?orderId=${req.data.orderId}"
          style="background:#4CAF50; color:white; padding:12px 20px; text-decoration:none; border-radius:6px; font-size:16px;">
          View Your Order
        </a>
      </div>

      <p style="font-size:14px; color:#666; margin-top:20px;">
        Or copy the link below:<br>
        <strong>https://dukanmitra.com/iframe/order-details.html?orderId=${req.data.orderId}</strong>
      </p>

      <hr style="margin-top:30px;">

      <p style="font-size:13px; text-align:center; color:#999;">
        This is an automated message from Dukan Mitra.
      </p>

    </div>
  </div>
`;

const html_shop = `
  <div style="font-family: Arial, sans-serif; color:#333; padding:20px; background:#f7f7f7;">
    
    <div style="max-width:600px; margin:auto; background:#ffffff; padding:25px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">

      <h2 style="text-align:center; color:#2196F3;">📦 New Order Received</h2>

      <p style="font-size:16px;">Hello <strong>${shopDetal.shopName}</strong>,</p>
      <p style="font-size:15px;">You have received a new order from the customer. Details are below:</p>

      <table style="width:100%; margin-top:15px;">
        <tr>
          <td style="padding:8px 0;"><strong>Order No:</strong></td>
          <td>${req.data.orderId}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;"><strong>Customer Name:</strong></td>
          <td>${user.firstName} ${user.lastName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;"><strong>Customer Phone:</strong></td>
          <td>${user.phoneNumber}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;"><strong>Customer Address:</strong></td>
          <td>${shippingAddress}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;"><strong>Payment Mode:</strong></td>
          <td>${paymentMethod}</td>
        </tr>
      </table>

      <div style="text-align:center; margin:25px 0;">
        <a href="https://dukanmitra.com/iframe/shop-order-details.html?orderId=${req.data.orderId}"
          style="background:#2196F3; color:white; padding:12px 20px; text-decoration:none; border-radius:6px; font-size:16px;">
          View Order Details
        </a>
      </div>

      <p style="font-size:14px; color:#666;">
        Order Link:<br>
        <strong>https://dukanmitra.com/iframe/shop-order-details.html?orderId=${req.data.orderId}</strong>
      </p>

      <hr style="margin-top:30px;">

      <p style="font-size:13px; text-align:center; color:#999;">
        This is an automated message from Dukan Mitra.
      </p>

    </div>
  </div>
`;
    await sendMail(user.email, "Order From Dukan Mitra - "+req.data.orderId, html_user);
    await sendMail(userShopDetail.email, "Order From Dukan Mitra - "+req.data.orderId, html_shop);
    
     } catch (error) {
                     return req.error(400, 'Try Later or login to your account');
                 }   

});
 
this.on('cancelOrder', async (req) => {
    const user = await verifyToken(req);
    if (!user) return req.error(404, 'User not found');

    const { orderId } = req.data;

    // Fetch order
    const order = await SELECT.one.from(Orders).where({ orderId });
    if (!order) return req.error(404, 'Order not found!');

    if (order.status !== 'Pending') {
        return req.error(400, 'Order cannot be canceled at this stage.');
    }
    const user_phoneNumber = user.phoneNumber;
    // Restore stock quantities, we will add this later 
    // const orderItems = await SELECT.from(OrderItems).where({ order_orderId: orderId });
    // for (const item of orderItems) {
    //     const product = await SELECT.one.from(Products).where({ productId: item.product_productId });
    //     await UPDATE(Products).set({ stockQuantity: product.stockQuantity + item.quantity }).where({ productId: product.productId });
    // }

    // Cancel order
    await UPDATE(Orders).set({ status: 'Cancelled' }).where({ orderId,user_phoneNumber });

    return { message: 'Order canceled successfully!' };
});

this.on('updateOrderStatus', async (req) => {
    const user = await verifyToken(req);
    if (!user) return req.error(404, 'User not found');

    const { orderId, status } = req.data;

    const validStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled', 'InProgress'];
    if (!validStatuses.includes(status)) {
        return req.error(400, 'Invalid order status!');
    }
     const order = await SELECT.one.from(Orders).where({ orderId });
    if (!order) return req.error(404, 'Order not found!');
    const existingShop = await SELECT.one.from('cap.dukanmitra.Shops').where({ shopId:order.shop_shopId, ownerPhone_phoneNumber: user.phoneNumber });
    if (!existingShop) return req.error(403, 'Unauthorized or shop not found');

    
    await UPDATE(Orders).set({ status }).where({ orderId });

    return { message: `Order status updated to ${status}` };
});

this.on('updateOrderItemQuantity', async (req) => {
    const { orderId, itemId, newQuantity } = req.data;
    const user = await verifyToken(req);
    if (!user) return req.error(404, 'User not found');
    
    const order = await SELECT.one.from(Orders).where({ orderId });
    if (!order) return req.error(404, 'Order not found!');

    const existingShop = await SELECT.one.from('cap.dukanmitra.Shops').where({ shopId:order.shop_shopId, ownerPhone_phoneNumber: user.phoneNumber });
    if (!existingShop) return req.error(403, 'Unauthorized or shop not found');


    // Fetch the order item based on orderId and itemId
    const orderItem = await SELECT.one.from(OrderItems)
        .where({ order_orderId:orderId,itemId:itemId});

    if (!orderItem) {
        return req.error(404, `Order Item with ID ${itemId} not found for Order ${orderId}`);
    }

    // Ensure the new quantity is valid (e.g., positive integer)
    if (newQuantity <= 0) {
        return req.error(400, 'Quantity must be greater than 0');
    }

    // Update the quantity
    orderItem.quantity = newQuantity;

    // Save the updated order item
    await UPDATE(OrderItems).set({ quantity: newQuantity }).where({ itemId });

    // Optionally, update total amount of the order if necessary
    const updatedOrderItems = await SELECT.from(OrderItems).where({order_orderId:orderId});
 // Calculate total amount and check stock
 let totalAmount = 0;
 for (const item of updatedOrderItems) {
    const product = await SELECT.one.from(Products).where({ productId: item.product_productId });
    if (!product) return req.error(404, `Product not found: ${item.product.productId}`);
    totalAmount += product.sellPrice * item.quantity;
 } 
    
    await UPDATE(Orders).set({ totalAmount }).where({ orderId });

    return `Order item ${itemId} quantity updated to ${newQuantity}`;
});

this.on('deleteOrderItem', async (req) => {
    const { orderId, itemId } = req.data;
    const user = await verifyToken(req);
    if (!user) return req.error(404, 'User not found');
    
    const order = await SELECT.one.from(Orders).where({ orderId });
    if (!order) return req.error(404, 'Order not found!');

    const existingShop = await SELECT.one.from('cap.dukanmitra.Shops').where({ shopId:order.shop_shopId, ownerPhone_phoneNumber: user.phoneNumber });
    if (!existingShop) return req.error(403, 'Unauthorized or shop not found');


    // Fetch the order item based on orderId and itemId
    const orderItem = await SELECT.one.from(OrderItems)
        .where({ order_orderId:orderId,itemId:itemId});

    if (!orderItem) {
        return req.error(404, `Order Item with ID ${itemId} not found for Order ${orderId}`);
    }

    // Ensure the new quantity is valid (e.g., positive integer)
    // if (newQuantity <= 0) {
    //     return req.error(400, 'Quantity must be greater than 0');
    // }

    // Update the quantity
   // orderItem.quantity = newQuantity;

    // Save the updated order item
    // await UPDATE(OrderItems).set({ quantity: newQuantity }).where({ itemId });
        await DELETE.from(OrderItems).where({ itemId });
    // Optionally, update total amount of the order if necessary
    const updatedOrderItems = await SELECT.from(OrderItems).where({order_orderId:orderId});
 // Calculate total amount and check stock
 let totalAmount = 0;
 for (const item of updatedOrderItems) {
    const product = await SELECT.one.from(Products).where({ productId: item.product_productId });
    if (!product) return req.error(404, `Product not found: ${item.product.productId}`);
    totalAmount += product.sellPrice * item.quantity;
 } 
    
    await UPDATE(Orders).set({ totalAmount }).where({ orderId });

    return true;;
});

// this.on('READ', Orders, async (req, next) => {
//     try {
//         const user = await verifyToken(req);  // Validate Token and Fetch User
//         if (!user) return req.reject(404, 'User not found'); 


//         var url = ""
//         if(req.req){
//             url = req.req.originalUrl;
//         }
        
//         async function extractMobileNumber(url) {
//             const match = decodeURIComponent(url).match(/user_phoneNumber\s*eq\s*'(\d+)'/);
//             return match ? match[1] : null;
//         }

//         const userPhNo = await extractMobileNumber(url)
//         if(url==""){
      
//         return await next(); // Fetch data from CAPM  
       
     
//         }else if(userPhNo){
//             if(user.phoneNumber ==userPhNo){
            
//                 let orders = await next(); // Fetch data from CAPM  
           
//             // Ensure `shops` is always an array
//             if (!Array.isArray(orders)) {
//                 orders = [orders];
//             }
    
//             // If request is for a specific orderId
//             const isSingleOrderRequest = req.data.orderId ? true : false;
    
//             return orders.map(order => {

// //====================distance===========

// // Function to calculate distance between two lat/lng points using Haversine formula
// function getDistance(lat1, lon1, lat2, lon2) {
//     const R = 6371; // Radius of Earth in km
//     const dLat = (lat2 - lat1) * (Math.PI / 180);
//     const dLon = (lon2 - lon1) * (Math.PI / 180);
    
//     const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//               Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
//               Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c; // Distance in KM
// }

// // Assume userLocation is provided in the request
// const userLatitude = parseFloat(order.latitude);//userLocation.latitude;
// const userLongitude = parseFloat(order.longitude);//userLocation.longitude;

// // Combine shop and product results with distance calculation

//     let distance = null;
    
//     // Calculate distance only for shops (products don't have a fixed location)
//     if (order.shop.latitude && order.shop.longitude) {
//         distance = getDistance(userLatitude, userLongitude, parseFloat(order.shop.latitude), parseFloat(order.shop.longitude));
//     }

// //========================================

//                 // ✅ If order has shop, return only order and shop
//             if (order.shop && !order.orderItems && !isSingleOrderRequest) {
//                     return {
//                         ...order,
//                         user:{
//                             firstName: order.user.firstName,
//                             lastName: order.user.lastName
//                         },
//                         shop: {
//                             shopId:order.shop.shopId,
//                             type:order.shop.type,
//                             shopName:order.shop.shopName,
//                             shopLocation:order.shop.shopLocation,
//                             shopAddress:order.shop.shopAddress,
//                             shopCity:order.shop.shopCity,
//                             distance: distance ? distance.toFixed(1) : null // Convert to 1 decimal place
                            
//                         }
//                 }
//             }
                
//             });
//             }
//         }else if(req.req.originalUrl.slice(-45)=="&$expand=user,shop&$orderby=modifiedAt%20desc"){
                
//             const decodedUrl = decodeURIComponent(url);

//             // Use a regex to extract the shop_shopId value
//             const match = decodedUrl.match(/shop_shopId\s+eq\s+([a-f0-9-]+)/i);

//             if (match) {
//             var shopId = match[1];
//             } else {
//                 var shopId = null;
//             }
//             const existingShop = await SELECT.one.from('cap.dukanmitra.Shops').where({ shopId, ownerPhone_phoneNumber: user.phoneNumber });
//             if (!existingShop) return req.error(403, 'Unauthorized or shop not found');
                        
            
//             if(existingShop.shopId ==shopId){
//                 let orders = await next(); // Fetch data from CAPM  
               
//                 // Ensure `shops` is always an array
//                 if (!Array.isArray(orders)) {
//                     orders = [orders];
//                 }
        
//                 // If request is for a specific orderId
//                 const isSingleOrderRequest = req.data.orderId ? true : false;
        
//                 return orders.map(order => {
    
//     //====================distance===========
    
//     // Function to calculate distance between two lat/lng points using Haversine formula
//     function getDistance(lat1, lon1, lat2, lon2) {
//         const R = 6371; // Radius of Earth in km
//         const dLat = (lat2 - lat1) * (Math.PI / 180);
//         const dLon = (lon2 - lon1) * (Math.PI / 180);
        
//         const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//                   Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
//                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
//         const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//         return R * c; // Distance in KM
//     }
    
//     // Assume userLocation is provided in the request
//     const userLatitude = parseFloat(order.latitude);//userLocation.latitude;
//     const userLongitude = parseFloat(order.longitude);//userLocation.longitude;
    
//     // Combine shop and product results with distance calculation
    
//         let distance = null;
        
//         // Calculate distance only for shops (products don't have a fixed location)
//         if (order.shop.latitude && order.shop.longitude) {
//             distance = getDistance(userLatitude, userLongitude, parseFloat(order.shop.latitude), parseFloat(order.shop.longitude));
//         }
    
//     //========================================
    
//                     // ✅ If order has shop, return only order and shop
//                 if (order.shop && !order.orderItems && !isSingleOrderRequest) {
//                         return {
//                             ...order,
//                             user:{
//                                 firstName: order.user.firstName,
//                                 lastName: order.user.lastName
//                             },
//                             shop: {
//                                 shopId:order.shop.shopId,
//                                 type:order.shop.type,
//                                 shopName:order.shop.shopName,
//                                 shopLocation:order.shop.shopLocation,
//                                 shopAddress:order.shop.shopAddress,
//                                 shopCity:order.shop.shopCity,
//                                 distance: distance ? distance.toFixed(1) : null // Convert to 1 decimal place
                                
//                             }
//                     }
//                 }
                    
//                 });
//                 }
//                 }
//         else{
//             if(req.req.originalUrl.slice(-62)=='?$expand=user,shop,orderItems($expand=product($expand=medias))'){
//                 let orders = await next(); // Fetch data from CAPM  
               
//                 // Ensure `shops` is always an array
//                 if (!Array.isArray(orders)) {
//                     orders = [orders];
//                 }
        
//                 // If request is for a specific orderId
//                 const isSingleOrderRequest = req.data.orderId ? true : false;
        
//                 return orders.map(order => {

// //====================distance===========

// // Function to calculate distance between two lat/lng points using Haversine formula
// function getDistance(lat1, lon1, lat2, lon2) {
//     const R = 6371; // Radius of Earth in km
//     const dLat = (lat2 - lat1) * (Math.PI / 180);
//     const dLon = (lon2 - lon1) * (Math.PI / 180);
    
//     const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//               Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
//               Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c; // Distance in KM
// }

// // Assume userLocation is provided in the request
// const userLatitude = parseFloat(order.latitude);//userLocation.latitude;
// const userLongitude = parseFloat(order.longitude);//userLocation.longitude;

// // Combine shop and product results with distance calculation

//     let distance = null;
    
//     // Calculate distance only for shops (products don't have a fixed location)
//     if (order.shop.latitude && order.shop.longitude) {
//         distance = getDistance(userLatitude, userLongitude, parseFloat(order.shop.latitude), parseFloat(order.shop.longitude));
//     }

// //========================================

//                 if (order.shop && order.orderItems && isSingleOrderRequest) {
//                         return {
//                             ...order,
//                             user:{
//                                 firstName: order.user.firstName,
//                                 lastName: order.user.lastName
//                             },
//                             shop: {
//                                 shopId:order.shop.shopId,
//                                 type:order.shop.type,
//                                 shopName:order.shop.shopName,
//                                 shopLocation:order.shop.shopLocation,
//                                 shopAddress:order.shop.shopAddress,
//                                 shopCity:order.shop.shopCity,
//                                 distance: distance ? distance.toFixed(1) : null // Convert to 1 decimal place
                                
//                             },
//                             orderItems: order.orderItems
//                                 ? order.orderItems
//                                       .map(item => ({
//                                         ...item,
//                                         product: {
//                                             productId: item.product.productId, 
//                                             productName: item.product.productName,
//                                             category: item.product.category,
//                                             description: item.product.description,
//                                             mrp: item.product.mrp,
//                                             stockQuantity: item.product.stockQuantity,
//                                             sellPrice: item.product.sellPrice,
//                                             online: item.product.online,
//                                             unit: item.product.unit,
//                                             color: item.product.color,
//                                             rating: item.product.rating,
//                                             minQtyToBuy: item.product.minQtyToBuy,
//                                             medias: [{
//                                                 url: item?.product?.medias?.length > 0 ? item.product.medias[0].url : "image/no-image-available.jpg"
//                                             }]
//                                         }
                                        
                                            
//                                         }))
//                                         : []
                                    
                                    
//                         };
//                     }else if (!order.shop && order.orderItems && req.results){
//                         return req.results;
//                     }
                    
//                     else{
//                         return {
//                             status: 205,
//                             message: "error"
//                         };;
//                     }
        
//                     // Default return without modifications
                    
//                 });
//                 }else{
//                     return {
//                         status: 404,
//                         message: error.message
//                     }; 
//                 }
//         }
//     } catch (error) {
//         return {
//             status: 404,
//             message: error.message
//         };
//     }
// });

this.on('READ', Orders, async (req, next) => {
    try {
        // ----------------------------------------------------------
        // 1. VERIFY USER
        // ----------------------------------------------------------
        const user = await verifyToken(req);
        if (!user) return req.reject(404, 'User not found');


        // ----------------------------------------------------------
        // 2. CAPTURE ORIGINAL URL
        // ----------------------------------------------------------
        const url = req?.req?.originalUrl || "";


        // ----------------------------------------------------------
        // 3. HELPERS
        // ----------------------------------------------------------

        // Extract user phone number from filter
        const extractMobileNumber = url =>
            (decodeURIComponent(url).match(/user_phoneNumber\s*eq\s*'(\d+)'/) || [])[1] || null;

        // Extract shopId from filter
        const extractShopId = url =>
            (decodeURIComponent(url).match(/shop_shopId\s+eq\s+([a-f0-9-]+)/i) || [])[1] || null;

        // Distance formula
        const getDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371;
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1 * (Math.PI / 180)) *
                Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) ** 2;

            return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        // Build response for an order (user only or user+shop or full details)
        const buildOrderResponse = (order, isSingleOrderRequest) => {

            // Calculate distance
            let distance = null;
            if (order?.shop?.latitude && order?.shop?.longitude) {
                distance = getDistance(
                    parseFloat(order.latitude),
                    parseFloat(order.longitude),
                    parseFloat(order.shop.latitude),
                    parseFloat(order.shop.longitude)
                );
            }

            const baseOrder = {
                ...order,
                user: {
                    firstName: order.user?.firstName,
                    lastName: order.user?.lastName
                },
                shop: order.shop
                    ? {
                          shopId: order.shop.shopId,
                          type: order.shop.type,
                          shopName: order.shop.shopName,
                          shopLocation: order.shop.shopLocation,
                          shopAddress: order.shop.shopAddress,
                          shopCity: order.shop.shopCity,
                          distance: distance ? distance.toFixed(1) : null
                      }
                    : null
            };

            // FULL DETAILS (Only when $expand=orderItems)
            if (isSingleOrderRequest && order.orderItems) {
                return {
                    ...baseOrder,
                    orderItems: order.orderItems.map(item => ({
                        ...item,
                        product: {
                            productId: item.product.productId,
                            productName: item.product.productName,
                            category: item.product.category,
                            description: item.product.description,
                            mrp: item.product.mrp,
                            stockQuantity: item.product.stockQuantity,
                            sellPrice: item.product.sellPrice,
                            online: item.product.online,
                            unit: item.product.unit,
                            color: item.product.color,
                            rating: item.product.rating,
                            minQtyToBuy: item.product.minQtyToBuy,
                            medias: [
                                {
                                    url:
                                        item?.product?.medias?.[0]?.url ||
                                        "image/no-image-available.jpg"
                                }
                            ]
                        }
                    }))
                };
            }

            return baseOrder;
        };


        // ----------------------------------------------------------
        // 4. BASIC CALL WHEN URL HAS NO FILTER (default query)
        // ----------------------------------------------------------
        const userPhNo = extractMobileNumber(url);
        const shopIdFromUrl = extractShopId(url);
        const isSingleOrderRequest = !!req.data.orderId;


        if (!url) {
            return next();
        }


        // ----------------------------------------------------------
        // 5. USER ORDER LIST
        // ----------------------------------------------------------
        if (userPhNo) {
            if (user.phoneNumber !== userPhNo) {
                return req.error(403, "Unauthorized");
            }

            let orders = await next();
            if(orders[0]?.user_phoneNumber === user.phoneNumber){
            if (!Array.isArray(orders)) orders = [orders];

            return orders.map(order => buildOrderResponse(order, isSingleOrderRequest));

          }
        }


        // ----------------------------------------------------------
        // 6. SHOP OWNER ORDER LIST
        // ----------------------------------------------------------
        if (shopIdFromUrl && url.includes("$expand=user,shop")) {
            const shop = await SELECT.one.from("cap.dukanmitra.Shops").where({
                shopId: shopIdFromUrl,
                ownerPhone_phoneNumber: user.phoneNumber
            });

            if (!shop) return req.error(403, "Unauthorized or shop not found");

            let orders = await next();
            if (!Array.isArray(orders)) orders = [orders];

            return orders.map(order => buildOrderResponse(order, isSingleOrderRequest));
        }


        // ----------------------------------------------------------
        // 7. FULL EXPAND (orderItems + product + medias)
        // ----------------------------------------------------------
        if (url.includes("$expand=user,shop,orderItems")) {
            let orders = await next();
            if(orders?.user_phoneNumber === user.phoneNumber || orders?.shop?.ownerPhone_phoneNumber===user.phoneNumber){
              if (!Array.isArray(orders)) orders = [orders];

              return orders.map(order => buildOrderResponse(order, true));
            }
            
        }


        // ----------------------------------------------------------
        // 8. UNKNOWN REQUEST
        // ----------------------------------------------------------
        return req.error(400, "Invalid or unsupported query");


    } catch (error) {
        return {
            status: 404,
            message: error.message
        };
    }
});

});
