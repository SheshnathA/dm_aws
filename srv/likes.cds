 using cap.dukanmitra as dukanmitra  from '../db/schema';

service LikeService {
    @readonly
    entity Shops as projection on dukanmitra.Shops;
    @readonly
    entity Users as projection on dukanmitra.Users;
    @readonly
    entity Products as projection on dukanmitra.Products;
    
    entity Likes as projection on dukanmitra.Likes;

    action likeShop(shopId: UUID) returns Boolean;
    action dislikeShop(shopId: UUID) returns Boolean;
    
    action likeProduct(productId: String) returns Boolean;
    action dislikeProduct(productId: String) returns Boolean;

    action getLikedShops() returns array of Shops;
    action getUsersWhoLikedShop(shopId: UUID) returns array of Users;

    action getLikedProducts() returns array of Products;
    action getUsersWhoLikedProduct(productId: String) returns array of Users;


    action getShopLikes(shopId: UUID) returns Integer;
    action getProductLikes(productId: UUID) returns Integer;
}
