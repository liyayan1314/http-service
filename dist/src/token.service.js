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
import { Observable } from 'rxjs';
import { Storage } from "@ionic/storage";
var TokenService = /** @class */ (function () {
    function TokenService(storage) {
        this.storage = storage;
    }
    TokenService.prototype.clearToken = function () {
        var _this = this;
        setTimeout(function () {
            _this.storage.set("access_token", null);
        }, 10);
    };
    TokenService.prototype.getToken = function () {
        return Observable.fromPromise(this.storage.get("access_token"));
    };
    TokenService.prototype.set = function (key, value) {
        var _this = this;
        setTimeout(function () {
            _this.storage.set(key, value);
        }, 10);
    };
    TokenService.prototype.getAuthorizationString = function () {
        return Observable.fromPromise(this.storage.get("access_token"))
            .catch(function (error) {
            return Observable.of(null);
        })
            .map(function (val) {
            if (val && val.length > 0) {
                return "Bearer " + val;
            }
            return null;
        });
    };
    TokenService = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [Storage])
    ], TokenService);
    return TokenService;
}());
export { TokenService };
//# sourceMappingURL=token.service.js.map