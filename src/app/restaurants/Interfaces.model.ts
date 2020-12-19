

export interface CartItem {
  name: string,
  price: number,
  modifiers: [],
  priceDiff: [],
  instructions: string,
  size?: '',
  quantity: number,
  couponItem: boolean
}


export interface Fee {
  "active": boolean,
  "fee": number,
  "type": string
}

export interface convenienceFee {
  "active": boolean,
  "fee": Array<TieredFee>,
  "type": string
}
export interface TieredFee {
  "max": number,
  "min": number,
  "number": number
}
export interface DeliveryFee {
  "fee": number,
  "min": number,
  "max": number
}
export interface Coupon {
  "active": boolean,
  "couponId": string,
  "description": string,
  "endDate": any,
  "freeItems"?: Array<string>,
  "minSubtotal": number,
  "mixable": boolean
  "orderType": string,
  "singleUse": boolean,
  "startDate": any,
  "title": string,
  "type": string,
  "value"?: number
}
export interface Restaurant {
  "active": boolean,
  'acceptsDineIn': boolean,
  "addConvenienceFee": convenienceFee,
  "address": string,
  "version": "1.0.0",
  "closedMessage": string,
  "coupons": Array<Coupon>,
  "limitOneCoupon": boolean,
  "deliveryFees": Array<DeliveryFee>,
  "deliveryMin": number,
  "deliveryTime": string,
  "takesDelivery": boolean,
  "displayName": string,
  "deliveryMinSubtotal"?: number,
  "livePublishableKey": string,
  "lunchEnd": Array<string>,
  "lunchStart": Array<string>,
  "minutePadding": number,
  "orderEnd": Array<string>,
  "orderStart": Array<string>,
  "phoneNum": string,
  "pickupFee": Fee,
  "pickupTime": string,
  "prodPrint": {
    "Layout": string,
    "childAccount": string,
    "printerId": {
      "large": number,
      "small": number
    }
  },
  "restaurantID": string,
  "taxRate": number,
  "testPrint": {
    "Layout": "large",
    "childAccount": null,
    "printerId": {
      "large": number,
      "small": number
    }
  },
  "testPublishableKey": string,
  timezone: string,
  images: [string],
  reservations: boolean,
  dineInQueueLength: number,
  waitTime: string,
  acceptsCheckins?: boolean,
  imageLinks: any,
}

export interface orderObject {
  order_time: string,
  mode: string,
  restaurantID: string,
  order_ISO_time: string,
  isFutureOrder: boolean,
  futureOrderDateTime: any,
  items: Array<CartItem>,
  deliveryAddress: string,
  aptNum: string,
  phoneNum: string,
  first: string,
  last: string,
  email: string,
  orderInstructions: string,
  orderType: string,
  coupons: Array<Coupon>,
  subTotal: number,
  convenienceFee: number,
  tipAmount: number,
  tax: number,
  total: number,
  discount: number,
  apiVersion: string
}