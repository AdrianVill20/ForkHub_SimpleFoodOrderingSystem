// Shared values the website and the C# backend agree on.
// Use these names instead of typing the text, so a typo can't silently break a rule.
// The text values must stay the same as server-cs/Constants (the backend sends and checks them).

export const ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
}

export const ORDER_STATUS = {
  PENDING: 'Pending',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for delivery',
  READY_FOR_PICKUP: 'Ready for pickup',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

// Every status in the order an order moves through them (used by the admin dropdown and sorting)
export const ORDER_STATUS_FLOW = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.READY_FOR_PICKUP,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED,
]

// A customer can only cancel before the restaurant starts preparing the order
export const CUSTOMER_CANCELLABLE_STATUSES = [ORDER_STATUS.PENDING]

export const SERVICE_TYPE = {
  DELIVERY: 'Delivery',
  PICK_UP: 'Pick Up',
}
