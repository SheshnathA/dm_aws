 using cap.dukanmitra as dukanmitra  from '../db/schema';

service OrderService {

    entity Orders as projection on dukanmitra.Orders;
    entity Users as projection on dukanmitra.Users;
    entity Shops as projection on dukanmitra.Shops;
    entity OrderItems as projection on dukanmitra.OrderItems;
   

    // Cancel an order
    action cancelOrder(orderId: String) returns String;

    // Update the status of an order
    action updateOrderStatus(orderId: String, status: String) returns String;
    

//update qty

action updateOrderItemQuantity(orderId: String, itemId: String, newQuantity: Integer) returns String;
action deleteOrderItem(orderId: String, itemId: String) returns Boolean;

    //  action getOrdersByShopId(shopId: UUID) returns array of shopOrders;


    // type shopOrders{
    // orderId          : String(20);
    // totalAmount      : Decimal(10,2);
    // paymentMethod    : String(50);
    // shippingAddress  : String(255);
    // status           : String(20);
    // userName         : String(100);
    // userPhone        : String(10);
    // distance         : String(5);
    // date             : DateTime;
    // }
    

}


