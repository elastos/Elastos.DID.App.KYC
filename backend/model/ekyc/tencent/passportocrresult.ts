// {
//     "ID": "xx",
//     "Name": "xxx",
//     "DateOfBirth": "xx",//yyyyMMdd
//     "Sex": "M",
//     "DateOfExpiration": "xx",//yyyyMMdd
//     "IssuingCountry": "CHN",
//     "Nationality": "CHN",
//     "Warn": [],
//     "Image": "",
//     "AdvancedInfo": "{\"IssuingCountry\":{\"Confidence\":\"0.9500\"},\"Name\":{\"Confidence\":\"0.9500\"},\"ID\":{\"Confidence\":\"0.9500\"},\"Nationality\":{\"Confidence\":\"0.9500\"},\"DateOfBirth\":{\"Confidence\":\"0.9500\"},\"Sex\":{\"Confidence\":\"0.9500\"},\"DateOfExpiration\":{\"Confidence\":\"0.9500\"},\"Surname\":{\"Confidence\":\"0.9500\"},\"GivenName\":{\"Confidence\":\"0.9500\"},\"CodeSet\":{\"Confidence\":\"0.9996\"},\"CodeCrc\":{\"Confidence\":\"0.9999\"}}",
//     "CodeSet": "xxx<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
//     "CodeCrc": "xxx<<<<xx",
//     "Surname": "xx",
//     "GivenName": "xx",
//     "RequestId": "xx-x-x-x-xx"
//   }

export type PassportOcrResult = {
    ID: string,
    Name: string,
    DateOfBirth: string,
    Sex: string,
    DateOfExpiration: string,
    IssuingCountry: string,
    Nationality: string,
    Warn: any,
    Image: string,
    AdvancedInfo: string,
    CodeSet: string,
    CodeCrc: string,
    Surname: string,
    GivenName: string,
    RequestId: string
}