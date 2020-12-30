import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { isPlatformServer } from '@angular/common';
import { makeStateKey, TransferState } from "@angular/platform-browser";
import { Restaurant } from '../restaurants/Interfaces.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { first, tap } from 'rxjs/operators';
import { hardcoded_restaurant } from '../../exampleRestaurant';

@Injectable()
export class RestaurantResolver implements Resolve<Restaurant> {

    constructor(
        public afs: AngularFirestore,
        private transferState: TransferState,
        @Inject(PLATFORM_ID) private platformId) {

    }

    resolve(route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Restaurant {

        console.log('platformId', this.platformId)

        const rId = route.url[1].path;

        const restaurantId = makeStateKey<Restaurant>("restaurant-" + rId);

        if (this.transferState.hasKey(restaurantId)) {

            console.log('has key', restaurantId)


            const restaurant = this.transferState.get(restaurantId, null);

            this.transferState.remove(restaurantId);

            return restaurant;
        }
        else {

            // FOR DEBUGGING, you can just uncomment this block which uses a hardcoded object to see how it /should/ behave
            if (isPlatformServer(this.platformId)) {
                this.transferState.set(restaurantId, hardcoded_restaurant);
                return hardcoded_restaurant
            }
            return hardcoded_restaurant

            // return (this.afs.doc(`restaurants/${rId}`).valueChanges() as Observable<any>)
            //     .pipe(
            //         first(),
            //         tap(restaurant => {
            //             if (isPlatformServer(this.platformId)) {
            //                 this.transferState.set(restaurantId, restaurant);
            //                 return restaurant
            //             }
            //         })
            //     );
        }
    }
}