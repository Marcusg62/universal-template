import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-restaurant',
  templateUrl: './restaurant.component.html',
  styleUrls: ['./restaurant.component.scss']
})
export class RestaurantComponent implements OnInit {

  private restaurantDoc: AngularFirestoreDocument<any>;
  restaurant: Observable<any>;

  constructor(private afs: AngularFirestore) {

    this.restaurantDoc = afs.doc<any>('restaurants/thaiHouse');
    this.restaurant = this.restaurantDoc.valueChanges();
  }

  ngOnInit(): void {
  }

}
