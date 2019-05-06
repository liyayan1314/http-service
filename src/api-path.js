/*
 * Created on Fri Jun 08 2018 by Ronnie Ren (zhaosong.ren) from Accenture
 *
 * Copyright (c) 2018 DingXin information & technology limited company.
 */
import { HTTPMethods } from "./http-methods";
var APIPath = /** @class */ (function () {
    function APIPath(param) {
        if (param === void 0) { param = { path: "",
            contentType: "application/json",
            method: HTTPMethods.Post,
            accept: "application/json",
            baseURL: "" }; }
        this.baseURL = "";
        this.path = param.path;
        this.method = param.method;
        this.contentType = param.contentType;
        this.accept = param.accept;
        this.baseURL = param.baseURL;
    }
    Object.defineProperty(APIPath.prototype, "url", {
        get: function () {
            return this.baseURL + this.path;
        },
        enumerable: true,
        configurable: true
    });
    return APIPath;
}());
export { APIPath };
//# sourceMappingURL=api-path.js.map