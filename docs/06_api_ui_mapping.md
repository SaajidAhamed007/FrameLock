# 6. API ↔ UI Mapping

## 6.1 `POST /api/analyze`
- **UI Trigger**: User clicks "Start Scan" on the "Upload / New Scan" page.
- **Timing**: Immediate, upon clicking submit (after local URL regex validation).
- **State Update**: Updates global state `isSubmitting = true`. On success response (202), updates `currentJobId = res.job_id` and triggers a frontend route change to the Dashboard view (`/dashboard?job=uuid`).
- **Retry Logic**: None. User must manually resubmit.
- **Error Handling**: Pops a toast. Clears `isSubmitting` back to false so they can fix the URL and try again.

## 6.2 `GET /api/analyze/{id}`
- **UI Trigger**: React `useEffect` interval hook running on the Dashboard page.
- **Timing**: Triggers every 2.5 seconds while the job `status` is not `completed` or `failed`.
- **State Update**: Updates the `PipelineSection` stepper. Maps backend `progress.stage` to the current active step (e.g., "active_extracting" -> "Analyze" step active). Updates `progressText` below the stepper.
- **Retry Logic**: If a 5xx error occurs, silently retry up to 3 times before declaring the job failed to avoid flashing an error state for temporary network blips.
- **Error Handling**: If 404 or max retries hit, kill the polling interval and display a global error banner.

## 6.3 `GET /api/results/{id}`
- **UI Trigger**: Automatically fired by the Dashboard `useEffect` the moment `/api/analyze/{id}` returns `status: "completed"`.
- **Timing**: Fires exactly once per successful job lifecycle.
- **State Update**: Maps the JSON payload to the corresponding React Context or Zustand store:
  - `res.input_video` -> `HeroSection` (Original Video)
  - `res.fingerprint` -> `HeroSection` (Fingerprint)
  - `res.risk_summary` -> `HeroSection` and `MainGridSection`
  - `res.detections` -> `MainGridSection` (Detection List)
  - `res.propagation_nodes` -> `PropagationGraph`
- **Retry Logic**: 1 retry if network drops during fetch.
- **Error Handling**: Full page error state overlaying the Dashboard content area with a "Reload Results" button.

## 6.4 `POST /api/precheck`
- **UI Trigger**: User drops a file onto the `UploadBox` component or selects one via file picker.
- **Timing**: Immediately upon file selection.
- **State Update**: Sets `UploadBox` to `isChecking = true`. When response returns, sets `isChecking = false` and `isDone = true`. Injects `res.conflicts` into the UI list directly below the button.
- **Retry Logic**: No auto-retries for large file uploads.
- **Error Handling**: Updates UI to show upload failure, resets `UploadBox` so user can drop a different file.

## 6.5 `GET /api/health`
- **UI Trigger**: Global layout wrapper `useEffect` on app mount.
- **Timing**: Fires once when the user opens the application.
- **State Update**: If healthy, does nothing visually. If unhealthy, displays a small yellow "Degraded Performance" warning icon in the TopNav next to the Date Selector.
- **Retry Logic**: None.
- **Error Handling**: Same as unhealthy state update.
