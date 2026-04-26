import { EmptyState } from "../DataState";
import { ReviewLinkCard } from "../reviews/ReviewLinkCard";
import { SuggestionLinkCard } from "../suggestions/SuggestionLinkCard";
import type { CaseSuggestion, ManualReview } from "../../types/api";

interface RelatedEntitiesPanelProps {
  reviews: ManualReview[];
  suggestions: CaseSuggestion[];
  reviewHref: (reviewId: string) => string;
  suggestionHref: (suggestionId: string) => string;
}

export function RelatedEntitiesPanel({ reviews, suggestions, reviewHref, suggestionHref }: RelatedEntitiesPanelProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="panel p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-950">Related reviews</h2>
          <span className="text-xs font-medium text-zinc-500">{reviews.length}</span>
        </div>
        <div className="space-y-2">
          {reviews.length === 0 ? <EmptyState label="No related reviews." /> : null}
          {reviews.map((review) => (
            <ReviewLinkCard key={review.review_id} review={review} to={reviewHref(review.review_id)} />
          ))}
        </div>
      </div>

      <div className="panel p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-950">Related suggestions</h2>
          <span className="text-xs font-medium text-zinc-500">{suggestions.length}</span>
        </div>
        <div className="space-y-2">
          {suggestions.length === 0 ? <EmptyState label="No related suggestions." /> : null}
          {suggestions.map((suggestion) => (
            <SuggestionLinkCard key={suggestion.suggestion_id} suggestion={suggestion} to={suggestionHref(suggestion.suggestion_id)} />
          ))}
        </div>
      </div>
    </section>
  );
}
