export interface DataEncoding {
    encode(data: any): any;
}

export class URLDataEncoding implements DataEncoding {
    encode(data: any) {
        return Object.keys(data).map(function (keyName) {
            return encodeURIComponent(keyName) + '=' + encodeURIComponent(data[keyName])
        }).join('&');
    };
}

export class JSONDataEncoding implements DataEncoding {
    encode(data: any) {
        return JSON.stringify(data);
    };
}