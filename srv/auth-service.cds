using cap.dukanmitra as dukanmitra  from '../db/schema';


service AuthService {
    action register(phoneNumber: String, firstName: String, lastName: String, email: String, password: String, username: String) returns String;
    action login(phoneNumber: String, password: String) returns String;
    action refreshToken(refreshToken: String) returns String;
    action requestPasswordReset(phoneNumber: String) returns String;
    action resetPassword(phoneNumber: String, otp: String, newPassword: String) returns String;
    action verifiedUser(phoneNumber: String, otp: String) returns String;
    action verifiedRegistration(phoneNumber: String) returns String;
    action getUserInfo() returns String;
}
