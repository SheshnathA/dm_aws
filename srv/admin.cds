using cap.dukanmitra as dukanmitra  from '../db/schema';

service AdminService @(requires: 'Admin'){
  entity Users as projection on dukanmitra.Users;
  entity Shops as projection on dukanmitra.Shops;
  entity Products as projection on dukanmitra.Products;
  entity Orders as projection on dukanmitra.Orders;
  entity OrderItems as projection on dukanmitra.OrderItems;
  entity Media as projection on dukanmitra.Media;
  entity Category as projection on dukanmitra.Category;
}
service UsersAdminService @(requires: 'Admin'){
  entity Users as projection on dukanmitra.Users;
}
service ShopsAdminService @(requires: 'Admin'){
  entity Shops as projection on dukanmitra.Shops;
}
service ProductsAdminService @(requires: 'Admin'){  

  entity Products as projection on dukanmitra.Products;
}
service OrdersAdminService @(requires: 'Admin'){  

  entity Orders as projection on dukanmitra.Orders;
}
service OrderItemsAdminService @(requires: 'Admin'){  

  entity OrderItems as projection on dukanmitra.OrderItems;
}
service MediaAdminService @(requires: 'Admin'){  

  entity Media as projection on dukanmitra.Media;
}
service CategoryAdminService @(requires: 'Admin'){  

  entity Category as projection on dukanmitra.Category;
}
