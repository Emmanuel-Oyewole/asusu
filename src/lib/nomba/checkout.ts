import { isNombaMockMode } from "@/lib/nomba/mock-mode";

type CreateCheckoutOrderInput = {
  orderReference: string;
  amount: number;
  customerEmail: string;
  callbackUrl: string;
};

type CreateCheckoutOrderResult = {
  checkoutLink: string;
  orderReference: string;
};

export async function createCheckoutOrder(
  input: CreateCheckoutOrderInput,
): Promise<CreateCheckoutOrderResult> {
  if (isNombaMockMode()) {
    const params = new URLSearchParams({
      ref: input.orderReference,
      amount: input.amount.toString(),
      callback: input.callbackUrl,
    });
    return {
      checkoutLink: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/pay/mock?${params.toString()}`,
      orderReference: input.orderReference,
    };
  }

  // TODO once real sandbox credentials exist: fetch a token via lib/nomba/auth.ts,
  // set Authorization + accountId headers, and switch to /sandbox/checkout/order
  // per Nomba's authenticated sandbox path.

  const url = `${process.env.NOMBA_BASE_URL}/v1/checkout/order`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order: {
        orderReference: input.orderReference,
        amount: input.amount.toFixed(2),
        currency: "NGN",
        customerEmail: input.customerEmail,
        callbackUrl: input.callbackUrl,
      },
    }),
  });

  const json = await res.json();

  if (json.code !== "00") {
    throw new Error(
      `Nomba checkout creation failed: ${json.description ?? "unknown error"}`,
    );
  }

  return {
    checkoutLink: json.data.checkoutLink,
    orderReference: json.data.orderReference,
  };
}
