const { forEach } = require('@newdash/newdash');
const cds = require('@sap/cds');
const jwt = require('jsonwebtoken');
const { forEachChild } = require('typescript');
const SECRET_KEY = process.env.REFRESH_SECRET; // Store secret in .env

module.exports = async (srv) => {
        const {Products,Shops,Media,Users} = srv.entities;
        
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

    srv.on('*', '*', async (req, next) => {

    try {
        if(req.event=='READ' && (req.req.originalUrl.slice(-15)=='&$expand=medias'))
            {  
            const user = await verifyToken(req);  // Validate Token and Fetch User
            if (!user) return req.reject(404, 'User not found'); 
            if(req._params){
                const userPhNo = req._params[0].phoneNumber;
                if(user.phoneNumber ==userPhNo){
            let shops = await next(); // Fetch data from CAPM  
    
            // Ensure `shops` is always an array
            if (!Array.isArray(shops)) {
                shops = [shops];
            }
    
    
            return shops.map(shop => {
                //  If shop has medias, return only shop + verified medias
                if (shop.medias) {
                    return {
                        ...shop,
                        medias: shop.medias
                            ? shop.medias
                                  .filter(media => media.shopMedia_shopId==shop.shopId && media.mediaCategory == "ShopBanner") // ✅ Properly filters
                                  .map(media => ({ url: media.url })) 
                            : [], 
                    };
                }
                
            });
        }
    }
        }else if(req.event=='READ' && (req.req.originalUrl.slice(-14)=='$expand=medias'))
            {  
            const user = await verifyToken(req);  // Validate Token and Fetch User
            if (!user) return req.reject(404, 'User not found'); 
            if(req._params){
                const userPhNo = req._params[0].phoneNumber;
                if(user.phoneNumber ==userPhNo){
            let products = await next(); // Fetch data from CAPM  
    
            // Ensure `shops` is always an array
            if (!Array.isArray(products)) {
                products = [products];
            }
    
      
    
            return products.map(product => {
                
    
                // If shop has products (and it's a single shop request), return shop + verified products & medias
                if (product.medias) {
                    return {
                        ...product,
                        
                        medias: product.medias
                        ? product.medias
                              .filter(media => media.shopMedia_shopId==product.shopProducts_shopId && media.mediaCategory === "ProductImage") // ✅ Only keep verified medias
                              .map(media => ({ url: media.url })) // ✅ Return only `url`
                        : [], // ✅ Ensure `medias` is always an array
                
                    };
                }
                
    
                // Default return without modifications
                
            });
        }
    }
        }
        else if((req.event=='READ' && req.req.originalUrl.slice(-7)=='/medias')){
        const user = await verifyToken(req);  // Validate Token and Fetch User
        if (!user) return req.reject(404, 'User not found'); 
    
        if(req._params.length==1 && req._params[0].shopId){
            const shopId = req._params[0].shopId;
            const existingShop = await SELECT.one.from('cap.dukanmitra.Shops').where({ shopId, ownerPhone_phoneNumber: user.phoneNumber });
            if (!existingShop) return req.error(403, 'Unauthorized or shop not found');
            if(existingShop.shopId ==shopId){
            let allshopMedia =  await next(); 
            mediaArr = [];
            const finalMedia = allshopMedia.map(media => {
                if (media.mediaCategory == "ShopBanner") {
                    mediaArr.push(media);
                
                }
            
            });
            return mediaArr; 
       }
        }
        if(req._params.length==2 && req._params[0].shopId && req._params[1].productId){
            const shopId = req._params[0].shopId;
            const existingShop = await SELECT.one.from('cap.dukanmitra.Shops').where({ shopId, ownerPhone_phoneNumber: user.phoneNumber });
            if (!existingShop) return req.error(403, 'Unauthorized or shop not found');
            if(existingShop.shopId ==shopId){
            let allshopMedia =  await next(); 
            mediaArr = [];
            const finalMedia = allshopMedia.map(media => {
                if (media.mediaCategory == "ProductImage") {
                    mediaArr.push(media);
                
                }
            
            });
            return mediaArr; 
       }
            
        }
        } else if((req.event=='createShop' && req.req.originalUrl=='/odata/v4/shop/createShop')
                || (req.event=='updateShop' && req.req.originalUrl=='/odata/v4/shop/updateShop')
                || (req.event=='updateShopStatus' && req.req.originalUrl=='/odata/v4/shop/updateShopStatus')){
               return await next();
        }
        else{
            return {
                status: 500,
                error: "Internal Server Error",
                message: "An unexpected error occurred",
            };
        }
        } catch (error) {
            return {
                    status: 500,
                    error: "Internal Server Error",
                    message: "An unexpected error occurred",
                };
        }

    });

    // Create a Shop
    srv.on('createShop', async (req) => {
        try {
            const user = await verifyToken(req);  // Validate Token and Fetch User
            if (!user) return req.error(404, 'User not found');
            const { shopName, type, shopAddress, shopType, category_categoryId, shopOffer, shopLocation, shopCity, latitude, longitude } = req.data.shop;
            const newShop = await INSERT.into('cap.dukanmitra.Shops').entries({
                shopId: cds.utils.uuid(),
                ownerPhone_phoneNumber: user.phoneNumber,
                shopName,
                type,
                shopAddress,
                shopType,
                category_categoryId,
                shopOffer,
                shopLocation,
                shopCity,
                online:"Closed",
                latitude,
                longitude
            });

            return newShop;
        } catch (error) {
            return req.error(401, 'Invalid or expired token');
        }
    });

    // Get All Shops for a User
    srv.on('getUserShops', async (req) => {
        try {
            const user = await verifyToken(req);  // Validate Token and Fetch User
            if (!user) return req.error(404, 'User not found');
            const shops = await SELECT.from('cap.dukanmitra.Shops').where({ ownerPhone_phoneNumber: user.phoneNumber });

            return shops;
        } catch (error) {
            return req.error(401, 'Invalid or expired token');
        }
    });

    // Update Shop
    srv.on('updateShop', async (req) => {
        try {
            const user = await verifyToken(req);  // Validate Token and Fetch User
            if (!user) return req.error(404, 'User not found');
            const { shopId, shop } = req.data;

            const existingShop = await SELECT.one.from('cap.dukanmitra.Shops').where({ shopId, ownerPhone_phoneNumber: user.phoneNumber });
            if (!existingShop) return req.error(403, 'Unauthorized or shop not found');

            await UPDATE('cap.dukanmitra.Shops').set(shop).where({ shopId });

            return true;
        } catch (error) {
            return req.error(401, 'Invalid or expired token');
        }
    });

    // Update Shop Status
    srv.on('updateShopStatus', async (req) => {
        try {
            const user = await verifyToken(req);  // Validate Token and Fetch User
            if (!user) return req.error(404, 'User not found');
            const { shopId, shop } = req.data;

            const existingShop = await SELECT.one.from('cap.dukanmitra.Shops').where({ shopId, ownerPhone_phoneNumber: user.phoneNumber });
            if (!existingShop) return req.error(403, 'Unauthorized or shop not found');

            await UPDATE('cap.dukanmitra.Shops').set(shop).where({ shopId });

            return true;
        } catch (error) {
            return req.error(401, 'Invalid or expired token');
        }
    });

    // Delete Shop
    srv.on('deleteShop', async (req) => {
        try {
            const user = await verifyToken(req);  // Validate Token and Fetch User
            if (!user) return req.error(404, 'User not found');
            const { shopId } = req.data;

            const existingShop = await SELECT.one.from('cap.dukanmitra.Shops').where({ shopId, ownerPhone_phoneNumber: user.phoneNumber });
            if (!existingShop) return req.error(403, 'Unauthorized or shop not found');

            await DELETE.from('cap.dukanmitra.Shops').where({ shopId });

            return true;
        } catch (error) {
            return req.error(401, 'Invalid or expired token');
        }
    });



};
