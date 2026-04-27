# 4. Frontend UI Specification

## 4.1 Dashboard (Scan Overview)
- **Layout Structure**: 
  - Fixed left sidebar (240px)
  - Top fixed navigation bar (64px)
  - Scrollable main content area structured in stacked full-width sections
- **Components**:
  - **HeroSection**: 3-column grid containing:
    - *Original Video Card*: Thumbnail, Title, Duration, Resolution, Upload Date.
    - *Content Fingerprint Card*: Visual audio-style waveform generator, ID string, Model info.
    - *Risk Summary Card*: SVG donut chart mapping High (Red), Medium (Amber), Low (Green) risks.
  - **PipelineSection**: Horizontal stepper component indicating `Upload -> Analyze -> Detect -> Propagate -> Report`.
  - **MainGridSection**: 3-column layout containing:
    - *Detection List (Left)*: Scrollable list of `DetectionItem` cards (Rank, Thumbnail, Title, Similarity bar).
    - *Propagation Graph (Center)*: SVG node-based map. Original node in center, branching to candidate nodes based on relations.
    - *Impact Summary (Right)*: 2x2 grid of MetricCards (Reach, Views, Engagement, Channels) and a Risk Distribution progress bar.
  - **ExplainabilityPanel**: 3-column info section showing *Why Flagged*, *Similarity Breakdown (Bars)*, and *AI Confidence (Circular Progress)*.
- **Required Data Fields**: `OriginalVideo`, `FingerprintInfo`, `RiskSummary`, `Detection[]`, `PropagationNode[]`, `MetricCard[]`, `ExplainabilityData`.
- **Interaction Behavior**: Clicking a `DetectionItem` updates the `selectedDetection` state, which drives the `PropagationGraph` highlighting and populates the `ExplainabilityPanel` below.

## 4.2 Upload / New Scan
- **Layout Structure**: Single centered container within the main view.
- **Components**:
  - **Form Input**: A large URL input field (specifically looking for YouTube URLs).
  - **Advanced Settings (Accordion)**: Sliders/inputs for N frames, M frames, and similarity threshold.
  - **Submit Button**: Large CTA to trigger the POST `/api/analyze` call.
- **Required Data Fields**: `url` (string), `frames` (int), `candidate_frames` (int), `threshold` (float).
- **Interaction Behavior**: Validates URL format on blur. Submits payload, then redirects the user to the "Dashboard" view and sets the application into a "polling" state for the new Job ID.

## 4.3 Results Page
*(Note: Integrated directly into the Dashboard view above, but acts as the fully populated state)*
- **Interaction Behavior**: Provides an "Export Report" button in the TopNav that downloads the JSON payload or generates a PDF of the current UI state.

## 4.4 Propagation View
- **Layout Structure**: Full-screen canvas area.
- **Components**:
  - **Interactive D3/SVG Map**: An expanded, zoomable, pannable version of the `PropagationGraph`.
  - **Filters Sidebar**: Toggle switches to hide "Low Risk" nodes or filter by specific platforms.
- **Required Data Fields**: `PropagationNode[]`.
- **Interaction Behavior**: Hovering over a node displays a tooltip with channel name, views, and exact match percentage.

## 4.5 Pre-upload Check
- **Layout Structure**: Contained card inside the main dashboard flow or a dedicated page.
- **Components**:
  - **UploadBox**: Drag-and-drop zone. Dashed border transitions to solid on drag-over.
  - **Status Indicator**: Animated spinner/Checkmark below the drop zone.
  - **Conflict List**: A table or list showing matches if the file triggers the database.
- **Required Data Fields**: `File` object from browser.
- **Interaction Behavior**: File drop triggers immediate POST `/api/precheck` call. The box locks into a loading state. On completion, it shows either a green "Clear to Upload" or red "Conflicts Detected" expanding list.
