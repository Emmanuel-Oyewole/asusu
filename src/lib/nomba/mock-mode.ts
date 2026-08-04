// Mock mode is automatic — active whenever no real Nomba credentials exist.
// The moment NOMBA_CLIENT_ID is set (a real account is obtained), this flips
// off everywhere it's checked, with no other code changes needed.
export function isNombaMockMode(): boolean {
  return !process.env.NOMBA_CLIENT_ID;
}
