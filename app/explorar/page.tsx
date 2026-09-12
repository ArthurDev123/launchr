import { getPublicLandings } from "@/lib/marketplace";
import ExploreCatalog from "./explore-catalog";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const { landings, error } = await getPublicLandings();
  return <ExploreCatalog landings={landings} error={error} />;
}
