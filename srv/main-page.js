const { functions } = require('@newdash/newdash');
const cds = require('@sap/cds');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.REFRESH_SECRET;
module.exports = async (srv) => {
    const {Likes, Users, Shops, Products} = srv.entities;

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
            // if(req.event=='READ' && (req.req.originalUrl=='/odata/v4/no-auth/Category' 
            //     || req.req.originalUrl=='/odata/v4/no-auth/Shops?$expand=medias&$skip=0&$top=2' 
            //     || req.req.originalUrl.slice(-15)=='categoryPicture'
            //     || req.req.originalUrl.slice(-33)== '?$expand=products($expand=medias)' 
            //     || req.req.originalUrl.slice(-15)== '&$expand=medias'
            //     || req.req.originalUrl.slice(0,32)=='/odata/v4/no-auth/Shops?$search=')) {
            if(req.event=='READ') {
                return await next();
            }
            else if(req.event=='search'){
  
                const { query } = req.data;
                if (!query) return [];
        
                const db = cds.transaction(req);
        
               
                // const shopResults = await db.run(
                //     SELECT.from('cap.dukanmitra.Shops as s')
                //         .columns([
                //             's.shopId as sid',
                //             'null as pid',               // Shops don't have a product ID
                //             `'Shop' as type`,            // Type is "Shop"
                //             's.shopName as name',
                //             's.online as online',
                //             's.shopCity as shopCity',
                //             's.shopLocation as shopLocation',
                //             's.latitude as latitude',
                //             's.longitude as longitude',
                //             's.shopAddress as address',
                //             'null as description',       // Shops don't have descriptions
                //             `(SELECT m.url FROM cap.dukanmitra.Media as m 
                //               WHERE m.shopMedia_shopId = s.shopId 
                //               ORDER BY m.createdAt ASC LIMIT 1) as mediaUrl` // Get first media URL
                //         ])
                //         .where({ 's.shopName': { like: `%${query}%` } })
                // );
            
                // // Search Products
                // const productResults = await db.run(
                //     SELECT.from('cap.dukanmitra.Products as p')
                //         .columns([
                //             'p.shopProducts_shopId as sid',
                //             'p.productId as pid',
                //             `'Product' as type`,         // Type is "Product"
                //             'p.productName as name',
                //             's.shopName as shopName',
                //             's.online as online',
                //             's.shopCity as shopCity',    
                //             's.shopLocation as shopLocation',
                //             's.latitude as latitude',
                //             's.longitude as longitude',
                //             'null as address',           // Products don't have addresses
                //             'p.description',             // Products have descriptions
                //             `(SELECT m.url FROM cap.dukanmitra.Media as m 
                //               WHERE m.productMedia_productId = p.productId 
                //               ORDER BY m.createdAt ASC LIMIT 1) as mediaUrl` // Get first media URL
                //         ])
                //         .leftJoin('cap.dukanmitra.Shops as s')
                //         .on({ 's.shopId': 'p.shopProducts_shopId' })  // Join to get shop details
                //         .where({ 'p.productName': { like: `%${query}%` } })
                // );
            


// Search Shops (only verified)
const shopResults = await db.run(
    SELECT.from('cap.dukanmitra.Shops as s')
        .columns([
            's.shopId as sid',
            'null as pid',               // Shops don't have a product ID
            `'Shop' as type`,            // Type is "Shop"
            's.shopName as name',
            's.online as online',
            's.shopCity as shopCity',
            's.shopLocation as shopLocation',
            's.latitude as latitude',
            's.longitude as longitude',
            's.shopAddress as address',
            'null as description',       // Shops don't have descriptions
            `(SELECT m.url FROM cap.dukanmitra.Media as m 
              WHERE m.shopMedia_shopId = s.shopId 
              ORDER BY m.createdAt ASC LIMIT 1) as mediaUrl` // Get first media URL
        ])
        .where({
            's.shopName': { like: `%${query}%` },
            's.isVerified': 1              // ✅ Only verified shops
        })
);

// Search Products (only from verified shops)
const productResults = await db.run(
    SELECT.from('cap.dukanmitra.Products as p')
        .columns([
            'p.shopProducts_shopId as sid',
            'p.productId as pid',
            `'Product' as type`,         // Type is "Product"
            'p.productName as name',
            's.shopName as shopName',
            's.online as online',
            's.shopCity as shopCity',    
            's.shopLocation as shopLocation',
            's.latitude as latitude',
            's.longitude as longitude',
            'null as address',           // Products don't have addresses
            'p.description',             // Products have descriptions
            `(SELECT m.url FROM cap.dukanmitra.Media as m 
              WHERE m.productMedia_productId = p.productId 
              ORDER BY m.createdAt ASC LIMIT 1) as mediaUrl` // Get first media URL
        ])
        .leftJoin('cap.dukanmitra.Shops as s')
        .on({ 's.shopId': 'p.shopProducts_shopId' })
        .where({
            'p.productName': { like: `%${query}%` },
            's.isVerified': 1              // ✅ Only products from verified shops
        })
);



//================
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

const userLocation = JSON.parse(req.headers.location); 
            if(userLocation){
            // Assume userLocation is provided in the request
            const userLatitude = userLocation.latitude;//userLocation.latitude;
            const userLongitude = userLocation.longitude;//userLocation.longitude;

// Combine shop and product results with distance calculation
const allResults = [...shopResults, ...productResults].map((item) => {
    let distance = null;
    
    // Calculate distance only for shops (products don't have a fixed location)
    if (item.latitude && item.longitude) {
        distance = getDistance(userLatitude, userLongitude, parseFloat(item.latitude), parseFloat(item.longitude));
    }

    return {
        sid: item.sid,
        pid: item.pid || null, // Ensure null for shops
        type: item.type,
        name: item.name,
        online: item.online,
        
        shopCity: item.shopCity,
        shopName: item.shopName || item.name, // Use shopName for both shops & products
        shopLocation: item.shopLocation || null, // Include shop location
        address: item.address || null, // Only shops have addresses
        description: item.description || null, // Only products have descriptions
        mediaUrl: item.mediaUrl || null, // First media URL if available
        distance: distance ? distance.toFixed(1) : null // Convert to 1 decimal place
    };
});

// Sort results by nearest distance (optional)
allResults.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
//================

// Ensure unique results based on shopId (sid) AND type
const uniqueResults = Array.from(
    new Map(allResults.map(item => [`${item.sid}-${item.type}`, item])).values()
);

return uniqueResults;
            }else{
                return {
                    status: error.status || 500,
                    error: error.name || "Internal Server Error",
                    message: error.message || "An unexpected error occurred",
                };
            }

            }else if(req.event=='likeShop' || req.event=='dislikeShop' || req.event=='getPlace'){
                return await next();
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
    //Read only verified shops with images
    srv.on('READ', Shops, async (req, next) => {
        try {
            let shops = await next(); // Fetch data from CAPM  
    
            // Ensure `shops` is always an array
            if (!Array.isArray(shops)) {
                shops = [shops];
            }
    
            // If request is for a specific shopId
            const isSingleShopRequest = req.data.shopId ? true : false;
            function calculateDistance(lat1, lon1, lat2, lon2) {
                const R = 6371; // Radius of Earth in km
                const dLat = (lat2 - lat1) * (Math.PI / 180);
                const dLon = (lon2 - lon1) * (Math.PI / 180);
                
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                          Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                          Math.sin(dLon / 2) * Math.sin(dLon / 2);
                
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c; // Distance in KM
            }
            const userLocation = JSON.parse(req.headers.location);
            if(userLocation){
            // Assume userLocation is provided in the request
            const userLatitude = userLocation.latitude;//userLocation.latitude;
            const userLongitude = userLocation.longitude;//userLocation.longitude;
            return shops
            .map(shop => {
                // Calculate distance
                const distance = shop.latitude && shop.longitude
                    ? calculateDistance(userLatitude, userLongitude, shop.latitude, shop.longitude).toFixed(1) + " KM"
                    : "N/A";
        
                // If shop has medias but no products (not a single shop request)
                if (shop.medias && !shop.products && !isSingleShopRequest) {
                    return {
                         shopId:shop.shopId,
                         shopName:shop.shopName,
                         category_categoryId:shop.category_categoryId,
                         online:shop.online,
                         shopCity:shop.shopCity,
                         shopLocation:shop.shopLocation,
                         shopOffer:shop.shopOffer,
                         shopType:shop.shopType,
                         type:shop.type,
                         totalLikes:shop.totalLikes,
                        distance,
                        medias: shop.medias
                            ? shop.medias
                                  .filter(media => 
                                      media.isVerified === true && 
                                      media.shopMedia_shopId == shop.shopId && 
                                      media.mediaCategory == "ShopBanner"
                                  )
                                  .map(media => ({ url: media.url })) 
                            : []        
                    };
                }
        
                // If shop has both medias and products (not a single shop request)
                if (shop.medias && shop.products.length !== 0 && !isSingleShopRequest) {
                    return {
                        shopId:shop.shopId,
                         shopName:shop.shopName,
                         category_categoryId:shop.category_categoryId,
                         online:shop.online,
                         shopCity:shop.shopCity,
                         shopLocation:shop.shopLocation,
                         shopOffer:shop.shopOffer,
                         shopType:shop.shopType,
                         type:shop.type,
                         totalLikes:shop.totalLikes,
                        distance,
                        products: [{}], // Placeholder if needed
                        medias: shop.medias
                            ? shop.medias
                                  .filter(media => 
                                      media.isVerified === true && 
                                      media.shopMedia_shopId == shop.shopId && 
                                      media.mediaCategory == "ShopBanner"
                                  )
                                  .map(media => ({ url: media.url })) 
                            : []        
                    };
                }
        
                // If it's a single shop request and has products, return verified products & medias
                if (shop.medias && shop.products && isSingleShopRequest) {
                    return {
                        shopId:shop.shopId,
                         shopName:shop.shopName,
                         category_categoryId:shop.category_categoryId,
                         online:shop.online,
                         shopCity:shop.shopCity,
                         shopLocation:shop.shopLocation,
                         shopOffer:shop.shopOffer,
                         shopType:shop.shopType,
                         type:shop.type,
                         totalLikes:shop.totalLikes,
                        medias: shop.medias
                            ? shop.medias
                                  .filter(media => 
                                      media.isVerified === true && 
                                      media.shopMedia_shopId == shop.shopId && 
                                      media.mediaCategory == "ShopBanner"
                                  )
                                  .map(media => ({ url: media.url })) 
                            : [],
                        distance,
                        products: shop.products
                            ? shop.products
                                  .filter(product => product.isVerified === true) 
                                  .map(product => ({
                                        productId: product.productId, 
                                        productName: product.productName, 
                                        category: product.category,
                                        description: product.description,
                                        mrp: product.mrp,
                                        stockQuantity: product.stockQuantity,
                                        sellPrice: product.sellPrice,
                                        online: product.online,
                                        unit: product.unit,
                                        color: product.color,
                                        rating: product.rating,
                                        minQtyToBuy: product.minQtyToBuy,
                                        medias: product.medias
                                            ? product.medias
                                                  .filter(media => 
                                                      media.isVerified === true && 
                                                      media.mediaCategory === "ProductImage"
                                                  )
                                                  .map(media => ({ url: media.url })) 
                                            : [], // Ensure `medias` is always an array
                                  }))
                            : [] // Ensure `products` is always an array
                    };
                }
                if (shop.products && isSingleShopRequest) {
                    return {
                        shopId:shop.shopId,
                         shopName:shop.shopName,
                         category_categoryId:shop.category_categoryId,
                         online:shop.online,
                         shopCity:shop.shopCity,
                         shopLocation:shop.shopLocation,
                         shopOffer:shop.shopOffer,
                         shopType:shop.shopType,
                         type:shop.type,
                         totalLikes:shop.totalLikes,
                        distance,
                        products: shop.products
                            ? shop.products
                                  .filter(product => product.isVerified === true) 
                                  .map(product => ({
                                        productId: product.productId, 
                                        productName: product.productName, 
                                        category: product.category,
                                        description: product.description,
                                        mrp: product.mrp,
                                        stockQuantity: product.stockQuantity,
                                        sellPrice: product.sellPrice,
                                        online: product.online,
                                        unit: product.unit,
                                        color: product.color,
                                        rating: product.rating,
                                        minQtyToBuy: product.minQtyToBuy,
                                        medias: product.medias
                                            ? product.medias
                                                  .filter(media => 
                                                      media.isVerified === true && 
                                                      media.mediaCategory === "ProductImage"
                                                  )
                                                  .map(media => ({ url: media.url })) 
                                            : [], // Ensure `medias` is always an array
                                  }))
                            : [] // Ensure `products` is always an array
                    };
                }
                // Default case (error handling)
                return {
                    status: 205,
                    message: "error"
                };
            })
            .sort((a, b) => {
                // Sort only if both distances are valid numbers
                const distanceA = parseFloat(a.distance);
                const distanceB = parseFloat(b.distance);
                
                if (!isNaN(distanceA) && !isNaN(distanceB)) {
                    return distanceA - distanceB; // Ascending order (nearest first)
                }
                return 0; // Keep order unchanged if distances are not valid
            });
            }else{
                return {
                    status: 404,
                    message: error.message
                };
            }
          
        } catch (error) {
            return {
                status: 404,
                message: error.message
            };
        }
    });
    
    //Read only verified products with images by shop
    // srv.on('READ', Products, async (req, next) => {
    //     try {
    //         // Extract shopId from request parameters
    //         const { shopId } = req.params; 
    
    //         // Fetch products filtered by `shopId` and `isVerified = true`
    //         let products = await SELECT.from(Products)
    //             .where({ shopProducts: shopId, isVerified: true }) // ✅ Filter verified products for the shop
    //             .columns(
    //                 'productId',
    //                 'productName'
    //             );
    
    //         // Map response and filter only verified medias
    //         return products.map(product => ({
    //             ...product,
    //             medias: product.medias
    //                 ? product.medias.filter(media => media.isVerified === true && media.mediaCategory === "ProductImage").map(media => ({ url: media.url }))
    //                 : [] // ✅ Ensure `medias` is always an array
    //         }));
    //     } catch (error) {
    //         console.error("Error fetching products:", error);
    //         return req.error(500, "Internal Server Error");
    //     }
    // });



    //=====================like=========
 // Function to handle shop likes
 srv.on('likeShop', async (req) => {
    const { shopId } = req.data;
    const user = await verifyToken(req); // Validate Token and Fetch User
    if (!user) return req.reject(404, 'User not found');

    const existingLike = await SELECT.one.from(Likes).where({ 
        shopLike_shopId: shopId, 
        userLike_phoneNumber: user.phoneNumber 
    });

    if (existingLike) {
        await DELETE.from(Likes).where({ likeid: existingLike.likeid });
        await UPDATE(Shops).set({ totalLikes: { '-=': 1 } }).where({ shopId });
    } else {
        await INSERT.into(Likes).entries({ shopLike_shopId: shopId, userLike_phoneNumber: user.phoneNumber });
        await UPDATE(Shops).set({ totalLikes: { '+=': 1 } }).where({ shopId });
    }

    // Fetch updated totalLikes
    const updatedShop = await SELECT.one`totalLikes`.from(Shops).where({ shopId });

    return { totalLikes: updatedShop.totalLikes }; // Return updated count
});


// Function to handle product likes
srv.on('likeProduct', async (req) => {
    const { productId } = req.data;
        const user = await verifyToken(req);  // Validate Token and Fetch User
        if (!user) return req.reject(404, 'User not found');
    const existingLike = await SELECT.one.from(Likes).where({ productLike_productId: productId, userLike_phoneNumber: user.phoneNumber });

    if (existingLike) {
        await DELETE.from(Likes).where({ likeid: existingLike.likeid });
        await UPDATE(Products).set({ totalLikes: { '-=': 1 } }).where({ productId });
        return { message: "Like removed" };
    } else {
        await INSERT.into(Likes).entries({ productLike_productId: productId, userLike_phoneNumber: user.phoneNumber });
        await UPDATE(Products).set({ totalLikes: { '+=': 1 } }).where({ productId });
        return { message: "Like added" };
    }
});


    // // ✅ Like a Shop
    // srv.on('likeShop', async (req) => {
    //     const { shopId} = req.data;
    //     const user = await verifyToken(req);  // Validate Token and Fetch User
    //     if (!user) return req.reject(404, 'User not found');
    //     const userExists = await SELECT.one.from('cap.dukanmitra.Users').where({ phoneNumber: user.phoneNumber });
    //     const shopExists = await SELECT.one.from('cap.dukanmitra.Shops').where({ shopId });

    //     if (!userExists || !shopExists) return req.reject(404, 'User or Shop not found');

    //     // Check if already liked
    //     const existingLike = await SELECT.one.from(Likes).where({ shopLike_shopId: shopId, userLike_phoneNumber: user.phoneNumber });
    //     if (existingLike) return req.reject(400, 'Already liked');

    //     await INSERT.into(Likes).entries({ likeid: cds.utils.uuid(), userLike_phoneNumber: user.phoneNumber, shopLike_shopId: shopId });
    //     return true;
    // });

    // // ❌ Dislike a Shop (Remove Like)
    // srv.on('dislikeShop', async (req) => {
    //     const { shopId } = req.data;
    //     const user = await verifyToken(req);  // Validate Token and Fetch User
    //     if (!user) return req.reject(404, 'User not found');
    //     const deleted = await DELETE.from(Likes).where({ shopLike_shopId: shopId, userLike_phoneNumber: user.phoneNumber });

    //     if (deleted === 0) return req.reject(404, 'Like not found');
    //     return true;
    // });

    // ✅ Like a Product
    srv.on('likeProduct', async (req) => {
        const { productId } = req.data;
        const user = await verifyToken(req);  // Validate Token and Fetch User
        if (!user) return req.reject(404, 'User not found');
        const userExists = await SELECT.one.from(Users).where({ phoneNumber: user.phoneNumber });
        const productExists = await SELECT.one.from(Products).where({ productId });

        if (!userExists || !productExists) return req.reject(404, 'User or Product not found');

        // Check if already liked
        const existingLike = await SELECT.one.from(Likes).where({ productLike_productId: productId, userLike_phoneNumber: user.phoneNumber });
        if (existingLike) return req.reject(400, 'Already liked');

        await INSERT.into(Likes).entries({ likeid: cds.utils.uuid(), userLike_phoneNumber: user.phoneNumber, productLike_productId: productId });
        return true;
    });

    // ❌ Dislike a Product (Remove Like)
    srv.on('dislikeProduct', async (req) => {
        const { productId } = req.data;
        const user = await verifyToken(req);  // Validate Token and Fetch User
        if (!user) return req.reject(404, 'User not found');
        const deleted = await DELETE.from(Likes).where({ productLike_productId: productId, userLike_phoneNumber: user.phoneNumber });

        if (deleted === 0) return req.reject(404, 'Like not found');
        return true;
    });


    
// ✅ Get Shops Liked by a User
srv.on('getLikedShops', async (req) => {
    const user = await verifyToken(req);  // Validate Token and Fetch User
    if (!user) return req.reject(404, 'User not found');
    return SELECT.from(Shops).where({ shopId: { in: SELECT('shopLike_shopId').from(Likes).where({ userLike_phoneNumber: user.phoneNumber }) } });
});

// ✅ Get Users Who Liked a Shop
srv.on('getUsersWhoLikedShop', async (req) => {
    const { shopId } = req.data;
    const user = await verifyToken(req);  // Validate Token and Fetch User
    if (!user) return req.reject(404, 'User not found');
    return SELECT.from(Users).where({ phoneNumber: { in: SELECT('userLike_phoneNumber').from(Likes).where({ shopLike_shopId: shopId }) } });
});

// ✅ Get Products Liked by a User
srv.on('getLikedProducts', async (req) => {
    const user = await verifyToken(req);  // Validate Token and Fetch User
    if (!user) return req.reject(404, 'User not found');
    return SELECT.from(Products).where({ productId: { in: SELECT('productLike_productId').from(Likes).where({ userLike_phoneNumber: user.phoneNumber }) } });
});

// ✅ Get Users Who Liked a Product
srv.on('getUsersWhoLikedProduct', async (req) => {
    const { productId } = req.data;
    const user = await verifyToken(req);  // Validate Token and Fetch User
    if (!user) return req.reject(404, 'User not found');
    return SELECT.from(Users).where({ phoneNumber: { in: SELECT('userLike_phoneNumber').from(Likes).where({ productLike_productId: productId }) } });
});



    // ✅ Get total likes for a shop
    srv.on('getShopLikes', async (req) => {
        const { shopId } = req.data;
        const db = cds.transaction(req);
        
        // Count total likes from Likes entity
        const [{ total }] = await db.run(
            SELECT.from('Likes').columns('count(*) as total').where({ shopLike: shopId })
        );
        
        return total;
    });

    // ✅ Get total likes for a product
    srv.on('getProductLikes', async (req) => {
        const { productId } = req.data;
        const db = cds.transaction(req);
        
        // Count total likes from Likes entity
        const [{ total }] = await db.run(
            SELECT.from('Likes').columns('count(*) as total').where({ productLike: productId })
        );
        
        return total;
    });


    //===================================



srv.on("getPlace", async (req) => {
  const { lat, lon } = req.data;
  const apiKey = "AIzaSyATVmIadukqW06P2S6ddjDk-3QYazrlbzo";

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${parseFloat(lat)},${parseFloat(lon)}&key=${apiKey}`
    );
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      return "No address found.";
    }

    // pick the most detailed (non-plus-code) result
    const address =
      data.results.find(
        (r) =>
          r.types.includes("street_address") ||
          r.types.includes("premise") ||
          r.types.includes("route")
      ) ||
      data.results[1] ||
      data.results[0];

    const components = address.address_components;

    const street = components.find((c) => c.types.includes("route"))?.long_name ?? "";
    const neighborhood = components.find((c) => c.types.includes("sublocality"))?.long_name ?? "";
    const village = components.find((c) => c.types.includes("locality"))?.long_name ?? "";
    const district = components.find((c) => c.types.includes("administrative_area_level_2"))?.long_name ?? "";
    const state = components.find((c) => c.types.includes("administrative_area_level_1"))?.long_name ?? "";
    const postal = components.find((c) => c.types.includes("postal_code"))?.long_name ?? "";
    const country = components.find((c) => c.types.includes("country"))?.long_name ?? "";

    const details = { street, neighborhood, village, district, state, postal, country };

    // remove empty values
    const filtered = Object.fromEntries(
      Object.entries(details).filter(([_, v]) => v && v.trim() !== "")
    );

    console.log("Cleaned Address:", filtered);

    // Return first available locality (neighborhood → village → district)
    const bestMatch = neighborhood || village || district || state || country || "";

    // return to CAPM action result
    return bestMatch || "Unknown Location";

  } catch (error) {
    console.error("Error fetching place:", error);
    return "Error while fetching location";
  }
});




  
     

};
