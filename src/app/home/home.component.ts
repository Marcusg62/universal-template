import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  restaurants: Observable<any[]>;


  constructor(firestore: AngularFirestore) {

    this.restaurants = firestore.collection('restaurants').valueChanges();

  }

  ngOnInit(): void {
  }

}
