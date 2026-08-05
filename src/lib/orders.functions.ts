import { createServerFn } from "@tanstack/react-start";
import { placeOrderSchema, trackOrderSchema } from "./order-schemas";

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => placeOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { createOrder } = await import("./hotboxx.server");
    return createOrder(data, null);
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => trackOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { findOrderStatus } = await import("./hotboxx.server");
    return findOrderStatus(data.orderNumber);
  });
