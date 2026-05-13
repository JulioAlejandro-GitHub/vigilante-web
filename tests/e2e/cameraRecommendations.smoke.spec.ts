import { expect, test } from "@playwright/test";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type JsonObject = Record<string, unknown>;

type CameraRead = {
  camera_id: string;
  is_active?: boolean;
  metadata: JsonObject;
};

type CameraRecommendationRead = {
  recommendation_id: string;
  camera_id: string;
  status: string;
  workflow?: {
    last_event_type?: string | null;
    actor?: string | null;
    comment?: string | null;
    occurred_at?: string | null;
  };
};

type IngestionCameraHealth = {
  camera_id: string;
  is_smoke_ready?: boolean;
  is_desired_active?: boolean;
  config_version_hash?: string | null;
  worker_state?: string | null;
  last_publish_at?: string | null;
};

type RecognitionEventEvidence = {
  eventId: string;
  sourceEventId: string;
  consumedSourceEventId: string;
  faceQualityThreshold: unknown;
  runtimeTrace: JsonObject;
};

type SmokeSummary = {
  recommendation_id: string;
  camera_id: string;
  recommendation_smoke_run_id: string;
  apply_smoke_run_id: string;
  pipeline_validation_run_id: string;
  metadata_path: string;
  previous_value: unknown;
  applied_value: unknown;
  restored_value?: unknown;
  approved: boolean;
  applied: boolean;
  metadata_updated: boolean;
  only_expected_field_changed: boolean;
  ingestion_config_hash_before: string | null;
  ingestion_config_hash_after: string | null;
  pipeline_reconsumed: boolean;
  correlation_verified: boolean;
  source_event_id_published: string;
  source_event_id_consumed: string;
  recognition_event_id: string;
  rollback: boolean;
  rollback_metadata_restored: boolean;
  audit_events: string[];
};

type FailureReason =
  | "api_not_ready"
  | "web_not_ready"
  | "recommendation_not_found"
  | "metadata_not_updated"
  | "metadata_field_missing"
  | "ingestion_not_ready"
  | "smoke_camera_not_found"
  | "smoke_camera_not_visible_in_api"
  | "smoke_camera_not_active_in_ingestion"
  | "smoke_camera_rtsp_not_publishing"
  | "smoke_camera_permission_mismatch"
  | "pipeline_not_reconsumed"
  | "rollback_failed"
  | "correlation_not_verified"
  | "approve_failed"
  | "apply_failed";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.resolve(__dirname, "../..");
const stackDir = path.resolve(webDir, "..");

const apiBaseUrl = trimTrailingSlash(env("VIGILANTE_API_BASE_URL", "http://127.0.0.1:8001"));
const webBaseUrl = trimTrailingSlash(env("VIGILANTE_WEB_BASE_URL", "http://127.0.0.1:5173"));
const ingestionHealthUrl = trimTrailingSlash(env("VIGILANTE_INGESTION_HEALTH_URL", "http://127.0.0.1:8090"));
const username = env("VIGILANTE_SMOKE_USERNAME", env("DEMO_USER", "julio"));
const password = env("VIGILANTE_SMOKE_PASSWORD", env("DEMO_PASS", "demo123"));
const recommendationStorePath = resolveFromWebDir(
  env("RECOGNITION_RECOMMENDATIONS_PATH", "../vigilante-recognition/.runtime/metrics/recommendations.jsonl"),
);
const smokeCorrelationPath = resolveFromStackDir(
  env("VIGILANTE_SMOKE_CORRELATION_PATH", ".local-logs/run/smoke-correlation.json"),
);
const smokeCameraStatePath = resolveFromStackDir(
  env("VIGILANTE_SMOKE_CAMERA_STATE_PATH", ".local-logs/run/smoke-camera.env"),
);
const ingestionLogPath = resolveFromStackDir(env("VIGILANTE_INGESTION_LOG", ".local-logs/vigilante-ingestion.log"));
const recognitionLogPath = resolveFromStackDir(env("VIGILANTE_RECOGNITION_LOG", ".local-logs/vigilante-recognition.log"));
const pipelineTimeoutMs = numberEnv("VIGILANTE_PIPELINE_SMOKE_TIMEOUT_MS", 180_000);
const ingestionRefreshTimeoutMs = numberEnv("VIGILANTE_INGESTION_REFRESH_TIMEOUT_MS", 75_000);
const skipRollback = boolEnv("VIGILANTE_SMOKE_SKIP_ROLLBACK", false);
const targetField = "face_quality_threshold";
const recognitionFieldPath = ["recognition", "face_tuning", targetField];
const metadataPath = `api.camera.metadata.${recognitionFieldPath.join(".")}`;
const recognitionDiffPath = `face_tuning.${targetField}`;

test("real camera recommendation workflow from web approve/apply/pipeline/rollback", async ({ page }, testInfo) => {
  test.setTimeout(
    numberEnv(
      "VIGILANTE_CAMERA_RECOMMENDATION_SMOKE_TIMEOUT_MS",
      pipelineTimeoutMs + ingestionRefreshTimeoutMs + 180_000,
    ),
  );

  await assertHttpReady(`${apiBaseUrl}/health`, "api_not_ready");
  await assertHttpReady(`${webBaseUrl}/`, "web_not_ready");

  const token = await loginApi();
  const camera = await resolveTargetCamera(token);
  const ingestionBefore = await requireIngestionCamera(camera.camera_id);
  const ingestionHashBefore = ingestionBefore.config_version_hash ?? null;
  const previousValue = valueAtPath(camera.metadata, recognitionFieldPath);
  const suggestedValue = resolveSuggestedValue(previousValue);
  const recommendationSmokeRunId = runId("recommendation");
  const applySmokeRunId = runId("apply");
  const pipelineValidationRunId = runId("pipeline");
  const recommendationId = `smoke-ui-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const recommendationTitle = `Smoke UI ${targetField} ${recommendationId}`;
  let appliedForCleanup = false;
  let rollbackCompleted = false;

  try {
  await seedRecommendation({
    recommendationId,
    cameraId: camera.camera_id,
    title: recommendationTitle,
    previousValue,
    suggestedValue,
    recommendationSmokeRunId,
  });

  await waitForRecommendationStatus(token, recommendationId, "pending", "recommendation_not_found");

  const uiUrl = `${webBaseUrl}/camera-recommendations?${new URLSearchParams({
    status: "pending",
    camera_id: camera.camera_id,
    q: recommendationId,
    recommendation_id: recommendationId,
  })}`;
  await page.goto(uiUrl);
  await loginViaUiIfNeeded(page);

  await expect(page.getByRole("heading", { name: "Camera recommendations" })).toBeVisible();
  await expect(page.getByText(recommendationTitle).first()).toBeVisible();
  await expect(page.getByText("Patch preview")).toBeVisible();
  await expect(page.getByText(metadataPath).first()).toBeVisible();

  await uiStep("approve_failed", async () => {
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    await page.getByLabel("Comment optional").fill(`approve from web smoke run_id=${recommendationSmokeRunId}`);
    await page.getByRole("button", { name: "Confirm approve" }).click();
    await expect(page.getByText("Approve completed.")).toBeVisible();
  });
  const approved = await waitForRecommendationStatus(token, recommendationId, "approved", "approve_failed");
  assertAuditEvent(approved, "camera_recommendation_approved", "approve_failed");

  const metadataBeforeApply = (await getCamera(token, camera.camera_id)).metadata;

  await uiStep("apply_failed", async () => {
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await page.getByLabel("Comment optional").fill(`apply from web smoke run_id=${applySmokeRunId}`);
    await page.getByRole("button", { name: "Confirm apply" }).click();
    await expect(page.getByText("Apply completed.")).toBeVisible();
  });
  const applied = await waitForRecommendationStatus(token, recommendationId, "applied", "apply_failed");
  assertAuditEvent(applied, "camera_recommendation_applied", "apply_failed");
  appliedForCleanup = true;

  const metadataAfterApply = await waitForMetadataValue(token, camera.camera_id, suggestedValue);
  const changedPaths = diffJsonPaths(
    objectAtPath(metadataBeforeApply, ["recognition"]),
    objectAtPath(metadataAfterApply, ["recognition"]),
  );
  if (!sameJson(changedPaths, [recognitionDiffPath])) {
    throw new SmokeError("metadata_not_updated", {
      camera_id: camera.camera_id,
      expected_changed_paths: [recognitionDiffPath],
      changed_paths: changedPaths,
    });
  }

  const ingestionAfter = await waitForIngestionConfigRefresh(camera.camera_id, ingestionHashBefore);
  const recognitionEvidence = await validatePipelineReconsumesConfig({
    cameraId: camera.camera_id,
    runId: pipelineValidationRunId,
    expectedFaceQualityThreshold: suggestedValue,
  });

  let rollbackMetadataRestored = false;
  let restoredValue: unknown = undefined;
  let rolledBack: CameraRecommendationRead | null = null;

  if (!skipRollback) {
    await uiStep("rollback_failed", async () => {
      await page.getByRole("button", { name: "Rollback", exact: true }).click();
      await page.getByLabel("Comment optional").fill("rollback from web smoke restore previous metadata");
      await page.getByRole("button", { name: "Confirm rollback" }).click();
      await expect(page.getByText("Rollback completed.")).toBeVisible();
    });
    rolledBack = await waitForRecommendationStatus(token, recommendationId, "rolled_back", "rollback_failed");
    assertAuditEvent(rolledBack, "camera_recommendation_rolled_back", "rollback_failed");
    rollbackCompleted = true;
    const metadataAfterRollback = await waitForMetadataValue(token, camera.camera_id, previousValue);
    restoredValue = valueAtPath(metadataAfterRollback, recognitionFieldPath);
    rollbackMetadataRestored = sameJson(
      objectAtPath(metadataBeforeApply, ["recognition"]),
      objectAtPath(metadataAfterRollback, ["recognition"]),
    );
    if (!rollbackMetadataRestored) {
      throw new SmokeError("rollback_failed", {
        camera_id: camera.camera_id,
        metadata_path: metadataPath,
        previous_value: previousValue,
        restored_value: restoredValue,
      });
    }
  }

  const summary: SmokeSummary = {
    recommendation_id: recommendationId,
    camera_id: camera.camera_id,
    recommendation_smoke_run_id: recommendationSmokeRunId,
    apply_smoke_run_id: applySmokeRunId,
    pipeline_validation_run_id: pipelineValidationRunId,
    metadata_path: metadataPath,
    previous_value: summaryValue(previousValue),
    applied_value: suggestedValue,
    restored_value: skipRollback ? undefined : summaryValue(restoredValue),
    approved: true,
    applied: true,
    metadata_updated: true,
    only_expected_field_changed: true,
    ingestion_config_hash_before: ingestionHashBefore,
    ingestion_config_hash_after: ingestionAfter.config_version_hash ?? null,
    pipeline_reconsumed: true,
    correlation_verified: true,
    source_event_id_published: recognitionEvidence.sourceEventId,
    source_event_id_consumed: recognitionEvidence.consumedSourceEventId,
    recognition_event_id: recognitionEvidence.eventId,
    rollback: !skipRollback,
    rollback_metadata_restored: rollbackMetadataRestored,
    audit_events: [
      approved.workflow?.last_event_type ?? "",
      applied.workflow?.last_event_type ?? "",
      rolledBack?.workflow?.last_event_type ?? "",
    ].filter(Boolean),
  };

  await fs.mkdir(path.dirname(testInfo.outputPath("summary.json")), { recursive: true });
  await fs.writeFile(testInfo.outputPath("summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf-8");
  console.log(formatSummary(summary));
  } catch (error) {
    if (appliedForCleanup && !rollbackCompleted && !skipRollback) {
      await rollbackViaApiCleanup(token, recommendationId);
    }
    throw error;
  }
});

function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return ["1", "true", "yes", "y", "on"].includes(raw.trim().toLowerCase());
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function resolveFromWebDir(value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(webDir, value);
}

function resolveFromStackDir(value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(stackDir, value);
}

function runId(scope: string): string {
  return `camera_rec_${scope}_${new Date().toISOString().replace(/[-:.]/g, "").replace("T", "_").replace("Z", "Z")}_${crypto
    .randomBytes(4)
    .toString("hex")}`;
}

async function assertHttpReady(url: string, reason: FailureReason): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new SmokeError(reason, { url, error: errorMessage(error) });
  }
  if (!response.ok) {
    throw new SmokeError(reason, { url, status: response.status, body: await response.text().catch(() => "") });
  }
}

async function loginApi(): Promise<string> {
  const response = await apiJson<{ access_token?: string }>("/api/v1/auth/login", {
    method: "POST",
    body: { username, password },
    skipAuth: true,
  });
  if (!response.access_token) {
    throw new SmokeError("api_not_ready", { stage: "login_missing_token", username });
  }
  return response.access_token;
}

async function loginViaUiIfNeeded(page: import("@playwright/test").Page): Promise<void> {
  if (await page.getByRole("button", { name: "Sign in" }).isVisible().catch(() => false)) {
    await page.getByLabel("Username or email").fill(username);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
  }
}

async function resolveTargetCamera(token: string): Promise<CameraRead> {
  const configuredCameraId = process.env.VIGILANTE_RECOMMENDATION_CAMERA_ID || process.env.REAL_CAMERA_ID;
  if (configuredCameraId?.trim()) {
    return getCamera(token, configuredCameraId.trim(), "smoke_camera_not_visible_in_api");
  }

  const preparedCameraId = await readPreparedSmokeCameraId();
  if (preparedCameraId) {
    return getCamera(token, preparedCameraId, "smoke_camera_not_visible_in_api");
  }

  const cameras = await apiJson<CameraRead[]>("/api/v1/cameras?limit=200", { token });
  const camera = cameras.find((item) => valueAtPath(item.metadata, ["smoke", "is_smoke_ready"]) === true);
  if (!camera) {
    throw new SmokeError("smoke_camera_not_found", {
      metadata_flag: "api.camera.metadata.smoke.is_smoke_ready",
      hint: "Run ./vigilante_stack.sh prepare-smoke-camera or set VIGILANTE_RECOMMENDATION_CAMERA_ID to a visible camera.",
    });
  }
  if (valueAtPath(camera.metadata, recognitionFieldPath) === undefined) {
    throw new SmokeError("metadata_field_missing", {
      camera_id: camera.camera_id,
      metadata_path: metadataPath,
      hint: "The smoke-ready camera is visible but lacks recognition.face_tuning.face_quality_threshold.",
    });
  }
  return camera;
}

async function readPreparedSmokeCameraId(): Promise<string | null> {
  let content = "";
  try {
    content = await fs.readFile(smokeCameraStatePath, "utf-8");
  } catch {
    return null;
  }
  for (const line of content.split(/\r?\n/)) {
    const [key, ...parts] = line.split("=");
    if (key === "VIGILANTE_RECOMMENDATION_CAMERA_ID" || key === "SMOKE_CAMERA_ID" || key === "REAL_CAMERA_ID") {
      const value = parts.join("=").trim();
      if (value) return value;
    }
  }
  return null;
}

function resolveSuggestedValue(previousValue: unknown): number {
  const override = process.env.VIGILANTE_RECOMMENDATION_SUGGESTED_VALUE;
  if (override?.trim()) {
    const parsed = Number(JSON.parse(JSON.stringify(override.trim())));
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 && parsed !== Number(previousValue)) {
      return round4(parsed);
    }
  }
  if (previousValue === undefined) {
    return 0.63;
  }

  const previousNumber = Number(previousValue);
  if (!Number.isFinite(previousNumber) || previousNumber < 0 || previousNumber > 1) {
    throw new SmokeError("metadata_field_missing", {
      metadata_path: metadataPath,
      previous_value: previousValue,
      reason: "face_quality_threshold must be a numeric value between 0 and 1 for this smoke.",
    });
  }

  const candidate = round4(previousNumber >= 0.5 ? previousNumber - 0.07 : previousNumber + 0.07);
  if (candidate >= 0 && candidate <= 1 && candidate !== previousNumber) {
    return candidate;
  }
  return previousNumber >= 0.5 ? 0.43 : 0.57;
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

async function seedRecommendation(input: {
  recommendationId: string;
  cameraId: string;
  title: string;
  previousValue: unknown;
  suggestedValue: unknown;
  recommendationSmokeRunId: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const record = {
    schema_version: "runtime_recommendation_v1",
    rule_set_version: "runtime_recommendation_smoke_v1",
    recommendation_id: input.recommendationId,
    camera_id: input.cameraId,
    status: "pending",
    recommendation_type: "face_tuning",
    severity: "low",
    title: input.title,
    reason: `Controlled web smoke recommendation for ${metadataPath}.`,
    confidence: 1,
    generated_at: now,
    actionable: true,
    auto_apply: false,
    current_value: { [targetField]: input.previousValue },
    suggested_value: { [targetField]: input.suggestedValue },
    evidence: {
      smoke: true,
      source: "vigilante-web/tests/e2e/cameraRecommendations.smoke.spec.ts",
      recommendation_smoke_run_id: input.recommendationSmokeRunId,
      metadata_path: metadataPath,
      previous_value: summaryValue(input.previousValue),
      suggested_value: input.suggestedValue,
    },
    metrics_used: ["controlled_web_smoke_seed"],
    window_summary: {
      source: "controlled_web_smoke",
      event_count: 1,
      generated_at: now,
    },
  };

  await fs.mkdir(path.dirname(recommendationStorePath), { recursive: true });
  await fs.appendFile(recommendationStorePath, `${JSON.stringify(record, stableJsonReplacer)}\n`, "utf-8");
}

async function waitForRecommendationStatus(
  token: string,
  recommendationId: string,
  status: string,
  reason: FailureReason,
): Promise<CameraRecommendationRead> {
  return waitFor(
    async () => {
      try {
        return await apiJson<CameraRecommendationRead>(`/api/v1/camera-recommendations/${recommendationId}`, { token });
      } catch (error) {
        if (error instanceof ApiHttpError && error.status === 404) return null;
        throw error;
      }
    },
    (item): item is CameraRecommendationRead => Boolean(item && item.status === status),
    {
      timeoutMs: 30_000,
      intervalMs: 1_000,
      reason,
      details: { recommendation_id: recommendationId, expected_status: status },
    },
  );
}

async function rollbackViaApiCleanup(token: string, recommendationId: string): Promise<void> {
  try {
    const current = await apiJson<CameraRecommendationRead>(`/api/v1/camera-recommendations/${recommendationId}`, { token });
    if (current.status !== "applied") return;
    await apiJson(`/api/v1/camera-recommendations/${recommendationId}/rollback`, {
      token,
      method: "POST",
      body: { comment: "cleanup rollback after failed web smoke" },
    });
    console.warn(`cleanup_rollback_via_api=true recommendation_id=${recommendationId}`);
  } catch (error) {
    console.warn(`cleanup_rollback_via_api=false recommendation_id=${recommendationId} error=${errorMessage(error)}`);
  }
}

function assertAuditEvent(recommendation: CameraRecommendationRead, eventType: string, reason: FailureReason): void {
  if (recommendation.workflow?.last_event_type !== eventType) {
    throw new SmokeError(reason, {
      recommendation_id: recommendation.recommendation_id,
      expected_audit_event: eventType,
      workflow: recommendation.workflow ?? {},
    });
  }
}

async function waitForMetadataValue(token: string, cameraId: string, expectedValue: unknown): Promise<JsonObject> {
  return waitFor(
    async () => (await getCamera(token, cameraId)).metadata,
    (metadata) => sameJson(valueAtPath(metadata, recognitionFieldPath), expectedValue),
    {
      timeoutMs: 30_000,
      intervalMs: 1_000,
      reason: "metadata_not_updated",
      details: { camera_id: cameraId, metadata_path: metadataPath, expected_value: expectedValue },
    },
  );
}

async function waitForIngestionConfigRefresh(cameraId: string, previousHash: string | null): Promise<IngestionCameraHealth> {
  return waitFor(
    async () => getIngestionCamera(cameraId),
    (camera): camera is IngestionCameraHealth => {
      if (!camera) return false;
      if (!previousHash) return Boolean(camera.config_version_hash);
      return Boolean(camera.config_version_hash && camera.config_version_hash !== previousHash);
    },
    {
      timeoutMs: ingestionRefreshTimeoutMs,
      intervalMs: 2_000,
      reason: "pipeline_not_reconsumed",
      details: {
        stage: "ingestion_config_hash_not_refreshed",
        camera_id: cameraId,
        previous_config_version_hash: previousHash,
      },
    },
  );
}

async function validatePipelineReconsumesConfig(input: {
  cameraId: string;
  runId: string;
  expectedFaceQualityThreshold: unknown;
}): Promise<RecognitionEventEvidence> {
  const ingestionLogOffset = await fileSize(ingestionLogPath);
  const recognitionLogOffset = await fileSize(recognitionLogPath);

  await writeSmokeCorrelation(input.runId);

  const evidence = await waitFor(
    async () => {
      const recognitionLog = await readLogFromOffset(recognitionLogPath, recognitionLogOffset);
      return findRecognitionEventEvidence(recognitionLog, input);
    },
    (item): item is RecognitionEventEvidence => Boolean(item),
    {
      timeoutMs: pipelineTimeoutMs,
      intervalMs: 2_000,
      reason: "pipeline_not_reconsumed",
      details: {
        stage: "recognition_event_with_new_config_not_seen",
        camera_id: input.cameraId,
        pipeline_validation_run_id: input.runId,
        expected_face_quality_threshold: input.expectedFaceQualityThreshold,
      },
      onTimeout: async () => {
        const ingestionLog = await readLogFromOffset(ingestionLogPath, ingestionLogOffset);
        if (!ingestionLog.includes(`run_id=${input.runId}`)) {
          throw new SmokeError("smoke_camera_rtsp_not_publishing", {
            camera_id: input.cameraId,
            pipeline_validation_run_id: input.runId,
            ingestion_log: ingestionLogPath,
          });
        }
      },
    },
  );

  const ingestionLog = await readLogFromOffset(ingestionLogPath, ingestionLogOffset);
  const recognitionLog = await readLogFromOffset(recognitionLogPath, recognitionLogOffset);
  if (!ingestionLog.includes("frame_ingested_published_rabbitmq") || !ingestionLog.includes(`event_id=${evidence.sourceEventId}`)) {
    throw new SmokeError("correlation_not_verified", {
      stage: "published_source_event_not_found",
      pipeline_validation_run_id: input.runId,
      source_event_id: evidence.sourceEventId,
      ingestion_log: ingestionLogPath,
    });
  }
  const consumed =
    recognitionLog.includes(`rabbitmq_frame_acked`) &&
    recognitionLog.includes(`event_id=${evidence.sourceEventId}`) &&
    recognitionLog.includes(`run_id=${input.runId}`);
  if (!consumed) {
    throw new SmokeError("correlation_not_verified", {
      stage: "consumed_source_event_not_found",
      pipeline_validation_run_id: input.runId,
      source_event_id: evidence.sourceEventId,
      recognition_log: recognitionLogPath,
    });
  }

  return evidence;
}

async function writeSmokeCorrelation(runIdValue: string): Promise<void> {
  await fs.mkdir(path.dirname(smokeCorrelationPath), { recursive: true });
  const now = new Date();
  await fs.writeFile(
    smokeCorrelationPath,
    `${JSON.stringify(
      {
        run_id: runIdValue,
        source: "camera_recommendations_web_smoke",
        created_at: now.toISOString(),
        expires_at_epoch: Math.floor(now.getTime() / 1000) + 600,
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
}

function findRecognitionEventEvidence(
  logText: string,
  input: { cameraId: string; runId: string; expectedFaceQualityThreshold: unknown },
): RecognitionEventEvidence | null {
  const marker = "recognition_event_ready ";
  for (const line of logText.split(/\r?\n/).reverse()) {
    const markerIndex = line.indexOf(marker);
    if (markerIndex < 0) continue;
    const raw = line.slice(markerIndex + marker.length).trim();
    let event: JsonObject;
    try {
      event = JSON.parse(raw) as JsonObject;
    } catch {
      continue;
    }
    const context = asObject(event.context);
    const payload = asObject(event.payload);
    const correlation = asObject(payload.correlation);
    const runIdValue = stringValue(context.run_id) || stringValue(correlation.run_id) || stringValue(payload.run_id);
    const cameraIdValue = stringValue(context.camera_id) || stringValue(payload.camera_id);
    if (runIdValue !== input.runId || cameraIdValue !== input.cameraId) continue;

    const primaryFaceTrace = asObject(payload.face_backend_trace);
    const nestedFaceTrace = asObject(asObject(payload.face_detection).face_backend_trace);
    const faceTrace = Object.keys(primaryFaceTrace).length > 0 ? primaryFaceTrace : nestedFaceTrace;
    const runtimeTrace = asObject(payload.camera_runtime_config_trace);
    const faceQualityThreshold =
      valueAtPath(faceTrace, ["configuration", "quality_thresholds", targetField]) ??
      valueAtPath(faceTrace, ["quality_thresholds", targetField]);
    if (!sameJson(faceQualityThreshold, input.expectedFaceQualityThreshold)) continue;
    if (runtimeTrace.config_source !== "api.camera.metadata") continue;
    if (runtimeTrace.face_tuning_source !== "api_camera_metadata") continue;
    if (runtimeTrace.camera_override_applied !== true) continue;

    const sourceEventId =
      stringValue(context.source_event_id) ||
      stringValue(context.source_frame_event_id) ||
      stringValue(payload.source_event_id) ||
      stringValue(payload.source_frame_event_id) ||
      stringValue(correlation.source_event_id) ||
      stringValue(correlation.source_frame_event_id);
    if (!sourceEventId) continue;

    return {
      eventId: stringValue(event.event_id) || "unknown",
      sourceEventId,
      consumedSourceEventId: sourceEventId,
      faceQualityThreshold,
      runtimeTrace,
    };
  }
  return null;
}

async function getCamera(
  token: string,
  cameraId: string,
  forbiddenReason: FailureReason = "smoke_camera_not_visible_in_api",
): Promise<CameraRead> {
  try {
    return await apiJson<CameraRead>(`/api/v1/cameras/${cameraId}`, { token });
  } catch (error) {
    if (error instanceof ApiHttpError && error.status === 404) {
      throw new SmokeError("smoke_camera_not_found", { camera_id: cameraId, detail: error.detail });
    }
    if (error instanceof ApiHttpError && error.status === 403) {
      throw new SmokeError(forbiddenReason, {
        camera_id: cameraId,
        hint: "The camera exists but is outside the smoke user's organization/site scope.",
        detail: error.detail,
      });
    }
    throw error;
  }
}

async function requireIngestionCamera(cameraId: string): Promise<IngestionCameraHealth> {
  const camera = await getIngestionCamera(cameraId);
  if (!camera) {
    throw new SmokeError("smoke_camera_not_active_in_ingestion", {
      camera_id: cameraId,
      health_url: `${ingestionHealthUrl}/health/cameras`,
      hint: "Run ./vigilante_stack.sh prepare-smoke-camera and restart ingestion, or ensure REAL_CAMERA_ID matches the smoke camera.",
    });
  }
  if (camera.is_desired_active === false) {
    throw new SmokeError("smoke_camera_not_active_in_ingestion", {
      camera_id: cameraId,
      worker_state: camera.worker_state,
      is_desired_active: camera.is_desired_active,
    });
  }
  return camera;
}

async function getIngestionCamera(cameraId: string): Promise<IngestionCameraHealth | null> {
  let response: Response;
  try {
    response = await fetch(`${ingestionHealthUrl}/health/cameras`);
  } catch (error) {
    throw new SmokeError("ingestion_not_ready", { health_url: ingestionHealthUrl, error: errorMessage(error) });
  }
  if (!response.ok) {
    throw new SmokeError("ingestion_not_ready", { health_url: ingestionHealthUrl, status: response.status });
  }
  const cameras = (await response.json()) as IngestionCameraHealth[];
  return cameras.find((camera) => camera.camera_id === cameraId) ?? null;
}

async function uiStep(reason: FailureReason, action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    throw new SmokeError(reason, { error: errorMessage(error) });
  }
}

async function apiJson<T>(
  route: string,
  options: {
    token?: string;
    method?: string;
    body?: unknown;
    skipAuth?: boolean;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (options.token && !options.skipAuth) headers.authorization = `Bearer ${options.token}`;
  let response: Response;
  const url = `${apiBaseUrl}${route}`;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new SmokeError("api_not_ready", { url, error: errorMessage(error) });
  }

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text().catch(() => response.statusText);
    }
    throw new ApiHttpError(response.status, detail, url);
  }
  return (await response.json()) as T;
}

async function waitFor<T, U extends T = T>(
  producer: () => Promise<T>,
  predicate: (value: T) => value is U,
  options: {
    timeoutMs: number;
    intervalMs: number;
    reason: FailureReason;
    details?: JsonObject;
    onTimeout?: () => Promise<void>;
  },
): Promise<U> {
  const startedAt = Date.now();
  let lastValue: unknown = undefined;
  let lastError: unknown = undefined;
  while (Date.now() - startedAt < options.timeoutMs) {
    try {
      const value = await producer();
      lastValue = value;
      if (predicate(value)) return value;
    } catch (error) {
      lastError = error;
      if (error instanceof SmokeError || error instanceof ApiHttpError) throw error;
    }
    await delay(options.intervalMs);
  }

  if (options.onTimeout) {
    await options.onTimeout();
  }
  throw new SmokeError(options.reason, {
    ...(options.details ?? {}),
    timeout_ms: options.timeoutMs,
    last_value: lastValue,
    last_error: errorMessage(lastError),
  });
}

async function fileSize(filePath: string): Promise<number> {
  try {
    const stat = await fs.stat(filePath);
    return stat.size;
  } catch {
    return 0;
  }
}

async function readLogFromOffset(filePath: string, offset: number): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    return buffer.slice(Math.min(offset, buffer.length)).toString("utf-8");
  } catch {
    return "";
  }
}

function valueAtPath(source: unknown, keys: string[]): unknown {
  let current = source;
  for (const key of keys) {
    if (!isJsonObject(current) || !(key in current)) return undefined;
    current = current[key];
  }
  return current;
}

function objectAtPath(source: unknown, keys: string[]): JsonObject {
  const value = valueAtPath(source, keys);
  return isJsonObject(value) ? value : {};
}

function diffJsonPaths(before: unknown, after: unknown, prefix = ""): string[] {
  if (sameJson(before, after)) return [];
  if (!isJsonObject(before) && isJsonObject(after)) return leafPaths(after, prefix);
  if (isJsonObject(before) && !isJsonObject(after)) return leafPaths(before, prefix);
  if (!isJsonObject(before) || !isJsonObject(after)) return [prefix || "$"];

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys]
    .sort()
    .flatMap((key) => diffJsonPaths(before[key], after[key], prefix ? `${prefix}.${key}` : key));
}

function leafPaths(value: JsonObject, prefix: string): string[] {
  const keys = Object.keys(value).sort();
  if (keys.length === 0) return [prefix || "$"];
  return keys.flatMap((key) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    const nextValue = value[key];
    return isJsonObject(nextValue) ? leafPaths(nextValue, nextPrefix) : [nextPrefix];
  });
}

function summaryValue(value: unknown): unknown {
  return value === undefined ? "__absent__" : value;
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left, stableJsonReplacer) === JSON.stringify(right, stableJsonReplacer);
}

function stableJsonReplacer(_key: string, value: unknown): unknown {
  if (!isJsonObject(value) || Array.isArray(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce<JsonObject>((accumulator, key) => {
      accumulator[key] = value[key];
      return accumulator;
    }, {});
}

function asObject(value: unknown): JsonObject {
  return isJsonObject(value) ? value : {};
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown): string {
  if (!error) return "";
  if (error instanceof Error) return error.message;
  return String(error);
}

function formatSummary(summary: SmokeSummary): string {
  return [
    "### camera_recommendations_web_smoke",
    `recommendation_id=${summary.recommendation_id}`,
    `camera_id=${summary.camera_id}`,
    `recommendation_smoke_run_id=${summary.recommendation_smoke_run_id}`,
    `apply_smoke_run_id=${summary.apply_smoke_run_id}`,
    `pipeline_validation_run_id=${summary.pipeline_validation_run_id}`,
    `metadata_path=${summary.metadata_path}`,
    `previous_value=${JSON.stringify(summary.previous_value)}`,
    `applied_value=${JSON.stringify(summary.applied_value)}`,
    `restored_value=${JSON.stringify(summary.restored_value)}`,
    `approved=${summary.approved}`,
    `applied=${summary.applied}`,
    `metadata_updated=${summary.metadata_updated}`,
    `only_expected_field_changed=${summary.only_expected_field_changed}`,
    `ingestion_config_hash_before=${summary.ingestion_config_hash_before ?? ""}`,
    `ingestion_config_hash_after=${summary.ingestion_config_hash_after ?? ""}`,
    `pipeline_reconsumed=${summary.pipeline_reconsumed}`,
    `correlation_verified=${summary.correlation_verified}`,
    `source_event_id_published=${summary.source_event_id_published}`,
    `source_event_id_consumed=${summary.source_event_id_consumed}`,
    `recognition_event_id=${summary.recognition_event_id}`,
    `rollback=${summary.rollback}`,
    `rollback_metadata_restored=${summary.rollback_metadata_restored}`,
    `audit_events=${summary.audit_events.join(",")}`,
  ].join("\n");
}

class SmokeError extends Error {
  constructor(public readonly reason: FailureReason, details: JsonObject = {}) {
    super(`${reason}: ${JSON.stringify(details, stableJsonReplacer)}`);
    this.name = "CameraRecommendationSmokeError";
  }
}

class ApiHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: unknown,
    public readonly url: string,
  ) {
    super(`api_http_error status=${status} url=${url} detail=${JSON.stringify(detail, stableJsonReplacer)}`);
  }
}
