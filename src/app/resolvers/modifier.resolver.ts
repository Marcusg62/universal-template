import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { isPlatformServer } from '@angular/common';
import { makeStateKey, TransferState } from "@angular/platform-browser";
import { Restaurant } from '../restaurants/Interfaces.model';
import { AngularFirestore } from '@angular/fire/firestore';
import { first, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ModifierResolver implements Resolve<any> {

    constructor(
        public afs: AngularFirestore,
        private transferState: TransferState,
        @Inject(PLATFORM_ID) private platformId) {

    }

    resolve(route: ActivatedRouteSnapshot): Observable<any> {
        const rId = route.url[1].path;

        const restaurantId = makeStateKey<Restaurant>("modifiers-" + rId);

        if (this.transferState.hasKey(restaurantId)) {

            console.log('has key', restaurantId)


            const restaurant = this.transferState.get(restaurantId, null);

            // this.transferState.remove(restaurantId);

            return of(restaurant);
        }
        else {
            (this.afs.collection(`public/modifiers/${rId}`).valueChanges() as Observable<any>)
                .pipe(
                    first(),
                    tap(modifiers => {
                        if (isPlatformServer(this.platformId)) {
                            this.transferState.set(restaurantId, modifiers);
                            return modifiers
                        }
                    })
                );
        }
    }
}