var URLDataEncoding = /** @class */ (function () {
    function URLDataEncoding() {
    }
    URLDataEncoding.prototype.encode = function (data) {
        return Object.keys(data).map(function (keyName) {
            return encodeURIComponent(keyName) + '=' + encodeURIComponent(data[keyName]);
        }).join('&');
    };
    ;
    return URLDataEncoding;
}());
export { URLDataEncoding };
var JSONDataEncoding = /** @class */ (function () {
    function JSONDataEncoding() {
    }
    JSONDataEncoding.prototype.encode = function (data) {
        return JSON.stringify(data);
    };
    ;
    return JSONDataEncoding;
}());
export { JSONDataEncoding };
//# sourceMappingURL=data-encoding.js.map