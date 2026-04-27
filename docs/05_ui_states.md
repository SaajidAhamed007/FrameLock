# 5. UI States (CRITICAL)

## 5.1 Dashboard (Scan Overview)
- **Loading State**: Displays pulsing skeleton blocks for the Hero Section, empty gray circles for the Pipeline Stepper, and blurred blocks for the Detections list. The TopNav shows a continuous subtle loading bar across the top edge.
- **Success State**: Fully populated widgets with actual imagery, real numbers, and SVG graphs rendered cleanly. Animations fire once on mount.
- **Empty State**: (If no matches found) The Hero Section populates, but the Detection List shows a checkmark graphic "No infringing videos found." The Propagation Graph shows only the central Original node. Impact Metrics read "0".
- **Error State**: A global toast/banner appears at the top: "Failed to load results. Please try again." A "Retry" button is provided.

## 5.2 Upload / New Scan
- **Loading State**: The "Start Scan" button turns into a pulsing loading state with text "Initializing Job..." and is disabled to prevent double clicks.
- **Success State**: Immediate redirect to the Dashboard page with the new Job ID in the URL.
- **Empty State**: Input field is empty, "Start Scan" is disabled.
- **Error State**: Red outline around the URL input box with a helper text below: "Invalid YouTube URL format." If the backend rejects the job, a red toast notification slides in from the bottom right.

## 5.3 Explainability Panel
- **Loading State**: Displays only when a detection is clicked. A swift micro-animation of a spinner while the specific data for that candidate is mapped.
- **Success State**: Renders the 3 info cards. The circular gauge animates from 0% to the final confidence percentage.
- **Empty State**: Before the user clicks *any* detection on the left, the panel shows a centered placeholder: a grayed-out AI brain icon with text "No Detection Selected. Click a detection to see AI analysis details."
- **Error State**: Replaces the placeholder text with "Unable to load explanation for this detection."

## 5.4 Pre-upload Check
- **Loading State**: The drag-and-drop zone changes to a solid border. The action button turns indigo, showing a spinning SVG loader with the text "Scanning for conflicts…". All other interactions in the box are disabled.
- **Success State**: The button turns green and reads "Scan Complete — 2 potential conflicts found" (or "No conflicts"). A list of conflicts expands below the upload box.
- **Empty State**: Shows the dashed border and "Drag & drop your video here" prompt.
- **Error State**: The upload box shakes horizontally (error animation). The file name turns red, and the text says "File too large (Max 2GB) or unsupported format."
