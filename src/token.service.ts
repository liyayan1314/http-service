import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';
import {Storage} from "@ionic/storage";

declare var window: {plugin: object};


export interface TokenServiceInerface {
  clearToken(): void;
  getToken(): Observable<string>;
  set(key: string, value: string): void;
  getAuthorizationString(): Observable<string>;
}

@Injectable()
export class TokenService implements TokenServiceInerface {

    constructor(private storage: Storage) {

    }

    clearToken(){
        setTimeout(() => {
            this.storage.set("access_token", null);
        }, 10);
    }

    
    getToken(): Observable<string> {
        return Observable.fromPromise(this.storage.get("access_token"));
    }

    set(key: string, value: string) {
        setTimeout(() => {
            this.storage.set(key, value);
        }, 10);
    }

    getAuthorizationString() {
        return Observable.fromPromise(this.storage.get("access_token"))
        .catch((error) => {
            return Observable.of(null);
        })
        .map((val: string) => {
            if(val && val.length > 0) {
                return "Bearer " + val;
            }
            return null;
        });
    }
    
}
