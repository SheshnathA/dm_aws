using UsersAdminService as service from '../srv/admin';

annotate service.Users with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'mobileNumber',
            Value : phoneNumber,
        },
        {
            $Type : 'UI.DataField',
            Label : 'name',
            Value : firstName,
        },
        {
            $Type : 'UI.DataField',
            Label : 'location',
            Value : email,
        },
        {
            $Type : 'UI.DataField',
            Label : 'otp',
            Value : otp,
        },
        {
            $Type : 'UI.DataField',
            Label : '',
            Value : profilePicture,
        },
    ]
);
annotate service.Users with @(
    UI.FieldGroup #GeneratedGroup1 : {
        $Type : 'UI.FieldGroupType',
        Data : [
               {
            $Type : 'UI.DataField',
            Label : 'mobileNumber',
            Value : phoneNumber,
        },
        {
            $Type : 'UI.DataField',
            Label : 'name',
            Value : firstName,
        },
        {
            $Type : 'UI.DataField',
            Label : 'location',
            Value : email,
        },
        {
            $Type : 'UI.DataField',
            Label : 'otp',
            Value : otp,
        },
        {
            $Type : 'UI.DataField',
            Label : 'profilePicture',
            Value : profilePicture,
        },
        {
            $Type : 'UI.DataField',
            Label : 'createdAt',
            Value : createdAt,
        },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup1',
        },
    ]
);