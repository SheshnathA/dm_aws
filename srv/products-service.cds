 using cap.dukanmitra as dukanmitra  from '../db/schema';

@path: '/products-server'
service ProductsServer  {
  // 🔹 Expose Products Entity (Standard CRUD APIs)
    entity Products as projection on dukanmitra.Products;
     action searchSampleProductByName (top:Integer,skip:Integer,query:String) returns array of String;
     action searchSampleProductByBarcode (barcode:String) returns array of String;

    }