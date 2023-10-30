// {
//     "Name": "xx",
//     "Sex": "男",
//     "Nation": "汉",
//     "Birth": "19xx/x/xx",
//     "Address": "北京市xx",
//     "IdNum": "xx",
//     "Authority": "",
//     "ValidDate": "",
//     "AdvancedInfo": "{}",
//     "RequestId": "xx-xx-xx-xx-xx"
// }
export type IDCardOCROriginResult = {
    Name: string;
    Sex: string;
    Nation: string;
    Birth: string;
    Address: string;
    IdNum: string;
    Authority: string;
    ValidDate: string;
    AdvancedInfo: string;
    RequestId: string;
}

export type IDCardOCRResult = {
    Name: string;
    Sex: string;
    Nation: string;
    Birth: string;
    Address: string;
    IdNum: string;
    Authority: string;
    ValidDate: string;
    AdvancedInfo: AdvancedInfo;
    RequestId: string;
}

type AdvancedInfo = {
    Portrait: string,
    Quality: number
}
