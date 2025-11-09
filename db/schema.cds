namespace cap.dukanmitra;
using { managed } from '@sap/cds/common';

entity Users : managed {
    key phoneNumber  : String(10); // Phone number as primary key
    firstName        : String(50);
    lastName         : String(50);
    email            : String(100) @mandatory @assert.unique;
    passwordHash     : String(255);
    username         : String(50) @assert.unique;
    profilePicture   : LargeBinary @Core.MediaType: 'image/png';
    isVerified       : Boolean default false;
    dateOfBirth      : Date;
    role             : String(20) enum { user; admin; };
    lastLogin        : Timestamp;
    refreshToken     : String(255);  // Stores refresh token securely
    otp              : String(6);  // Stores temporary OTP for password reset
    otpExpiry        : Timestamp;  // Expiry time for OTP
    mediaLimit       : Integer default 10;
    likes            : Composition of many Likes on likes.userLike = $self; // Composition: Media are deleted when a Shops is deleted
    userAddress      : Composition of many Address on userAddress.addressPhone = $self;// Composition: Shops are deleted when a User is deleted
    shops            : Composition of many Shops on shops.ownerPhone = $self;// Composition: Shops are deleted when a User is deleted
    medias           : Composition of many Media on medias.ownerMedia = $self; // Composition: Shops and Media are deleted when a User is deleted
    products         : Composition of many Products on products.userProducts = $self; // Composition: products are deleted when a Shops is deleted
    orders          : Composition of many Orders on orders.user = $self; // Composition: oeders are deleted when a user is deleted
}

entity Address : managed {
    key addressId      : UUID;
    addressPhone       : Association to Users; // Link shop to user
    completeAddress    : String(255);
    locality           : String(100);
    latitude           : String(20);
    longitude          : String(20);
}
entity Shops : managed {
    key shopId      : UUID;
    ownerPhone      : Association to Users; // Link shop to user
    shopName        : String(100);
    shopAddress     : String(255);
    shopLocation    : String(255);
    shopCity        : String(255);
    shopType        : String(50);
    type            : String(50);
    shopOffer       : String(20);
    isVerified      : Boolean default false;
    rating          : String(3);
    online          : String(20);
    latitude        : String(20);
    longitude       : String(20);
    distance        : String(10);
    category        : Association to Category;// One Shop -> One Category
    likes           : Composition of many Likes on likes.shopLike = $self; // Composition: Media are deleted when a Shops is deleted
    totalLikes      : Integer default 0; // New field for total likes count
    medias          : Composition of many Media on medias.shopMedia = $self; // Composition: Media are deleted when a Shops is deleted
    products        : Composition of many Products on products.shopProducts = $self; // Composition: products are deleted when a shop is deleted
} 

entity Products : managed {
    key productId  : String(20); // Phone number + ID as primary key
    category       : Association to Category;  // Product belongs to Category
    userProducts   : Association to Users;  // Product belongs to Category
    shopProducts   : Association to Shops;     // Product belongs to Shop
    productName    : String(100);
    description    : String(255);
    mrp            : Decimal(10,2);
    stockQuantity  : Integer;
    sellPrice      : Decimal(10,2);
    isVerified     : Boolean default false;
    online         : String(20);
    unit           : String(20);
    color          : String(20);
    rating         : String(3);
    minQtyToBuy    : Integer;
    totalLikes      : Integer default 0; // New field for total likes count
    likes           : Composition of many Likes on likes.productLike = $self; // Composition: Media are deleted when a Shops is deleted

    // Product has multiple media (e.g., images)
   // @odata.contained // Get all products for a specific shop GET /odata/v4/ShopService/Shops(ShopID)/products or Create a product for a shop POST /odata/v4/ShopService/Shops(ShopID)/products
    medias         : Composition of many Media on medias.productMedia = $self;
}

entity Likes : managed {
    key likeid : UUID;
    userLike   : Association to Users;
    shopLike   : Association to Shops;
    productLike   : Association to Products;
}

entity Category : managed {
    key categoryId : Integer;
    categoryName   : String(100);
    description    : String(255);
    type           : String(50);
    categoryPicture   : LargeBinary @Core.MediaType: 'image/png';
}

entity Orders : managed {
    key orderId      : String(20); // Phone number + ID as primary key
    user             : Association to Users;
    shop             : Association to Shops;
    totalAmount      : Decimal(10,2);
    paymentMethod    : String(50);
    shippingAddress  : String(255);
    latitude        : String(20);
    longitude       : String(20);
    status          : String(20) enum { Pending; Processing; Shipped; Delivered; Canceled; InProgress;};
    orderItems       : Composition of many OrderItems on orderItems.order = $self;
}

entity OrderItems : managed {
    key itemId      : String(20); // Phone number + ID as primary key
    order           : Association to Orders;
    product         : Association to Products;
    quantity       : Integer;
} 

entity Media : managed {

   key mediaId     : String(25); // Phone number + ID as primary key
   ownerMedia      : Association to Users; // Link Media to user
   shopMedia      : Association to Shops; // Link Media to shop
   productMedia    : Association to Products;// Link Media to products
   categoryMedia   : Association to Category;// Link Media to Category
   isVerified       : Boolean default false;
   mediaCategory : String(50);
   @Core.MediaType : mediaType
   content         : LargeBinary ;
   @Core.IsMediaType: true
   mediaType       : String;
   fileName        : String;
   applicationName :String;
   url :String;
}


entity Books {
 key id : Integer;
image1 : LargeBinary @Core.MediaType: 'image/png';
}

entity OTPs {
    key ID       : UUID;
    phone        : String(15);
    otp          : String(6);
    expiry       : Timestamp;
    createdAt    : Timestamp;
}
