const cds = require('@sap/cds');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.REFRESH_SECRET;
module.exports = async (srv) => {

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
            let query = req.req.originalUrl.slice(-15);
            if(query=='/profilePicture' && req.event=='READ') {
                const { phoneNumber } = req.data;
                let images =  await cds.tx(req).run(
                    SELECT.from("cap.dukanmitra.Users")
                        .columns("phoneNumber", "profilePicture")
                        .where({ phoneNumber: phoneNumber })
                );
                return images;
            }else if(query=='/profilePicture' && req.event=='UPDATE') {
                const user = await verifyToken(req);  // Validate Token and Fetch User
                if (!user) return req.reject(404, 'User not found');
                return await next(); 
            }
            else if(req.event=='updateUserProfile') {
                const user = await verifyToken(req);  // Validate Token and Fetch User
                if (!user) return req.reject(404, 'User not found');
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

    // Get User Profile API
    srv.on('getUserProfile', async (req) => {
        try {

            const user = await verifyToken(req);  // Validate Token and Fetch User
            if (!user) return req.reject(404, 'User not found');
 
            return {
                phoneNumber: user.phoneNumber,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                profilePicture: user.profilePicture,
                role: user.role,
                isVerified: user.isVerified
            }
        } catch (error) {
            return req.reject(401, 'Invalid or expired token');
        }
    });

    // Update User Profile API
    srv.on('updateUserProfile', async (req) => {
        try {
              const user = await verifyToken(req);  // Validate Token and Fetch User
              if (!user) return req.reject(404, 'User not found');
            const { firstName, lastName, email} = req.data.input;
                await UPDATE('cap.dukanmitra.Users')
                .set({ firstName, lastName, email})
                .where({ phoneNumber: user.phoneNumber });
                const userUpdated = await cds.run(SELECT.one.from('cap.dukanmitra.Users').where({ phoneNumber: user.phoneNumber }));

                return {
                    phoneNumber: userUpdated.phoneNumber,
                    firstName: userUpdated.firstName,
                    lastName: userUpdated.lastName,
                    email: userUpdated.email,
                    profilePicture: userUpdated.profilePicture,
                    role: userUpdated.role,
                    isVerified: userUpdated.isVerified
                }
        } catch (error) {
            return req.reject(401, 'Invalid or expired token');
        }
    });
};
