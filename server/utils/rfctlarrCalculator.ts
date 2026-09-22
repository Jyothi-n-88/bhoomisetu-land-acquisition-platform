/**
 * RFCTLARR Act (2013) First Schedule Statutory Compensation Calculator
 * Right to Fair Compensation and Transparency in Land Acquisition, 
 * Rehabilitation and Resettlement Act, 2013.
 */

export interface RfctlarrInput {
  baseMarketRate: number;      // Base circle / registered market rate (₹ per acre)
  areaInAcres: number;         // Land extent in acres
  isRural?: boolean;           // Rural land flag: applies statutory multiplier (1.0 to 2.0)
  multiplierFactor?: number;   // Specific rural multiplier factor (between 1.0 and 2.0, default: 2.0 for rural, 1.0 for urban)
  assetsValue?: number;        // Value of attached assets: structures, buildings, trees, standing crops (under Sec 29)
  yearsFromNotification?: number; // Duration from Section 3A / 4 preliminary notification to award (default: 1 year)
}

export interface RfctlarrBreakdown {
  baseMarketRate: number;
  areaInAcres: number;
  baseLandValue: number;
  isRural: boolean;
  multiplierFactor: number;
  multipliedLandValue: number;
  assetsValue: number;
  subtotalBeforeSolatium: number;
  solatium: number;
  solatiumPercentage: number;
  additionalMarketValue: number;
  additionalMarketValuePercentage: number;
  yearsFromNotification: number;
  totalCompensationAward: number;
  legalReference: string;
}

/**
 * Calculates the statutory award as mandated under the First Schedule of the RFCTLARR Act, 2013:
 * 1. Base Land Value = Base Market Rate * Area in Acres
 * 2. Multiplied Land Value = Base Land Value * Multiplier (1.0 for Urban, 1.0 to 2.0 for Rural)
 * 3. Assets Value = Standing crops, trees, and buildings assessed under Section 29
 * 4. 100% Solatium = 100% of (Multiplied Land Value + Assets Value) under Section 30(1)
 * 5. 12% Additional Market Value = 12% per annum on Market Value under Section 30(3)
 * Total Award = Multiplied Land Value + Assets Value + Solatium + Additional Market Value
 */
export const calculateRfctlarrCompensation = (input: RfctlarrInput): RfctlarrBreakdown => {
  const baseMarketRate = Math.max(0, Number(input.baseMarketRate) || 0);
  const areaInAcres = Math.max(0, Number(input.areaInAcres) || 0);
  const isRural = Boolean(input.isRural);
  const assetsValue = Math.max(0, Number(input.assetsValue) || 0);
  const yearsFromNotification = Math.max(0.1, Number(input.yearsFromNotification) || 1);

  // Determine statutory multiplier factor
  let multiplierFactor = 1.0;
  if (isRural) {
    if (input.multiplierFactor !== undefined && !isNaN(input.multiplierFactor)) {
      // Clamp between 1.0 and 2.0 as prescribed by statutory rules
      multiplierFactor = Math.min(2.0, Math.max(1.0, Number(input.multiplierFactor)));
    } else {
      // Default statutory rural multiplier is 2.0 (or 1.5-2.0 based on distance to urban centers)
      multiplierFactor = 2.0;
    }
  } else {
    multiplierFactor = 1.0;
  }

  // 1. Base Land Value (Market value under Section 26)
  const baseLandValue = Math.round(baseMarketRate * areaInAcres);

  // 2. Multiplied Land Value (Section 26 & First Schedule)
  const multipliedLandValue = Math.round(baseLandValue * multiplierFactor);

  // 3. Subtotal before Solatium
  const subtotalBeforeSolatium = multipliedLandValue + assetsValue;

  // 4. 100% Solatium under Section 30(1)
  const solatium = Math.round(1.0 * subtotalBeforeSolatium);

  // 5. 12% Additional Market Value under Section 30(3) per annum on statutory multiplied land market value
  const additionalMarketValue = Math.round(0.12 * multipliedLandValue * yearsFromNotification);

  // 6. Total Statutory Compensation Award
  const totalCompensationAward = subtotalBeforeSolatium + solatium + additionalMarketValue;

  return {
    baseMarketRate,
    areaInAcres: Number(areaInAcres.toFixed(4)),
    baseLandValue,
    isRural,
    multiplierFactor: Number(multiplierFactor.toFixed(2)),
    multipliedLandValue,
    assetsValue,
    subtotalBeforeSolatium,
    solatium,
    solatiumPercentage: 100,
    additionalMarketValue,
    additionalMarketValuePercentage: 12,
    yearsFromNotification,
    totalCompensationAward,
    legalReference: 'RFCTLARR Act, 2013 (First Schedule, Sections 26, 29, 30(1), & 30(3))',
  };
};
