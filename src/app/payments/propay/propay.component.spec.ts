import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropayComponent } from './propay.component';

describe('PropayComponent', () => {
  let component: PropayComponent;
  let fixture: ComponentFixture<PropayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PropayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
