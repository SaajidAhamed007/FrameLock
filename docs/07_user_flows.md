# 7. User Flows

## 7.1 Flow A: Analyze Video (Core Loop)
1. **Initiation**: User clicks "New Scan" in the sidebar.
2. **Input**: User pastes a YouTube URL into the main input field.
3. **Configuration**: User expands "Advanced Settings" and sets "Frames to Extract" to `5` and "Threshold" to `0.80`.
4. **Execution**: User clicks "Start Scan".
5. **Transition**: UI changes to the "Dashboard" view. The Dashboard is in a skeleton "Loading State".
6. **Monitoring**: The `PipelineSection` stepper animates from step to step as the backend polls `/api/analyze/{id}`.
7. **Resolution**: The backend returns `status: "completed"`. UI fetches `/api/results/{id}`.
8. **Consumption**: The Dashboard fully populates. User views the "High Risk" detections and sees that 4 videos breached the 80% visual similarity threshold.

## 7.2 Flow B: Pre-upload Verification
1. **Initiation**: User clicks "Pre-upload Check" in the sidebar.
2. **Input**: User drags a local `my_new_video_final_v2.mp4` file into the dashed `UploadBox` zone.
3. **Execution**: The file drops. The UI immediately transitions the box to a "Scanning" state with a spinner.
4. **Processing**: The backend calculates the embeddings locally and compares them against known protected assets.
5. **Resolution**: The box turns green indicating "Scan Complete - No conflicts found".
6. **Action**: User safely proceeds to upload their video to YouTube natively.

## 7.3 Flow C: Investigating a Detection (Explainability)
1. **Prerequisite**: Flow A is completed. The user is on a populated Dashboard.
2. **Action**: User scrolls down the "Detection List" on the left side of the Main Grid.
3. **Selection**: User clicks on Rank #3, an Amber "Medium Risk" video with 71% similarity.
4. **Transition**: The `ExplainabilityPanel` below the grid drops its placeholder and instantly animates in data.
5. **Consumption**: User reads the "Detection Reasons" (e.g., "Partial match in the final 30 seconds"). User looks at the SVG circular confidence gauge, which animated up to 88%.
6. **Secondary Action**: User looks back at the `PropagationGraph`. Rank #3's node is now highlighted with a glowing white ring, showing the user exactly where it sits in the network. User clicks the "External Link" icon on the Detection Card to open the offending YouTube video in a new browser tab.
