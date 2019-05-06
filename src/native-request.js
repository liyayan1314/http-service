import { URLDataEncoding, JSONDataEncoding } from './data-encoding';
import { ContentType } from './content-type';
import { HTTPMethods } from './http-methods';
import { Observable } from 'rxjs';
var NativeRequest = /** @class */ (function () {
    function NativeRequest(url, parameters, method, header, pathParameters, queryParameters) {
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
    NativeRequest.prototype.validateWithStatusCodes = function (statusCodes) {
        this.acceptStatusCodes = statusCodes;
        return this;
    };
    NativeRequest.prototype.validateWithRangeStatusCode = function (minStatusCode, maxStatusCode) {
        this.acceptStatusRange = [minStatusCode, maxStatusCode];
        return this;
    };
    NativeRequest.prototype.validate = function () {
        return this.validateWithRangeStatusCode(200, 300);
    };
    NativeRequest.prototype.getURL = function () {
        var url = this.url;
        if (this.queryParameters) {
            url += "?" + new URLDataEncoding().encode(this.queryParameters);
        }
        if ([HTTPMethods.Get, HTTPMethods.Delete].indexOf(this.method) >= 0) {
            url = url + (url.endsWith("?") ? "" : "?") + this.getRequestData() + "";
        }
        return url;
    };
    NativeRequest.prototype.fetch = function () {
        var _this = this;
        var url = this.getURL();
        var params = this.parameters;
        // if ([HTTPMethods.Get, HTTPMethods.Delete].indexOf(this.method) < 0) {
        //     params = { body: this.getRequestData() } as RequestInit;
        // }
        var successFunc = function (resolver, response) {
            if (_this.method === "upload" || _this.method === "download") {
                response["status"] = 200;
                response["data"] = JSON.stringify(response);
            }
            resolver(_this.getResponseFromNativeResponse(response));
        };
        var errorFunc = function (rejector, response) {
            if (_this.method === "upload" || _this.method === "download") {
                response["status"] = 400;
                response["data"] = JSON.stringify(response);
            }
            if (response["status"] === 1) {
                response["status"] = 444;
            }
            rejector(_this.getResponseFromNativeResponse(response));
        };
        var serializer = 'json';
        switch (this.method) {
            case HTTPMethods.Get:
            case HTTPMethods.Delete:
            case HTTPMethods.Header:
                serializer = 'urlencoded';
                break;
        }
        if (this.contentType == ContentType.WWW_FORM_URL_ENCODED) {
            serializer = 'urlencoded';
        }
        var options;
        if (!!this.filePath) {
            options = {
                filePath: this.filePath,
                name: this.fileName,
                params: this.parameters,
                headers: this.header,
                method: this.method
            };
        }
        else {
            options = {
                method: this.method,
                data: params,
                serializer: serializer,
                headers: this.header,
                timeout: this.timeout
            };
        }
        var promise = new Promise(function (resolver, rejector) {
            cordova.plugin.http.sendRequest(url, options, function (response) { return successFunc(resolver, response); }, function (response) { return errorFunc(rejector, response); });
        });
        return promise.then(function (res) {
            return new Promise(function (resolve, reject) {
                if (_this.acceptStatusCodes && _this.acceptStatusCodes.indexOf(res.status) > 0 ||
                    _this.acceptStatusRange && _this.acceptStatusRange[0] <= res.status && _this.acceptStatusRange[1] >= res.status) {
                    resolve(res);
                }
                else {
                    reject(res);
                }
            }).catch(function (error) {
                throw error;
            });
        }).catch(function (error) {
            throw error;
        });
    };
    NativeRequest.prototype.getResponseFromNativeResponse = function (response) {
        var headers = new Headers();
        if (response.headers) {
            Object.keys(response.headers)
                .forEach(function (key) { return headers[key] = response.headers[key]; });
        }
        var statusText = response.status + "";
        var status = parseInt(response.status);
        return new Response(response.data, { headers: headers, status: status, statusText: statusText });
    };
    NativeRequest.prototype.getRequestData = function () {
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
    NativeRequest.prototype.fetchWithJSONResponse = function () {
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
    NativeRequest.prototype.fetchWithTextResponse = function () {
        return Observable.fromPromise(this.fetch().then(function (response) {
            return response.text();
        })
            .catch(function (error) {
            throw error;
        }));
    };
    NativeRequest.prototype.fetchWithBlobResponse = function () {
        return Observable.fromPromise(this.fetch().then(function (response) {
            return response.blob();
        }));
    };
    NativeRequest.prototype.fetchWithArrayBufferResponse = function () {
        return Observable.fromPromise(this.fetch().then(function (response) {
            return response.arrayBuffer();
        }));
    };
    NativeRequest.prototype.jsonObservableFromTextResponse = function (keyPath) {
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
    NativeRequest.prototype.jsonObservableFromBlobResponse = function () {
        return this.fetchWithBlobResponse()
            .map(function (text) {
            if (!!text) {
                return Observable.of(text);
            }
            return Observable.of({});
        });
    };
    NativeRequest.prototype.observableFromPromise = function (promise) {
        return Observable.fromPromise(promise).flatMap(function (val) {
            if (val.error) {
                return Observable.throw(val.error ? val.error : "unknowed failure, need to investigate!!!!");
            }
            return Observable.of(val.value);
        });
    };
    NativeRequest.prototype.uploadFile = function (filePath, fileName) {
        this.filePath = filePath;
        this.fileName = fileName;
        this.method = "upload";
        return this;
    };
    NativeRequest.prototype.downloadFile = function (filePath, fileName) {
        this.filePath = filePath;
        this.fileName = fileName;
        this.method = "download";
        return this;
    };
    NativeRequest.prototype._replacePathComponentsWithPathParameters = function (pathParams) {
        var url = this.url;
        if (pathParams) {
            Object.keys(pathParams).forEach(function (key) {
                var prop = new RegExp(":" + key);
                url = url.replace(prop, (pathParams[key] + ""));
            });
        }
        return url;
    };
    return NativeRequest;
}());
export { NativeRequest };
//# sourceMappingURL=native-request.js.map