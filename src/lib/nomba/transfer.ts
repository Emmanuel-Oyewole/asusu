type TransferInput = {
  amount: number;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  merchantTxRef: string;
  narration: string;
};

type TransferResult = {
  success: boolean;
  nombaTransferRef: string;
  raw: unknown;
};

export async function initiateBankTransfer(
  input: TransferInput,
): Promise<TransferResult> {
  const res = await fetch(`${process.env.NOMBA_BASE_URL}/v2/transfers/bank`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: input.amount,
      accountNumber: input.accountNumber,
      accountName: input.accountName,
      bankCode: input.bankCode,
      merchantTxRef: input.merchantTxRef,
      senderName: "ABU Cooperative",
      narration: input.narration,
    }),
  });

  const json = await res.json();

  if (json.code !== "00" || json.description !== "SUCCESS") {
    return { success: false, nombaTransferRef: "", raw: json };
  }

  return { success: true, nombaTransferRef: json.data.id, raw: json };
}
