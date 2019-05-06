var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
import { URLDataEncoding, JSONDataEncoding } from './data-encoding';
import { ContentType } from './content-type';
import { HTTPMethods } from './http-methods';
import { Observable } from 'rxjs';
var Request = /** @class */ (function () {
    function Request(url, parameters, method, header, pathParameters, queryParameters) {
        if (parameters === void 0) { parameters = {}; }
        if (method === void 0) { method = HTTPMethods.Get; }
        if (header === void 0) { header = {}; }
        if (pathParameters === void 0) { pathParameters = null; }
        if (queryParameters === void 0) { queryParameters = null; }
        this.timeout = 2 * 60;
        this.url = url;
        this.parameters = parameters || {};
        this.queryParameters = queryParameters;
        this.method = method;
        this.header = {};
        if (header["timeout"]) {
            this.timeout = header["timeout"];
            delete header["timeout"];
        }
        this.acceptStatusCodes = [];
        this.acceptStatusRange = [200, 300];
        this.url = this._replacePathComponentsWithPathParameters(pathParameters);
        var newHeaders = header || {};
        var isMultiPartFormData = this.parameters instanceof FormData;
        for (var _i = 0, _a = Object.keys(newHeaders); _i < _a.length; _i++) {
            var key = _a[_i];
            if (key.toLowerCase() === "content-type") {
                var ct = newHeaders[key].toLowerCase() || "";
                if (isMultiPartFormData) {
                    // don't set Content-Type for multipart/formdata.
                    this.contentType = ContentType.MUTLFORMDATA;
                    break;
                }
                else if (ct === ContentType.WWW_FORM_URL_ENCODED) {
                    this.contentType = ct;
                }
                else {
                    this.contentType = ContentType.JSON;
                    // let rgEx = new RegExp("^application/*json");
                    // if (rgEx.exec(ct)) {
                    //     this.contentType = ContentType.JSON;
                    // }
                }
            }
            this.header[key] = newHeaders[key];
        }
    }
    Request.prototype.validateWithStatusCodes = function (statusCodes) {
        this.acceptStatusCodes = statusCodes;
        return this;
    };
    Request.prototype.validateWithRangeStatusCode = function (minStatusCode, maxStatusCode) {
        this.acceptStatusRange = [minStatusCode, maxStatusCode];
        return this;
    };
    Request.prototype.validate = function () {
        return this.validateWithRangeStatusCode(200, 300);
    };
    Request.prototype.getURL = function () {
        var url = this.url;
        if (this.queryParameters) {
            url += "?" + new URLDataEncoding().encode(this.queryParameters);
        }
        if ([HTTPMethods.Get, HTTPMethods.Delete].indexOf(this.method) >= 0) {
            url = url + (url.endsWith("?") ? "" : "?") + this.getRequestData() + "";
        }
        return url;
    };
    Request.prototype.fetch = function () {
        var _this = this;
        var url = this.getURL();
        var params = { method: this.method, headers: this.header };
        if ([HTTPMethods.Get, HTTPMethods.Delete].indexOf(this.method) < 0) {
            params = __assign({}, params, { body: this.getRequestData() });
        }
        return fetch(url, params).then(function (res) {
            return new Promise(function (resolve, reject) {
                if (_this.acceptStatusCodes && _this.acceptStatusCodes.indexOf(res.status) > 0 ||
                    _this.acceptStatusRange && _this.acceptStatusRange[0] <= res.status && _this.acceptStatusRange[1] >= res.status) {
                    resolve(res);
                }
                else {
                    reject(res);
                }
            });
        });
    };
    Request.prototype.getRequestData = function () {
        if ([HTTPMethods.Get, HTTPMethods.Delete].indexOf(this.method) >= 0 || this.contentType === ContentType.WWW_FORM_URL_ENCODED) {
            return new URLDataEncoding().encode(this.parameters);
        }
        else if (this.parameters instanceof FormData) {
            // form data
            return this.parameters;
        }
        else if (this.contentType === ContentType.JSON) {
            return new JSONDataEncoding().encode(this.parameters);
        }
        else {
            return new JSONDataEncoding().encode(this.parameters);
        }
    };
    Request.prototype.fetchWithJSONResponse = function () {
        return Observable.fromPromise(this.fetch().then(function (response) {
            return response.json();
        }))
            .map(function (json) {
            if (!!json) {
                return { value: json };
            }
            return { value: {} };
        });
    };
    Request.prototype.fetchWithTextResponse = function () {
        return Observable.fromPromise(this.fetch().then(function (response) {
            return response.text();
        }));
    };
    Request.prototype.fetchWithBlobResponse = function () {
        return Observable.fromPromise(this.fetch().then(function (response) {
            return response.blob();
        }));
    };
    Request.prototype.fetchWithArrayBufferResponse = function () {
        return Observable.fromPromise(this.fetch().then(function (response) {
            return response.arrayBuffer();
        }));
    };
    Request.prototype.jsonObservableFromTextResponse = function (keyPath) {
        if (keyPath === void 0) { keyPath = ""; }
        return this.fetchWithTextResponse()
            .map(function (text) {
            if (!!text) {
                try {
                    text = JSON.parse(text);
                }
                catch (e) {
                }
                return { value: text };
            }
            return { value: {} };
        })
            .flatMap(function (val) {
            if (val && val.value) {
                var newOb = Observable.of(val.value);
                if (keyPath && keyPath.length > 0) {
                    return newOb.pluck.apply(newOb, keyPath.split("."));
                }
                return newOb;
            }
            return Observable.throw(val.error ? val.error : "unknowed failure, need to investigate!!!!");
        });
    };
    Request.prototype.observableFromPromise = function (promise) {
        return Observable.fromPromise(promise).flatMap(function (val) {
            if (val.error) {
                return Observable.throw(val.error ? val.error : "unknowed failure, need to investigate!!!!");
            }
            return Observable.of(val.value);
        });
    };
    Request.prototype.uploadFile = function (filePath, fileName) {
        var form;
        if (this.parameters instanceof FormData) {
            form = this.parameters;
        }
        else {
            form = new FormData();
            if (this.parameters) {
                for (var _i = 0, _a = Object.keys(this.parameters); _i < _a.length; _i++) {
                    var key = _a[_i];
                    form.append(key, this.parameters[key]);
                }
            }
        }
        form.append(fileName, filePath, fileName);
        this.contentType = ContentType.MUTLFORMDATA;
        return this;
    };
    Request.prototype._replacePathComponentsWithPathParameters = function (pathParams) {
        var url = this.url;
        if (pathParams) {
            Object.keys(pathParams).forEach(function (key) {
                var prop = new RegExp(":" + key);
                url = url.replace(prop, (pathParams[key] + ""));
            });
        }
        return url;
    };
    return Request;
}());
export { Request };
//# sourceMappingURL=request.js.map