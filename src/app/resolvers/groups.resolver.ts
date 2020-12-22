import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { isPlatformServer } from '@angular/common';
import { makeStateKey, TransferState } from "@angular/platform-browser";
import { Restaurant } from '../restaurants/Interfaces.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { first, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class GroupsResolver implements Resolve<any> {
    constructor(
        public afs: AngularFirestore,
        private transferState: TransferState,
        @Inject(PLATFORM_ID) private platformId) {


        console.log('platform id', platformId)

    }
    async resolve(route: ActivatedRouteSnapshot): Promise<any> {
        const rId = route.url[1].path;

        const restaurantId = makeStateKey<Restaurant>("groups-" + rId);

        if (this.transferState.hasKey(restaurantId)) {

            const restaurant = this.transferState.get(restaurantId, null);

            this.transferState.remove(restaurantId);

            return restaurant;
        }
        else {
            let result: Restaurant = (await this.afs.doc('public/groups/' + rId + '/Groups').get().toPromise()).data() as Restaurant
            if (isPlatformServer(this.platformId)) {
                this.transferState.set(restaurantId, result);
            }

            return result;
        }
    }
}