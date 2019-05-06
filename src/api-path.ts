/*
 * Created on Fri Jun 08 2018 by Ronnie Ren (zhaosong.ren) from Accenture
 *
 * Copyright (c) 2018 DingXin information & technology limited company.
 */

import { HTTPMethods } from "./http-methods";
import { KeyValuePairs } from "./request";

export class APIPath {
    baseURL: string = "";


    path: string;
    contentType: string;
    accept: string;
    method: HTTPMethods;


    constructor(param: {path: string,
                        contentType?: string,
                        method?: HTTPMethods,
                        accept?: string,
                        baseURL?: string,
                } =
                       {path: "",
                        contentType: "application/json",
                        method: HTTPMethods.Post,
                        accept: "application/json",
                        baseURL: ""}
               ) {
        this.path = param.path;
        this.method = param.method;
        this.contentType = param.contentType;
        this.accept = param.accept;
        this.baseURL = param.baseURL;
    }

    get url(): string {
        return this.baseURL + this.path;
    }
    

}