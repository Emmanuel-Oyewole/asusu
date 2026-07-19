export type EligibilityCheck = {
  eligible: boolean;
  reason?: string;
  totalContributions: number;
  maxLoanAmount: number;
};
