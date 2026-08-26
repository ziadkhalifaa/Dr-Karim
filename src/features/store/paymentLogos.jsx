// Real brand logos for Egyptian payment methods (official PNGs in /assets).

export function VodafoneCashLogo({ size = 34 }) {
  return <img src="/assets/vc.png" alt="Vodafone Cash" width={size} height={size} style={{ objectFit: "contain", borderRadius: 8 }} />;
}

export function InstaPayLogo({ size = 34 }) {
  return <img src="/assets/inp.png" alt="InstaPay" width={size} height={size} style={{ objectFit: "contain", borderRadius: 8 }} />;
}
