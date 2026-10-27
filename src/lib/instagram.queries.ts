import { queryOptions } from "@tanstack/react-query";
import { getInstagramFeed } from "@/lib/instagram.functions";

/**
 * Os posts mudam pouco ao longo do dia, então o resultado fica em cache por
 * meia hora — menos chamadas ao FeedFusion e menos visitas consumidas.
 */
export const feedQueryOptions = queryOptions({
  queryKey: ["instagram-feed"],
  queryFn: () => getInstagramFeed(),
  staleTime: 1000 * 60 * 30,
});
