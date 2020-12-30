import { Component, Input, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { OrderFormService } from '../restaurants/order-form.service';
import { ActivatedRoute } from '@angular/router';
import { Restaurant } from '../restaurants/Interfaces.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-restaurant',
  templateUrl: './restaurant.component.html',
  styleUrls: ['./restaurant.component.scss']
})
export class RestaurantComponent implements OnInit {
  @Input() r: Observable<Restaurant>;

  constructor(public orderForm: OrderFormService, private route: ActivatedRoute, public afs: AngularFirestore) {

    this.r = this.afs.doc('restaurants/' + route.snapshot.url[1].path).valueChanges() as Observable<Restaurant>

    this.r.subscribe((doc: any) => {
      console.log('doc', doc)
      this.orderForm.restaurant$.next(doc)
      console.log('order object', this.orderForm.restaurant)
    })
  }

  ngOnInit(): void {
  }

}
