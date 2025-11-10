using cap.dukanmitra as dukanmitra  from '../db/schema';


service NoAuthService {
    @readonly entity Shops as projection on dukanmitra.Shops 
    {
    shopId, 
    shopName, 
    shopLocation, 
    shopCity,
    online, 
    category,
    shopType, 
    type,
    isVerified,
    totalLikes,
    likes,
    shopOffer,
    latitude, 
    longitude,
    distance,
    medias,
    products
    } where isVerified =1;
    @readonly entity Category as projection on dukanmitra.Category 
    {
    categoryId,
    categoryName,
    type,
    categoryPicture
    };

        @readonly
    entity GlobalSearchResults {
        key sid         : UUID;
        pid             : String(20);  // "Shop" or "Product"
        type            : String(20);  // "Shop" or "Product"
        name            : String(100); // Shop Name or Product Name
        shopName        : String(100);
        shopCity        : String(255);
        shopLocation    : String(255);
        address         : String(255); // Shop Address (only for shops)
        description     : String(255); // Product Description (only for products)
        mediaUrl        : String(255); // First media URL (if available)
        distance        : String(20);
        online          : String(20);
    }

    
    @readonly
    entity Products as projection on dukanmitra.Products;

    action search(query: String) returns array of GlobalSearchResults;








    entity Likes as projection on dukanmitra.Likes;

    action likeShop(shopId: UUID) returns Boolean;
    action dislikeShop(shopId: UUID) returns Boolean;
    
    action likeProduct(productId: String) returns Boolean;
    action dislikeProduct(productId: String) returns Boolean;

    action getLikedShops() returns array of Shops;
    action getUsersWhoLikedShop(shopId: UUID) returns array of String;

    action getLikedProducts() returns array of Products;
    action getUsersWhoLikedProduct(productId: String) returns array of String;


    action getShopLikes(shopId: UUID) returns Integer;
    action getProductLikes(productId: UUID) returns Integer;
action getPlace(lat : String, lon : String) returns String;

}
