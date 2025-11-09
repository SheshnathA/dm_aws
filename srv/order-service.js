const cds = require('@sap/cds');
const jwt = require('jsonwebtoken');
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

        const {shopId, orderItems, paymentMethod, shippingAddress } = req.data;
        if (!orderItems || orderItems.length === 0) return req.error(400, 'Order must contain at least one item.');

        // Calculate total amount and check stock
        let totalAmount = 0;
        for (const item of orderItems) {
            const product = await SELECT.one.from(Products).where({ productId: item.product.productId });
            if (!product) return req.error(404, `Product not found: ${item.product.productId}`);
             // Reduce stock will do later if shop interested to maintain stocks
            // if (product.stockQuantity < item.quantity) {
            //     return req.error(400, `Insufficient stock for ${product.productName}`);
            // }     
            //await UPDATE(Products).set({ stockQuantity: product.stockQuantity - item.quantity }).where({ productId: product.productId });
            

            totalAmount += product.sellPrice * item.quantity;

            req.data.orderId =  Math.random().toString().substring(2,10);
            req.data.user_phoneNumber = user.phoneNumber;
            req.data.totalAmount = totalAmount;
            req.data.status = "Pending";
            
        // // const { shopProducts_shopId } = req.data;
        // const shopId = req.data.shopProducts_shopId;
        //  const user = await verifyToken(req);  // Validate Token and Fetch User
        //  if (!user) return req.error(404, 'User not found');
        //  // Check if the shop exists
        //  const shopExists = await SELECT.one.from(Shops).where({ shopId });
        //  if (!shopExists) return req.error(404, `Shop with ID ${shopId} not found`);
        //  req.data.productId =  user.phoneNumber+"_PROD_"+Math.random().toString(36).substr(2, 4);
        //  req.data.userProducts_phoneNumber =user.phoneNumber;
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

this.on('READ', Orders, async (req, next) => {
    try {
        const user = await verifyToken(req);  // Validate Token and Fetch User
        if (!user) return req.reject(404, 'User not found'); 


        var url = ""
        if(req.req){
            url = req.req.originalUrl;
        }
        
        async function extractMobileNumber(url) {
            const match = decodeURIComponent(url).match(/user_phoneNumber\s*eq\s*'(\d+)'/);
            return match ? match[1] : null;
        }

        const userPhNo = await extractMobileNumber(url)
        if(url==""){
      
        return await next(); // Fetch data from CAPM  
       
     
        }else if(userPhNo){
            if(user.phoneNumber ==userPhNo){
            let orders = await next(); // Fetch data from CAPM  
           
            // Ensure `shops` is always an array
            if (!Array.isArray(orders)) {
                orders = [orders];
            }
    
            // If request is for a specific orderId
            const isSingleOrderRequest = req.data.orderId ? true : false;
    
            return orders.map(order => {

//====================distance===========

// Function to calculate distance between two lat/lng points using Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in KM
}

// Assume userLocation is provided in the request
const userLatitude = parseFloat(order.latitude);//userLocation.latitude;
const userLongitude = parseFloat(order.longitude);//userLocation.longitude;

// Combine shop and product results with distance calculation

    let distance = null;
    
    // Calculate distance only for shops (products don't have a fixed location)
    if (order.shop.latitude && order.shop.longitude) {
        distance = getDistance(userLatitude, userLongitude, parseFloat(order.shop.latitude), parseFloat(order.shop.longitude));
    }

//========================================

                // ✅ If order has shop, return only order and shop
            if (order.shop && !order.orderItems && !isSingleOrderRequest) {
                    return {
                        ...order,
                        user:{
                            firstName: order.user.firstName,
                            lastName: order.user.lastName
                        },
                        shop: {
                            shopId:order.shop.shopId,
                            type:order.shop.type,
                            shopName:order.shop.shopName,
                            shopLocation:order.shop.shopLocation,
                            shopAddress:order.shop.shopAddress,
                            shopCity:order.shop.shopCity,
                            distance: distance ? distance.toFixed(1) : null // Convert to 1 decimal place
                            
                        }
                }
            }
                
            });
            }
        }else if(req.req.originalUrl.slice(-45)=="&$expand=user,shop&$orderby=modifiedAt%20desc"){
                
            const decodedUrl = decodeURIComponent(url);

            // Use a regex to extract the shop_shopId value
            const match = decodedUrl.match(/shop_shopId\s+eq\s+([a-f0-9-]+)/i);

            if (match) {
            var shopId = match[1];
            } else {
                var shopId = null;
            }
            const existingShop = await SELECT.one.from('cap.dukanmitra.Shops').where({ shopId, ownerPhone_phoneNumber: user.phoneNumber });
            if (!existingShop) return req.error(403, 'Unauthorized or shop not found');
                        
            
            if(existingShop.shopId ==shopId){
                let orders = await next(); // Fetch data from CAPM  
               
                // Ensure `shops` is always an array
                if (!Array.isArray(orders)) {
                    orders = [orders];
                }
        
                // If request is for a specific orderId
                const isSingleOrderRequest = req.data.orderId ? true : false;
        
                return orders.map(order => {
    
    //====================distance===========
    
    // Function to calculate distance between two lat/lng points using Haversine formula
    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of Earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in KM
    }
    
    // Assume userLocation is provided in the request
    const userLatitude = parseFloat(order.latitude);//userLocation.latitude;
    const userLongitude = parseFloat(order.longitude);//userLocation.longitude;
    
    // Combine shop and product results with distance calculation
    
        let distance = null;
        
        // Calculate distance only for shops (products don't have a fixed location)
        if (order.shop.latitude && order.shop.longitude) {
            distance = getDistance(userLatitude, userLongitude, parseFloat(order.shop.latitude), parseFloat(order.shop.longitude));
        }
    
    //========================================
    
                    // ✅ If order has shop, return only order and shop
                if (order.shop && !order.orderItems && !isSingleOrderRequest) {
                        return {
                            ...order,
                            user:{
                                firstName: order.user.firstName,
                                lastName: order.user.lastName
                            },
                            shop: {
                                shopId:order.shop.shopId,
                                type:order.shop.type,
                                shopName:order.shop.shopName,
                                shopLocation:order.shop.shopLocation,
                                shopAddress:order.shop.shopAddress,
                                shopCity:order.shop.shopCity,
                                distance: distance ? distance.toFixed(1) : null // Convert to 1 decimal place
                                
                            }
                    }
                }
                    
                });
                }
                }
        else{
            if(req.req.originalUrl.slice(-62)=='?$expand=user,shop,orderItems($expand=product($expand=medias))'){
                let orders = await next(); // Fetch data from CAPM  
               
                // Ensure `shops` is always an array
                if (!Array.isArray(orders)) {
                    orders = [orders];
                }
        
                // If request is for a specific orderId
                const isSingleOrderRequest = req.data.orderId ? true : false;
        
                return orders.map(order => {

//====================distance===========

// Function to calculate distance between two lat/lng points using Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in KM
}

// Assume userLocation is provided in the request
const userLatitude = parseFloat(order.latitude);//userLocation.latitude;
const userLongitude = parseFloat(order.longitude);//userLocation.longitude;

// Combine shop and product results with distance calculation

    let distance = null;
    
    // Calculate distance only for shops (products don't have a fixed location)
    if (order.shop.latitude && order.shop.longitude) {
        distance = getDistance(userLatitude, userLongitude, parseFloat(order.shop.latitude), parseFloat(order.shop.longitude));
    }

//========================================

                if (order.shop && order.orderItems && isSingleOrderRequest) {
                        return {
                            ...order,
                            user:{
                                firstName: order.user.firstName,
                                lastName: order.user.lastName
                            },
                            shop: {
                                shopId:order.shop.shopId,
                                type:order.shop.type,
                                shopName:order.shop.shopName,
                                shopLocation:order.shop.shopLocation,
                                shopAddress:order.shop.shopAddress,
                                shopCity:order.shop.shopCity,
                                distance: distance ? distance.toFixed(1) : null // Convert to 1 decimal place
                                
                            },
                            orderItems: order.orderItems
                                ? order.orderItems
                                      .map(item => ({
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
                                            medias: [{
                                                url: item?.product?.medias?.length > 0 ? item.product.medias[0].url : "image/no-image-available.jpg"
                                            }]
                                        }
                                        
                                            
                                        }))
                                        : []
                                    
                                    
                        };
                    }else if (!order.shop && order.orderItems && req.results){
                        return req.results;
                    }
                    
                    else{
                        return {
                            status: 205,
                            message: "error"
                        };;
                    }
        
                    // Default return without modifications
                    
                });
                }else{
                    return {
                        status: 404,
                        message: error.message
                    }; 
                }
        }
    } catch (error) {
        return {
            status: 404,
            message: error.message
        };
    }
});

});
