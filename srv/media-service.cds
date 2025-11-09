 using cap.dukanmitra as dukanmitra  from '../db/schema';

@path: '/media-server'
service MediaServer  {
    entity Media   as projection on dukanmitra.Media ;
    entity Users   as projection on dukanmitra.Users ;
}
