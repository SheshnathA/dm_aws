const cds = require('@sap/cds');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.REFRESH_SECRET; // Store secret in .env
module.exports = async (srv) => {

    const { Shops, Products } = srv.entities;


    // Middleware to Validate JWT Token
    async function verifyToken(req) {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return req.reject(401, 'Unauthorized: No token provided');
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            const user = await cds.run(SELECT.one.from('cap.dukanmitra.Users').where({ phoneNumber: decoded.phoneNumber }));
            if (!user) return req.reject(404, 'User not found');
            return user;  // Return user data for further processing
        } catch (error) {
            return req.reject(401, 'Invalid or expired token');
        }
    }

    srv.on('*', '*', async (req, next) => {
        try {
           // let query = req.req.originalUrl.slice(-15);
            if(req.event=='CREATE') {
                const shopId = req.data.shopProducts_shopId;
                const user = await verifyToken(req);  // Validate Token and Fetch User
                if (!user) return req.error(404, 'User not found');
                // Check if the shop exists
                const shopExists = await SELECT.one.from(Shops).where({ shopId: req.data.shopProducts_shopId,ownerPhone_phoneNumber:user.phoneNumber });
                if (!shopExists) return req.error(404, `Shop with ID ${shopId} not found`);
                req.data.productId = "PROD_"+Math.random().toString(36).substr(2, 16);
                req.data.userProducts_phoneNumber =user.phoneNumber;
                return await next(); 
            }else if(req.event=='UPDATE') {
                const user = await verifyToken(req);  // Validate Token and Fetch User
                if (!user) return req.reject(404, 'User not found');
                const product = await SELECT.one.from(Products).where({ productId: req.data.productId,userProducts_phoneNumber:user.phoneNumber });
                if (!product) return req.error(404, `Product not found`);
                return await next(); 
            }else if(req.event=='DELETE') {
                const user = await verifyToken(req);  // Validate Token and Fetch User
                if (!user) return req.reject(404, 'User not found');
                const product = await SELECT.one.from(Products).where({ productId: req.data.productId,userProducts_phoneNumber:user.phoneNumber });
                if (!product) return req.error(404, `Product not found`);
                return await next(); 
            }else if(req.event=='searchSampleProductByName') {
               const {top, skip, query} = req.data;
                if(query===""){
                const user = await verifyToken(req);  // Validate Token and Fetch User
                if (!user) return req.reject(404, 'User not found');
              //  const product = await SELECT.one.from("products").where({ productId: req.data.productId,userProducts_phoneNumber:user.phoneNumber });
                const product = await SELECT.from("products").limit(top, skip);
                //.where({ 'product_id': { like: `%${query}%` }, 'product_name': { like: `%${query}%` }, 'description': { like: `%${query}%` }});

                if (!product) return req.error(404, `Product not found`);
                const aSampleProd = [];

product.forEach(element => {
  const sampleProd = {  // new object each time
    productId: element.product_id,
    productName: element.product_name,
    description: element.description,
    mrp: element.mrp,
    sellPrice: element.ws_off1,
    category_categoryId: element.category,
    brand: element.color,
    unit: element.size,
    offer: element.off,
    stockQuantity: element.stocks
  };

  aSampleProd.push(sampleProd);
});

return aSampleProd;
                }else{
               const user = await verifyToken(req);  // Validate Token and Fetch User
                if (!user) return req.reject(404, 'User not found');
              //  const product = await SELECT.one.from("products").where({ productId: req.data.productId,userProducts_phoneNumber:user.phoneNumber });
                const product = await SELECT.from("products").where({ 'product_name': { like: `%${query}%` } }).limit(top, skip);
                //.where({ 'product_id': { like: `%${query}%` }, 'product_name': { like: `%${query}%` }, 'description': { like: `%${query}%` }});

                if (!product) return req.error(404, `Product not found`);
               const aSampleProd = [];

product.forEach(element => {
  const sampleProd = {  // new object each time
    productId: element.product_id,
    productName: element.product_name,
    description: element.description,
    mrp: element.mrp,
    sellPrice: element.ws_off1,
    category_categoryId: element.category,
    brand: element.color,
    unit: element.size,
    offer: element.off,
    stockQuantity: element.stocks
  };

  aSampleProd.push(sampleProd);
});

return aSampleProd;
                }
               
               
            }else if(req.event=='searchSampleProductByBarcode') {
            const {barcode} = req.data;
            const user = await verifyToken(req);  // Validate Token and Fetch User
            if (!user) return req.reject(404, 'User not found');
          //  const product = await SELECT.one.from("products").where({ productId: req.data.productId,userProducts_phoneNumber:user.phoneNumber });
            const product = await SELECT.from("products").where({ 'product_id': { like: `%${barcode}%` } }).limit(top, skip);
            //.where({ 'product_id': { like: `%${query}%` }, 'product_name': { like: `%${query}%` }, 'description': { like: `%${query}%` }});

            if (!product) return req.error(404, `Product not found`);
           const aSampleProd = [];

product.forEach(element => {
  const sampleProd = {  // new object each time
    productId: element.product_id,
    productName: element.product_name,
    description: element.description,
    mrp: element.mrp,
    sellPrice: element.ws_off1,
    category_categoryId: element.category,
    brand: element.color,
    unit: element.size,
    offer: element.off,
    stockQuantity: element.stocks
  };

  aSampleProd.push(sampleProd);
});

return aSampleProd;
        }
            else{
                const user = await verifyToken(req);  // Validate Token and Fetch User
                if (!user) return req.reject(404, 'User not found');
                return {
                    status: 500,
                    error: "Internal Server Error",
                    message: "An unexpected error occurred",
                };
            }
        
        } catch (error) {
           // console.error(`[ERROR] ${req.event} on ${req.target?.name || "Unknown"}:`, error);
    
            // ✅ Return a structured error response
            return {
                status: error.status || 500,
                error: error.name || "Internal Server Error",
                message: error.message || "An unexpected error occurred",
            };
        }
    });

    // 🔹 Create a New Product for a Shop
    // srv.before('CREATE', 'Products', async (req) => {
    //    // const { shopProducts_shopId } = req.data;
    //    //ownerPhone_phoneNumber:user.phoneNumber
    //    const shopId = req.data.shopProducts_shopId;
    //     const user = await verifyToken(req);  // Validate Token and Fetch User
    //     if (!user) return req.error(404, 'User not found');
    //     // Check if the shop exists
    //     const shopExists = await SELECT.one.from(Shops).where({ shopId: req.data.shopProducts_shopId,ownerPhone_phoneNumber:user.phoneNumber });
    //     if (!shopExists) return req.error(404, `Shop with ID ${shopId} not found`);
    //     req.data.productId = "PROD_"+Math.random().toString(36).substr(2, 16);
    //     req.data.userProducts_phoneNumber =user.phoneNumber;
    // });

};
