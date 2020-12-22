import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { isPlatformServer } from '@angular/common';
import { makeStateKey, TransferState } from "@angular/platform-browser";
import { Restaurant } from '../restaurants/Interfaces.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { first, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MenuResolver implements Resolve<any> {

    constructor(
        public afs: AngularFirestore,
        private transferState: TransferState,
        @Inject(PLATFORM_ID) private platformId) {

    }

    async resolve(route: ActivatedRouteSnapshot): Promise<any> {
        const rId = route.url[1].path;
        console.log(this.transferState.toJson())

        const restaurantId = makeStateKey<Restaurant>("menu-" + rId);

        if (this.transferState.hasKey(restaurantId)) {

            console.log('has key', restaurantId)


            let result = this.transferState.get(restaurantId, null);

            this.transferState.remove(restaurantId);

            return result;

        }
        else {

            let result = [];

            (await this.afs.collection(`public/menu/${rId}`).get().toPromise()).forEach(doc => {
                result.push(doc.data())
            })

            if (isPlatformServer(this.platformId)) {
                console.log('setting transferState')
                this.transferState.set(restaurantId, result);
            }
            return result;

        }
    }
}