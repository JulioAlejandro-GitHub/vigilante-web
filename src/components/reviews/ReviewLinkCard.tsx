import { Link } from "react-router-dom";

import { StatusBadge, statusTone } from "../StatusBadge";
import type { ManualReview } from "../../types/api";
import { formatDateTime, shortId } from "../../utils/format";

interface ReviewLinkCardProps {
  review: ManualReview;
  to: string;
}

export function ReviewLinkCard({ review, to }: ReviewLinkCardProps) {
  return (
    <Link className="block rounded border border-zinc-200 bg-white p-3 text-sm hover:border-teal-200 hover:bg-teal-50/30" to={to}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-zinc-950">{review.review_type}</div>
          <div className="mt-1 text-xs text-zinc-500">{shortId(review.review_id)}</div>
        </div>
        <StatusBadge value={review.status} tone={statusTone(review.status)} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-600">
        <span>Subject {shortId(review.subject_id)}</span>
        <span>Camera {shortId(review.camera_id)}</span>
        <span>Priority {review.priority}</span>
        <span>{formatDateTime(review.event_ts)}</span>
      </div>
    </Link>
  );
}
