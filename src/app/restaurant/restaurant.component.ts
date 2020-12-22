import { Component, Input, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { OrderFormService } from '../restaurants/order-form.service';
import { ActivatedRoute } from '@angular/router';
import { Restaurant } from '../restaurants/Interfaces.model';

@Component({
  selector: 'app-restaurant',
  templateUrl: './restaurant.component.html',
  styleUrls: ['./restaurant.component.scss']
})
export class RestaurantComponent implements OnInit {
  @Input() r: Restaurant;

  constructor(private route: ActivatedRoute) {

    this.r = this.route.snapshot.data["restaurant"];
    // console.log('restaurant passed to RestaurantComponent', this.r)

  }

  ngOnInit(): void {
  }

}
