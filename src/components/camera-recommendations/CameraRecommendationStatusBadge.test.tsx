import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  CameraRecommendationFlagBadge,
  CameraRecommendationSeverityBadge,
  CameraRecommendationStatusBadge,
} from "./CameraRecommendationStatusBadge";
import { renderWithAppProviders } from "../../test/render";

describe("CameraRecommendationStatusBadge", () => {
  it("renders workflow, severity and flag badges", () => {
    renderWithAppProviders(
      <div>
        <CameraRecommendationStatusBadge status="pending" />
        <CameraRecommendationStatusBadge status="approved" />
        <CameraRecommendationStatusBadge status="rejected" />
        <CameraRecommendationStatusBadge status="applied" />
        <CameraRecommendationStatusBadge status="failed" />
        <CameraRecommendationStatusBadge status="rolled_back" />
        <CameraRecommendationSeverityBadge severity="critical" />
        <CameraRecommendationFlagBadge label="actionable" active activeText="true" inactiveText="false" />
        <CameraRecommendationFlagBadge label="auto_apply" active={false} activeText="true" inactiveText="false" />
      </div>,
    );

    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("approved")).toBeInTheDocument();
    expect(screen.getByText("rejected")).toBeInTheDocument();
    expect(screen.getByText("applied")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
    expect(screen.getByText("rolled_back")).toBeInTheDocument();
    expect(screen.getByText("critical")).toBeInTheDocument();
    expect(screen.getByText("actionable: true")).toBeInTheDocument();
    expect(screen.getByText("auto_apply: false")).toBeInTheDocument();
  });
});
