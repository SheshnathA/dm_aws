using cap.dukanmitra as dukanmitra  from '../db/schema';

service ShopService {
    entity Shops as projection on dukanmitra.Shops;
    entity Users as projection on dukanmitra.Users;
    entity Media as projection on dukanmitra.Media;
    
    action createShop(shop: ShopInput) returns ShopOutput;
    action updateShop(shopId: UUID, shop: ShopInput) returns Boolean;
    action updateShopStatus(shopId: UUID, shop: ShopInputUpdate) returns Boolean;
    function getUserShops() returns array of ShopOutput;
    action deleteShop(shopId: UUID) returns Boolean;
}

type ShopInput {
    shopName    : String(100);
    shopAddress : String(255);
    shopType    : String(50);
    type    : String(50);
    category_categoryId: String(50);
    shopOffer       : String(20);
    shopLocation    : String(255);
    shopCity        : String(255);
    latitude        : String(20);
    longitude       : String(20);
}
type ShopInputUpdate {
 online          : String(20);
}

type ShopOutput {
    shopId          : UUID;
    shopName        : String(100);
    shopAddress     : String(255);
    shopLocation    : String(255);
    shopCity        : String(255);
    shopType        : String(50);
    type            : String(50);
     category_categoryId: String(50);
    shopOffer       : String(20);
    isVerified      : Boolean;
    latitude        : String(20);
    longitude       : String(20);
    online          : String(20);
}
