 using cap.dukanmitra as dukanmitra  from '../db/schema';

service AddressService {
    entity Address as projection on dukanmitra.Address;
}