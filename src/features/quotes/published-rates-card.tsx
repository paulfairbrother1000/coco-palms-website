import { PUBLISHED_RATES } from "./published-rates";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function PublishedRatesCard() {
  return <aside className="rates-card published-rates-card">
    <span className="eyebrow">Nightly rates</span>
    <h3>Published rates</h3>
    <dl>{PUBLISHED_RATES.map((band) => <div key={band.calculationPeriod}>
      <dt>{band.displayPeriod}</dt>
      <dd>{money.format(band.nightlyRate)}</dd>
    </div>)}</dl>
    <p>Minimum stay is 5 nights. Four nights may be available with a $500 short-stay levy. A 10-night minimum applies over the festive period.</p>
    <p className="form-note">All rates are USD and subject to taxes, government levy and fees shown in your quotation.</p>
  </aside>;
}
