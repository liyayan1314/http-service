import { Injectable } from "@angular/core";
import { Request, KeyValuePairs, KeyStringValuePairs } from "./request";
import { HTTPMethods } from "./http-methods";
import { Observable, Subject } from 'rxjs';
import { NativeRequest } from './native-request';
import { TokenService, TokenServiceInerface } from "./token.service";
import { APIPath } from "./api-path";


declare var window: {cordova: object};
let gHttpService: HttpService = null; // we hope http service should be singleton instance


@Injectable()
export class HttpService {

    onError: Subject<any>;
    
    private secureTokenService: TokenServiceInerface;
    
    constructor(tokenService: TokenService) {
      if(gHttpService) {
        return gHttpService;
      }
      gHttpService = this;
      this.secureTokenService = tokenService;
      this.onError = new Subject();
    }

    get tokenService(): TokenServiceInerface {
      return this.secureTokenService;
    }


    set tokenService(tokenService: TokenServiceInerface) {
      this.secureTokenService = tokenService;
    }

    url(url: string, parameters: KeyValuePairs = null, pathParameters: KeyValuePairs = null, queryParameters: KeyValuePairs = null): string {
        let req = new Request(url, parameters, HTTPMethods.Get, null, pathParameters, queryParameters);
        return req.getURL() as string;
    }

    get(url: string, parameters: KeyValuePairs = {}, keyPath: string = null,  headers: KeyStringValuePairs = null, pathParameters: KeyValuePairs = null, queryParameters: KeyValuePairs = null) {
        return this.fetch(url,parameters,HTTPMethods.Get, keyPath, headers, pathParameters, queryParameters);
    }

    post(url: string, parameters: KeyValuePairs| Object = {}, keyPath: string = null,  headers: KeyStringValuePairs = null, pathParameters: KeyValuePairs = null, queryParameters: KeyValuePairs = null) {
        return this.fetch(url,parameters, HTTPMethods.Post, keyPath, headers, pathParameters, queryParameters);
    }

    put(url: string, parameters: KeyValuePairs | Object = {}, keyPath: string = null,  headers: KeyStringValuePairs = null, pathParameters: KeyValuePairs = null, queryParameters: KeyValuePairs = null) {
        return this.fetch(url,parameters, HTTPMethods.Put, keyPath, headers, pathParameters, queryParameters);
    }

    delete(url: string, parameters: KeyValuePairs = {}, keyPath: string = null,  headers: KeyStringValuePairs = null, pathParameters: KeyValuePairs = null, queryParameters: KeyValuePairs = null) {
        return this.fetch(url,parameters,HTTPMethods.Delete, keyPath, headers, pathParameters, queryParameters);
    }

    header(url: string, parameters: KeyValuePairs = {}, keyPath: string = null,  headers: KeyStringValuePairs = null, pathParameters: KeyValuePairs = null, queryParameters: KeyValuePairs = null) {
        return this.fetch(url,parameters,HTTPMethods.Header, keyPath, headers, pathParameters, queryParameters);
    }

    fetchWithPath(apiPath: APIPath,
        parameters: KeyValuePairs | Object = {},
        keyPath: string = null,
        headers: KeyStringValuePairs = null,
        pathParameters: KeyValuePairs = null,
        queryParameters: KeyValuePairs = null) {
        return this.fetch(apiPath.url, parameters, apiPath.method, keyPath, headers, pathParameters, queryParameters);
    }

    fetch(url: string,
         parameters: KeyValuePairs | Object = {},
         method: HTTPMethods, 
         keyPath: string = null,
         headers: KeyStringValuePairs = null,
         pathParameters: KeyValuePairs = null,
         queryParameters: KeyValuePairs = null) {

        return this.tokenService.getAuthorizationString().flatMap((token: string) => {
            let newHeaders = headers || {};
            if (token && token.length > 0 && !newHeaders["Authorization"]) {
                newHeaders["Authorization"] = token;
                if(!newHeaders["Content-Type"]) {
                  newHeaders["Content-Type"] = 'application/json';
              }
                let reg = new RegExp("/rsaPublicKey");
                if(reg.test(url)) {
                    newHeaders["Authorization"] = "";
                }
            }
            else {
                let reg = new RegExp("oauth/token");
                if(reg.test(url)) {
                    newHeaders["Authorization"] = "Basic YXBwOmFwcA==";
                } else {
                    newHeaders["Authorization"] = "";
                }
            }
            return this.doFetch(url, parameters, method, keyPath, newHeaders, pathParameters, queryParameters);
        })

    }

    uploadFile(
      apiPath: APIPath, 
      file: string | File,
      fileName: string,
      parameters: KeyValuePairs = {}, 
      headers: KeyStringValuePairs = null, 
      pathParameters: KeyValuePairs = null, 
      queryParameters: KeyValuePairs = null) {

        return this.tokenService.getAuthorizationString().flatMap((token: string) => {
          let newHeaders = headers || {};
          if (token && token.length > 0) {
              newHeaders["Authorization"] = token;
              if(!newHeaders["Content-Type"]) {
                newHeaders["Content-Type"] = 'application/json';
            }
          }
          else {
              newHeaders["Authorization"] = "Basic YXBwOmFwcA==";
          }
          
          let ob: Observable<any>;
          if (window.cordova) {
            ob = (new NativeRequest(apiPath.url, parameters, apiPath.method, newHeaders, pathParameters, queryParameters))
            .uploadFile(file as string, fileName)
            .jsonObservableFromTextResponse();
          }
          else {
            ob = new Request(apiPath.url, parameters, apiPath.method, newHeaders, pathParameters, queryParameters)
            .uploadFile(file as File, fileName)
            .jsonObservableFromTextResponse()
          }
          return this.wrapperRequestObservableWithTokenClear(ob);
      });
    }


    downloadFile(
      apiPath: APIPath, 
      file: string | File,
      fileName: string,
      parameters: KeyValuePairs = {}, 
      headers: KeyStringValuePairs = null, 
      pathParameters: KeyValuePairs = null, 
      queryParameters: KeyValuePairs = null) {

        return this.tokenService.getAuthorizationString().flatMap((token: string) => {
          let newHeaders = headers || {};
          if (token && token.length > 0) {
              newHeaders["Authorization"] = token;
              if(!newHeaders["Content-Type"]) {
                newHeaders["Content-Type"] = 'application/json';
            }
          }
          else {
              newHeaders["Authorization"] = "Basic YXBwOmFwcA==";
          }
          
          let ob: Observable<any>;
          if (window.cordova) {
            ob = (new NativeRequest(apiPath.url, parameters, apiPath.method, newHeaders, pathParameters, queryParameters))
            .downloadFile(file as string, fileName)
            .jsonObservableFromTextResponse();
          }
          else {
            ob = new Request(apiPath.url, parameters, apiPath.method, newHeaders, pathParameters, queryParameters)
            .uploadFile(file as File, fileName)
            .jsonObservableFromTextResponse()
          }
          return this.wrapperRequestObservableWithTokenClear(ob);
      });
    }

    private doFetch(
      url: string,
      parameters: KeyValuePairs | Object = {},
      method: HTTPMethods,
      keyPath: string = null,
      headers: KeyStringValuePairs = null,
      pathParameters: KeyValuePairs = null,
      queryParameters: KeyValuePairs = null) {
      let ob: Observable<any>;
      if (window.cordova) {
          if (headers["content-Type"] === "application/octet-stream") {
              ob = (new NativeRequest(url, parameters, method, headers, pathParameters, queryParameters))
                  .jsonObservableFromBlobResponse();
          } else {
              ob = (new NativeRequest(url, parameters, method, headers, pathParameters, queryParameters))
                  .jsonObservableFromTextResponse(keyPath);
          }
      }
      else {
        let req = new Request(url, parameters, method, headers, pathParameters, queryParameters);
        ob = req.jsonObservableFromTextResponse(keyPath)
      }
      return this.wrapperRequestObservableWithTokenClear(ob);
    }

    private wrapperRequestObservableWithTokenClear(ob: Observable<any>): Observable<any> {
      return ob.do((val) => {

      }, (error: any) => {
        if (error && error.status === 401) {
          this.tokenService.clearToken();
        }
        this.onError.next(error);
      })
          .catch((error) => {
              return Observable.throw(error);
          });
    }
      
}
