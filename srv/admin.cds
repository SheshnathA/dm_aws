using cap.dukanmitra as dukanmitra  from '../db/schema';


service UsersAdminService @(requires: 'Admin'){
  @odata.draft.enabled
  entity Users as projection on dukanmitra.Users;
}
service ShopsAdminService @(requires: 'Admin'){
  @odata.draft.enabled
  entity Shops as projection on dukanmitra.Shops;
}
service ProductsAdminService @(requires: 'Admin'){  
  @odata.draft.enabled
  entity Products as projection on dukanmitra.Products;
}
service OrdersAdminService @(requires: 'Admin'){  
  @odata.draft.enabled
  entity Orders as projection on dukanmitra.Orders;
}
service OrderItemsAdminService @(requires: 'Admin'){  
  @odata.draft.enabled
  entity OrderItems as projection on dukanmitra.OrderItems;
}
service MediaAdminService @(requires: 'Admin'){  
  @odata.draft.enabled
  entity Media as projection on dukanmitra.Media;
}
service CategoryAdminService @(requires: 'Admin'){  
  @odata.draft.enabled
  entity Category as projection on dukanmitra.Category;
}
