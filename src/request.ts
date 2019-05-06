import { URLDataEncoding, JSONDataEncoding } from './data-encoding'
import { ContentType } from './content-type';
import { HTTPMethods } from './http-methods';
import { Observable } from 'rxjs';

export type KeyValuePairs = { [key: string]: string | number };
export type KeyStringValuePairs = { [key: string]: any};

declare var fetch: any;

export class Request<T> {
    url: string;
    parameters: KeyValuePairs | Object;
    method: HTTPMethods;
    header: any;
    timeout: number = 2 * 60;
    acceptStatusCodes: number[];
    acceptStatusRange: number[];
    contentType: string;
    queryParameters: KeyValuePairs;

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
        if ([HTTPMethods.Get, HTTPMethods.Delete].indexOf(this.method) >= 0) {
            url = url + (url.endsWith("?") ? "": "?") + this.getRequestData() + "";
        }
        return url;
    }

  

    fetch(): Promise<Response> {
        let url = this.getURL();
        let params: RequestInit = { method: this.method, headers: this.header };
        if ([HTTPMethods.Get, HTTPMethods.Delete].indexOf(this.method) < 0) {
            params = { ...params, body: this.getRequestData() } as RequestInit;
        }

        return fetch(url, params).then((res: any) => {
            return new Promise((resolve: (res: any) => void, reject: (res: any) => void) => {
                if (this.acceptStatusCodes && this.acceptStatusCodes.indexOf(res.status) > 0 ||
                    this.acceptStatusRange && this.acceptStatusRange[0] <= res.status && this.acceptStatusRange[1] >= res.status
                ) {
                    resolve(res);
                }
                else {
                    reject(res);
                }
            })
        })
    }

    getRequestData(): Object {

        if ([HTTPMethods.Get, HTTPMethods.Delete].indexOf(this.method) >= 0 || this.contentType === ContentType.WWW_FORM_URL_ENCODED) {
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

    observableFromPromise(promise) {
        return Observable.fromPromise(promise).flatMap((val:any) => {
            if (val.error) {
                return Observable.throw(val.error ? val.error : "unknowed failure, need to investigate!!!!");
            }
            return Observable.of(val.value);
        })
    }

    uploadFile(filePath: File, fileName: string) {
      
      let form: FormData;
      if(this.parameters instanceof FormData) {
        form = this.parameters;
      }
      else {
        form = new FormData();
        if(this.parameters) {
          for(let key of Object.keys(this.parameters)) {
            form.append(key, this.parameters[key]);
          }
        }
      }
      form.append(fileName, filePath, fileName);

      this.contentType = ContentType.MUTLFORMDATA;
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