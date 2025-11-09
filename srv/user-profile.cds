 using cap.dukanmitra as dukanmitra  from '../db/schema';

service UserProfileService {
    @Capabilities : { 
        Readable,
        Updatable,
     }
    entity Users as projection on dukanmitra.Users 
    {
    phoneNumber,
    profilePicture
    };
    function getUserProfile() returns UserProfileOutput;
    action updateUserProfile(input: UserProfileInput) returns Boolean;
    }

    type UserProfileInput {
        firstName: String(50);
        lastName: String(50);
        email: String(100);
        username: String(50);
        profilePicture: String;
        dateOfBirth: Date;
    }

    type UserProfileOutput {
        phoneNumber: String(15);
        firstName: String(50);
        lastName: String(50);
        email: String(100);
        profilePicture: String;
        role: String(20);
        isVerified: Boolean;
    }