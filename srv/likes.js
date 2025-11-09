const cds = require('@sap/cds');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.REFRESH_SECRET;
module.exports = cds.service.impl(async (srv) => {
    const { Likes, Users, Shops, Products } = srv.entities;


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
    // ✅ Like a Shop
    srv.on('likeShop', async (req) => {
        const { shopId} = req.data;
        const user = await verifyToken(req);  // Validate Token and Fetch User
        if (!user) return req.reject(404, 'User not found');
        const userExists = await SELECT.one.from(Users).where({ phoneNumber: user.phoneNumber });
        const shopExists = await SELECT.one.from(Shops).where({ shopId });

        if (!userExists || !shopExists) return req.reject(404, 'User or Shop not found');

        // Check if already liked
        const existingLike = await SELECT.one.from(Likes).where({ shopLike_shopId: shopId, userLike_phoneNumber: user.phoneNumber });
        if (existingLike) return req.reject(400, 'Already liked');

        await INSERT.into(Likes).entries({ likeid: cds.utils.uuid(), userLike_phoneNumber: user.phoneNumber, shopLike_shopId: shopId });
        return true;
    });

    // ❌ Dislike a Shop (Remove Like)
    srv.on('dislikeShop', async (req) => {
        const { shopId } = req.data;
        const user = await verifyToken(req);  // Validate Token and Fetch User
        if (!user) return req.reject(404, 'User not found');
        const deleted = await DELETE.from(Likes).where({ shopLike_shopId: shopId, userLike_phoneNumber: user.phoneNumber });

        if (deleted === 0) return req.reject(404, 'Like not found');
        return true;
    });

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



});
