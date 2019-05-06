var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from "@angular/core";
import { Request } from "./request";
import { HTTPMethods } from "./http-methods";
import { Observable, Subject } from 'rxjs';
import { NativeRequest } from './native-request';
import { TokenService } from "./token.service";
var gHttpService = null; // we hope http service should be singleton instance
var HttpService = /** @class */ (function () {
    function HttpService(tokenService) {
        if (gHttpService) {
            return gHttpService;
        }
        gHttpService = this;
        this.secureTokenService = tokenService;
        this.onError = new Subject();
    }
    Object.defineProperty(HttpService.prototype, "tokenService", {
        get: function () {
            return this.secureTokenService;
        },
        set: function (tokenService) {
            this.secureTokenService = tokenService;
        },
        enumerable: true,
        configurable: true
    });
    HttpService.prototype.url = function (url, parameters, pathParameters, queryParameters) {
        if (parameters === void 0) { parameters = null; }
        if (pathParameters === void 0) { pathParameters = null; }
        if (queryParameters === void 0) { queryParameters = null; }
        var req = new Request(url, parameters, HTTPMethods.Get, null, pathParameters, queryParameters);
        return req.getURL();
    };
    HttpService.prototype.get = function (url, parameters, keyPath, headers, pathParameters, queryParameters) {
        if (parameters === void 0) { parameters = {}; }
        if (keyPath === void 0) { keyPath = null; }
        if (headers === void 0) { headers = null; }
        if (pathParameters === void 0) { pathParameters = null; }
        if (queryParameters === void 0) { queryParameters = null; }
        return this.fetch(url, parameters, HTTPMethods.Get, keyPath, headers, pathParameters, queryParameters);
    };
    HttpService.prototype.post = function (url, parameters, keyPath, headers, pathParameters, queryParameters) {
        if (parameters === void 0) { parameters = {}; }
        if (keyPath === void 0) { keyPath = null; }
        if (headers === void 0) { headers = null; }
        if (pathParameters === void 0) { pathParameters = null; }
        if (queryParameters === void 0) { queryParameters = null; }
        return this.fetch(url, parameters, HTTPMethods.Post, keyPath, headers, pathParameters, queryParameters);
    };
    HttpService.prototype.put = function (url, parameters, keyPath, headers, pathParameters, queryParameters) {
        if (parameters === void 0) { parameters = {}; }
        if (keyPath === void 0) { keyPath = null; }
        if (headers === void 0) { headers = null; }
        if (pathParameters === void 0) { pathParameters = null; }
        if (queryParameters === void 0) { queryParameters = null; }
        return this.fetch(url, parameters, HTTPMethods.Put, keyPath, headers, pathParameters, queryParameters);
    };
    HttpService.prototype.delete = function (url, parameters, keyPath, headers, pathParameters, queryParameters) {
        if (parameters === void 0) { parameters = {}; }
        if (keyPath === void 0) { keyPath = null; }
        if (headers === void 0) { headers = null; }
        if (pathParameters === void 0) { pathParameters = null; }
        if (queryParameters === void 0) { queryParameters = null; }
        return this.fetch(url, parameters, HTTPMethods.Delete, keyPath, headers, pathParameters, queryParameters);
    };
    HttpService.prototype.header = function (url, parameters, keyPath, headers, pathParameters, queryParameters) {
        if (parameters === void 0) { parameters = {}; }
        if (keyPath === void 0) { keyPath = null; }
        if (headers === void 0) { headers = null; }
        if (pathParameters === void 0) { pathParameters = null; }
        if (queryParameters === void 0) { queryParameters = null; }
        return this.fetch(url, parameters, HTTPMethods.Header, keyPath, headers, pathParameters, queryParameters);
    };
    HttpService.prototype.fetchWithPath = function (apiPath, parameters, keyPath, headers, pathParameters, queryParameters) {
        if (parameters === void 0) { parameters = {}; }
        if (keyPath === void 0) { keyPath = null; }
        if (headers === void 0) { headers = null; }
        if (pathParameters === void 0) { pathParameters = null; }
        if (queryParameters === void 0) { queryParameters = null; }
        return this.fetch(apiPath.url, parameters, apiPath.method, keyPath, headers, pathParameters, queryParameters);
    };
    HttpService.prototype.fetch = function (url, parameters, method, keyPath, headers, pathParameters, queryParameters) {
        var _this = this;
        if (parameters === void 0) { parameters = {}; }
        if (keyPath === void 0) { keyPath = null; }
        if (headers === void 0) { headers = null; }
        if (pathParameters === void 0) { pathParameters = null; }
        if (queryParameters === void 0) { queryParameters = null; }
        return this.tokenService.getAuthorizationString().flatMap(function (token) {
            var newHeaders = headers || {};
            if (token && token.length > 0 && !newHeaders["Authorization"]) {
                newHeaders["Authorization"] = token;
                if (!newHeaders["Content-Type"]) {
                    newHeaders["Content-Type"] = 'application/json';
                }
                var reg = new RegExp("/rsaPublicKey");
                if (reg.test(url)) {
                    newHeaders["Authorization"] = "";
                }
            }
            else {
                var reg = new RegExp("oauth/token");
                if (reg.test(url)) {
                    newHeaders["Authorization"] = "Basic YXBwOmFwcA==";
                }
                else {
                    newHeaders["Authorization"] = "";
                }
            }
            return _this.doFetch(url, parameters, method, keyPath, newHeaders, pathParameters, queryParameters);
        });
    };
    HttpService.prototype.uploadFile = function (apiPath, file, fileName, parameters, headers, pathParameters, queryParameters) {
        var _this = this;
        if (parameters === void 0) { parameters = {}; }
        if (headers === void 0) { headers = null; }
        if (pathParameters === void 0) { pathParameters = null; }
        if (queryParameters === void 0) { queryParameters = null; }
        return this.tokenService.getAuthorizationString().flatMap(function (token) {
            var newHeaders = headers || {};
            if (token && token.length > 0) {
                newHeaders["Authorization"] = token;
                if (!newHeaders["Content-Type"]) {
                    newHeaders["Content-Type"] = 'application/json';
                }
            }
            else {
                newHeaders["Authorization"] = "Basic YXBwOmFwcA==";
            }
            var ob;
            if (window.cordova) {
                ob = (new NativeRequest(apiPath.url, parameters, apiPath.method, newHeaders, pathParameters, queryParameters))
                    .uploadFile(file, fileName)
                    .jsonObservableFromTextResponse();
            }
            else {
                ob = new Request(apiPath.url, parameters, apiPath.method, newHeaders, pathParameters, queryParameters)
                    .uploadFile(file, fileName)
                    .jsonObservableFromTextResponse();
            }
            return _this.wrapperRequestObservableWithTokenClear(ob);
        });
    };
    HttpService.prototype.downloadFile = function (apiPath, file, fileName, parameters, headers, pathParameters, queryParameters) {
        var _this = this;
        if (parameters === void 0) { parameters = {}; }
        if (headers === void 0) { headers = null; }
        if (pathParameters === void 0) { pathParameters = null; }
        if (queryParameters === void 0) { queryParameters = null; }
        return this.tokenService.getAuthorizationString().flatMap(function (token) {
            var newHeaders = headers || {};
            if (token && token.length > 0) {
                newHeaders["Authorization"] = token;
                if (!newHeaders["Content-Type"]) {
                    newHeaders["Content-Type"] = 'application/json';
                }
            }
            else {
                newHeaders["Authorization"] = "Basic YXBwOmFwcA==";
            }
            var ob;
            if (window.cordova) {
                ob = (new NativeRequest(apiPath.url, parameters, apiPath.method, newHeaders, pathParameters, queryParameters))
                    .downloadFile(file, fileName)
                    .jsonObservableFromTextResponse();
            }
            else {
                ob = new Request(apiPath.url, parameters, apiPath.method, newHeaders, pathParameters, queryParameters)
                    .uploadFile(file, fileName)
                    .jsonObservableFromTextResponse();
            }
            return _this.wrapperRequestObservableWithTokenClear(ob);
        });
    };
    HttpService.prototype.doFetch = function (url, parameters, method, keyPath, headers, pathParameters, queryParameters) {
        if (parameters === void 0) { parameters = {}; }
        if (keyPath === void 0) { keyPath = null; }
        if (headers === void 0) { headers = null; }
        if (pathParameters === void 0) { pathParameters = null; }
        if (queryParameters === void 0) { queryParameters = null; }
        var ob;
        if (window.cordova) {
            if (headers["content-Type"] === "application/octet-stream") {
                ob = (new NativeRequest(url, parameters, method, headers, pathParameters, queryParameters))
                    .jsonObservableFromBlobResponse();
            }
            else {
                ob = (new NativeRequest(url, parameters, method, headers, pathParameters, queryParameters))
                    .jsonObservableFromTextResponse(keyPath);
            }
        }
        else {
            var req = new Request(url, parameters, method, headers, pathParameters, queryParameters);
            ob = req.jsonObservableFromTextResponse(keyPath);
        }
        return this.wrapperRequestObservableWithTokenClear(ob);
    };
    HttpService.prototype.wrapperRequestObservableWithTokenClear = function (ob) {
        var _this = this;
        return ob.do(function (val) {
        }, function (error) {
            if (error && error.status === 401) {
                _this.tokenService.clearToken();
            }
            _this.onError.next(error);
        })
            .catch(function (error) {
            return Observable.throw(error);
        });
    };
    HttpService = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [TokenService])
    ], HttpService);
    return HttpService;
}());
export { HttpService };
//# sourceMappingURL=http.service.js.map