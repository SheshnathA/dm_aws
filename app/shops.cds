using ShopsAdminService as service from '../srv/admin';

annotate service.Shops with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'Shop Name',
            Value : shopName,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Category',
            Value : category_categoryId, // Ensure this is the correct reference
        },
        {
            $Type : 'UI.DataField',
            Label : 'Location',
            Value : shopLocation, // Assuming this is the correct field
        },
        {
            $Type : 'UI.DataField',
            Label : 'isVerified',
            Value : isVerified, // Boolean value for verification
        },
        {
            $Type : 'UI.DataField',
            Label : 'OTP',
            Value : shopId,
        }
    ]
);

annotate service.Shops with @(
    UI.FieldGroup #GeneratedGroup1 : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'Shop Name',
                Value : shopName,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Category',
                Value : category_categoryId, // Ensure correct reference
            },
            {
                $Type : 'UI.DataField',
                Label : 'Location',
                Value : shopLocation, // Assuming shopLocation is correct
            },
            {
                $Type : 'UI.DataField',
                Label : 'isVerified',
                Value : isVerified,
            },
            {
                $Type : 'UI.DataField',
                Label : 'OTP',
                Value : shopId,
            }
        ],
    },

    UI.FieldGroup #GeneratedGroup2 : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'Shop Image',
                Value : medias.content, // Should be handled as a binary or URL in frontend
            },
            {
                $Type : 'UI.DataField',
                Label : 'Media ID',
                Value : medias.mediaId, // Correct reference to Media's mediaId
            }
        ],
    },

    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup1',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet2',
            Label : 'Media',
            Target : '@UI.FieldGroup#GeneratedGroup2',
        },
    ]
);
