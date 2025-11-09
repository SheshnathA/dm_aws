const cds = require('@sap/cds');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.REFRESH_SECRET; // Store secret in .env

module.exports = srv => {
  const {Users,Shops,Media} = srv.entities;

  // Middleware to Validate JWT Token
  async function verifyToken(req) {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) return req.error(401, 'Unauthorized: No token provided');
    
            try {
                const decoded = jwt.verify(token, SECRET_KEY);
                const user = await cds.run(SELECT.one.from('cap.dukanmitra.Users').where({ phoneNumber: decoded.phoneNumber }));
    
                if (!user) {
                  return req.error(404, 'User not found');
                }else{
                  return user;  // Return user data for further processing
                }
  
            } catch (error) {
                return req.error(401, 'Invalid or expired token');
            }
    } 

    srv.on('*', '*', async (req, next) => {
      try {
        if(req.event=='READ') {
          let media = await next();
          return media;
      }else{
        const user = await verifyToken(req);  // Validate Token and Fetch User
        if (!user) return req.reject(404, 'User not found');
              return await next();
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


  srv.before('CREATE', 'Media', async (req) => {
    try{
      const user = await verifyToken(req);  // Validate Token and Fetch User
      if (!user) return req.reject(404, 'User not found');
   if(req.data.mediaCategory ==="ShopBanner"){
      const shop = await cds.run(SELECT.one.from('cap.dukanmitra.Shops').where({ shopId: req.data.shopMedia_shopId }));
      if (!shop) return req.error(404, 'Shop not found');
      const mediaId =  "BAN_"+Math.random().toString(36).substr(2, 16);
      req.data.mediaId = mediaId;
      req.data.ownerMedia_phoneNumber = user.phoneNumber;
      req.data.shopMedia_shopId = shop.shopId;
      req.data.url = "/media-server/Media('"+mediaId+"')/content";
    }
    else if(req.data.mediaCategory ==="ProductImage"){
      const shop = await cds.run(SELECT.one.from('cap.dukanmitra.Shops').where({ shopId: req.data.shopMedia_shopId }));
      if (!shop) return req.error(404, 'Shop not found');
      const product = await cds.run(SELECT.one.from('cap.dukanmitra.Products').where({ productId: req.data.productMedia_productId }));
      if (!product) return req.error(404, 'Product not found');
      const mediaId =  "PROD_"+Math.random().toString(36).substr(2, 16);
      req.data.mediaId = mediaId;
      req.data.ownerMedia_phoneNumber = user.phoneNumber;
      req.data.shopMedia_shopId = shop.shopId;
      req.data.productMedia_productId = product.productId;
      req.data.url = "/media-server/Media('"+mediaId+"')/content";
    }else{
      return req.error(404, 'Incorrect Media Category');
    }
  } catch (error) {

     return {
         status: error.status || 500,
         error: error.name || "Internal Server Error",
         message: error.message || "An unexpected error occurred",
     };
 }
  })

    srv.before('DELETE', 'Media', async(req, next) => {
    const user = await verifyToken(req);  // Validate Token and Fetch User
    if (!user) return req.reject(404, 'User not found');
    const media = await SELECT.one.from(Media).where({ mediaId: req.data.mediaId,ownerMedia_phoneNumber:user.phoneNumber });
    if (!media) return req.error(404, `Image not found`);
    return media;

  })


}
