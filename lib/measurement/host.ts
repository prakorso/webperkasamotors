/**
 * Measurement may only run on the canonical production host. Deploy
 * previews (deploy-preview-N--webperkasamotors.netlify.app), branch
 * deploys, the bare netlify.app subdomain and localhost must never send
 * analytics or advertising hits. The future tag loader (R1B) checks this
 * in the browser before injecting anything.
 */
export const MEASUREMENT_HOSTNAME = "perkasamotors.id";

export function isMeasurementHost(hostname: string): boolean {
  return hostname === MEASUREMENT_HOSTNAME;
}
