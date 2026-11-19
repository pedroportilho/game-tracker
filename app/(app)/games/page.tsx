import { PageContent } from "@/components/layout/Page";
import { requireUser } from "@/lib/auth";
import { getGames } from "@/lib/gamesData";
import { GamesView } from "./GamesView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jogos" };

export default async function GamesPage() {
  const user = await requireUser();
  const games = await getGames(user.id);

  return (
    <PageContent width="wide">
      <GamesView initialGames={games} platforms={user.settings.platforms} />
    </PageContent>
  );
}
