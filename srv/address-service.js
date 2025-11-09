const cds = require('@sap/cds');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.REFRESH_SECRET; // Store secret in .env
module.exports = async (srv) => {

    const { Address } = srv.entities;


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
            

        srv.before('*', 'Address', async (req) => {
            const user = await verifyToken(req);  // Validate Token and Fetch User
            if (!user) return req.error(404, 'User not found');
        });
    
        srv.on("READ", "Address", async (req) => {
            const user = await verifyToken(req);  // Validate Token and Fetch User
            if (!user) return req.error(404, 'User not found');
            return await cds.tx(req).run(
                SELECT.from("cap.dukanmitra.Address")
                    .where({ addressPhone_phoneNumber: user.phoneNumber })
            );
        });
    
    // 🔹 Create a New Product for a Shop
    srv.before('CREATE', 'Address', async (req) => {
        const user = await verifyToken(req);  // Validate Token and Fetch User
        if (!user) return req.error(404, 'User not found');
        // Check if the shop exists
        req.data.addressId =cds.utils.uuid();
        req.data.addressPhone_phoneNumber =user.phoneNumber;
    });
    srv.before('UPDATE', 'Address', async (req) => {
        const user = await verifyToken(req);  // Validate Token and Fetch User
        if (!user) return req.error(404, 'User not found');
        // Check if the shop exists
        req.data.addressPhone_phoneNumber =user.phoneNumber;
    });
    srv.before('DELETE', 'Address', async (req) => {
        const user = await verifyToken(req);  // Validate Token and Fetch User
        if (!user) return req.error(404, 'User not found');
        let checkAddress =  await cds.tx(req).run(
            SELECT.from("cap.dukanmitra.Address")
                .where({ addressPhone_phoneNumber: user.phoneNumber })
        );
        if (!checkAddress) return req.error(404, 'Address not found');
    });

};
