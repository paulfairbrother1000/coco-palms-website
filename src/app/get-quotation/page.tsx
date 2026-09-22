import { permanentRedirect } from "next/navigation";

type SearchParams = Promise<{
  arrival?: string | string[];
  departure?: string | string[];
}>;

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export default async function GetQuotationPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const destination = new URLSearchParams();
  const arrival = typeof params.arrival === "string" ? params.arrival : "";
  const departure = typeof params.departure === "string" ? params.departure : "";

  if (isoDate.test(arrival)) destination.set("arrival", arrival);
  if (isoDate.test(departure)) destination.set("departure", departure);

  const query = destination.toString();
  permanentRedirect(`/rates-and-availability${query ? `?${query}` : ""}`);
}
