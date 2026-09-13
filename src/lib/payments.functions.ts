import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const orderRef = z.object({ orderNumber: z.string().trim().min(3).max(20) });

export const startCardPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderRef.parse(data))
  .handler(async ({ data }) => {
    const { createYocoCheckout } = await import("./yoco.server");
    const origin = new URL(getRequest().url).origin;
    return createYocoCheckout(data.orderNumber, origin);
  });

export const confirmCardPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderRef.parse(data))
  .handler(async ({ data }) => {
    const { confirmYocoPayment } = await import("./yoco.server");
    return confirmYocoPayment(data.orderNumber);
  });
