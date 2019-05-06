import { URLDataEncoding, JSONDataEncoding } from './data-encoding'
import { ContentType } from './content-type';
import { HTTPMethods } from './http-methods';
import { Observable } from 'rxjs';

type KeyValuePairs = { [key: string]: string | number };
type KeyStringValuePairs = { [key: string]: any };

declare var cordova: {
    plugin: {
        http: {sendRequest: Function, get:Function, post: Function, put: Function, delete: Function}
    }};


type NativeResponse = {
    status: any,
    data: any,
    url: string,
    headers: KeyValuePairs
}

export class NativeRequest<T> {
    url: string;
    timeout: number = 2 * 60;
    parameters: KeyValuePairs | Object;
    method: HTTPMethods | string;
    header: any;
    acceptStatusCodes: number[];
    acceptStatusRange: number[];
    contentType: string;
    queryParameters: KeyValuePairs;
    filePath: string;
    fileName: string;
  
    constructor(url: string, parameters: KeyValuePairs | Object = {}, method: HTTPMethods = HTTPMethods.Get, header: KeyStringValuePairs = {}, pathParameters: KeyValuePairs = null, queryParameters: KeyValuePairs = null) {
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

        this.url = this._replacePathComponentsWithPathParameters(pathParameters)

        
        let newHeaders = header || {};
        let isMultiPartFormData = this.parameters instanceof FormData;
        for (let key of Object.keys(newHeaders)) {
            if (key.toLowerCase() === "content-type") {
                let ct = newHeaders[key].toLowerCase() || "";
                if(isMultiPartFormData) {
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

    validateWithStatusCodes(statusCodes: number[]) {
        this.acceptStatusCodes = statusCodes;
        return this;
    }

    validateWithRangeStatusCode(minStatusCode: number, maxStatusCode: number) {
        this.acceptStatusRange = [minStatusCode, maxStatusCode];
        return this;
    }

    validate() {
        return this.validateWithRangeStatusCode(200, 300);
    }

    getURL(): string {
        let url = this.url;
        if(this.queryParameters) {
            url += "?" + new URLDataEncoding().encode(this.queryParameters);
        }
        if ([HTTPMethods.Get, HTTPMethods.Delete].indexOf(this.method as HTTPMethods) >= 0) {
            url = url + (url.endsWith("?") ? "": "?") + this.getRequestData() + "";
        }
        return url;
    }
    

    fetch(): Promise<Response> {
        let url = this.getURL();
        let params = this.parameters;
        // if ([HTTPMethods.Get, HTTPMethods.Delete].indexOf(this.method) < 0) {
        //     params = { body: this.getRequestData() } as RequestInit;
        // }

        let successFunc = (resolver, response: NativeResponse) => {
            if(this.method === "upload" || this.method === "download") {
                response["status"] = 200;
                response["data"] = JSON.stringify(response);
            }
            resolver(this.getResponseFromNativeResponse(response));
        };
        let errorFunc = (rejector, response: NativeResponse) => {
            if(this.method === "upload" || this.method === "download") {
                response["status"] = 400;
                response["data"] = JSON.stringify(response);
            }
            if (response["status"] === 1) {
                response["status"] = 444;
            }
            rejector(this.getResponseFromNativeResponse(response));
        };

        let serializer = 'json';
        switch(this.method) {
            case HTTPMethods.Get:
            case HTTPMethods.Delete:
            case HTTPMethods.Header:
                serializer ='urlencoded';
                break;  
        }
        if(this.contentType == ContentType.WWW_FORM_URL_ENCODED) {
            serializer = 'urlencoded';
        }

        let options: object;
        if(!!this.filePath) {
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
        let promise = new Promise<Response>((resolver, rejector) => {
            cordova.plugin.http.sendRequest(
                url,
                options,
                (response) => successFunc(resolver, response),
                (response) => errorFunc(rejector, response));
        });

        return promise.then((res: Response) => {
            return new Promise<Response>((resolve, reject) => {
                if (this.acceptStatusCodes && this.acceptStatusCodes.indexOf(res.status) > 0 ||
                    this.acceptStatusRange && this.acceptStatusRange[0] <= res.status && this.acceptStatusRange[1] >= res.status
                ) {
                    resolve(res);
                }
                else {
                    reject(res);
                }
            }).catch((error) => {
                throw error;
            })
        }).catch((error) => {
            throw error;
        })
    }

    getResponseFromNativeResponse(response: NativeResponse) {
        let headers = new Headers();
        if(response.headers) {
            Object.keys(response.headers)
                .forEach((key) => headers[key] = response.headers[key]);
        }
       let statusText = response.status + "";
       let status = parseInt(response.status);
       return new Response(response.data, {headers, status, statusText: statusText});
    }

    getRequestData(): Object {

        if ([HTTPMethods.Get, HTTPMethods.Delete].indexOf(this.method as HTTPMethods) >= 0 || this.contentType === ContentType.WWW_FORM_URL_ENCODED) {
            return new URLDataEncoding().encode(this.parameters);
        }
        else if(this.parameters instanceof FormData) {
            // form data
            return this.parameters;
        }
        else if (this.contentType === ContentType.JSON) {
            return new JSONDataEncoding().encode(this.parameters);
        }
        else {
            return new JSONDataEncoding().encode(this.parameters);
        }
    }

    fetchWithJSONResponse(): Observable<object> {
        return Observable.fromPromise(this.fetch().then((response) => {
            return response.json();
        }))
        .map((json) => {
            if (!!json) {
                return {value: json};
            }
            return {value: {}};
        });

    }

    fetchWithTextResponse() {
        return Observable.fromPromise(this.fetch().then((response) => {
            return response.text();
        })
            .catch((error) => {
                throw error;
            }));
    }

    fetchWithBlobResponse() {
        return Observable.fromPromise(this.fetch().then((response) => {
            return response.blob();
        }));
    }

    fetchWithArrayBufferResponse() {
        return Observable.fromPromise(this.fetch().then((response) => {
            return response.arrayBuffer();
        }));
    }

    jsonObservableFromTextResponse(keyPath: string = "") {
        return this.fetchWithTextResponse()
        .map((text) => {
            if (!!text) {
                try{
                    text = JSON.parse(text)
                } catch (e) {

                }
                return {value: text};
            }
            return {value: {}};
            })
        .flatMap((val: any) => {
            if (val && val.value) {
                let newOb =  Observable.of(val.value);
                if (keyPath && keyPath.length > 0) {
                    return newOb.pluck(...keyPath.split("."));
                }
                return newOb;
            }
            return Observable.throw(val.error ? val.error : "unknowed failure, need to investigate!!!!");
        })
    }

    jsonObservableFromBlobResponse() {
        return this.fetchWithBlobResponse()
            .map((text) => {
                if (!!text) {
                    return Observable.of(text);
                }
                return Observable.of({});
            })
    }

    observableFromPromise(promise) {
        return Observable.fromPromise(promise).flatMap((val:any) => {
            if (val.error) {
                return Observable.throw(val.error ? val.error : "unknowed failure, need to investigate!!!!");
            }
            return Observable.of(val.value);
        })
    }

    uploadFile(filePath: string, fileName: string) {
      this.filePath = filePath;
      this.fileName = fileName;
      this.method = "upload";
      return this;
    }

    downloadFile(filePath: string, fileName: string) {
        this.filePath = filePath;
        this.fileName = fileName;
        this.method = "download";
        return this;
    }

    private _replacePathComponentsWithPathParameters(pathParams?: KeyValuePairs): string {
      let url: string = this.url;

      if (pathParams) {
          Object.keys(pathParams).forEach(key => {
              const prop: RegExp = new RegExp(`:${key}`);

              url = url.replace(prop, (pathParams[key] + ""))
          });
      }
      return url;
  }


}