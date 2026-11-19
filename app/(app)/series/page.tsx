import { PageContent } from "@/components/layout/Page";
import { requireUser } from "@/lib/auth";
import { getSeries } from "@/lib/seriesData";
import { SeriesView } from "./SeriesView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Séries" };

export default async function SeriesPage() {
  const user = await requireUser();
  const series = await getSeries(user.id);

  return (
    <PageContent width="narrow">
      <SeriesView initialSeries={series} />
    </PageContent>
  );
}
