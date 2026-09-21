import { PUBLISHED_RATES } from "./published-rates";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function PublishedRatesCard() {
  return <aside className="rates-card published-rates-card">
    <span className="eyebrow">Nightly rates</span>
    <h3>Rates</h3>
    <dl>{PUBLISHED_RATES.map((band) => <div key={band.calculationPeriod}>
      <dt>{band.displayPeriod}</dt>
      <dd>{money.format(band.nightlyRate)}</dd>
    </div>)}</dl>
    <p>Minimum stay is 5 nights. (Four night stays are available with an additional $500 short-stay levy.)</p>
    <p className="form-note">All rates are USD and subject to taxes, government levy and fees which are shown in your quotation.</p>
  </aside>;
}
