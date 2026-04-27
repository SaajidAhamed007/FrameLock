# 8. Data Structures

## 8.1 Analysis Result Payload (Root)
Returned by `GET /api/results/{id}`.

```json
{
  "job_id": "string",
  "status": "completed",
  "input_video": {
    "title": "string",
    "thumbnailUrl": "string (url)",
    "duration": "string (e.g., '19:14')",
    "resolution": "string (e.g., '1080p')",
    "uploadedAt": "string (ISO-8601 timestamp)",
    "platform": "string"
  },
  "fingerprint": {
    "id": "string",
    "framesAnalyzed": "integer",
    "model": "string",
    "createdAt": "string (ISO-8601 timestamp)"
  },
  "risk_summary": {
    "high": "integer",
    "medium": "integer",
    "low": "integer"
  },
  "metrics": [
    {
      "label": "string",
      "value": "string",
      "change": "string (e.g., '+12.4%')",
      "positive": "boolean"
    }
  ],
  "detections": [
    /* Array of Detection Objects */
  ],
  "propagation_nodes": [
    /* Array of Propagation Node Objects */
  ]
}
```

## 8.2 Detection Object
Represents a single flagged candidate video.

```json
{
  "id": "string",
  "title": "string",
  "channel": "string",
  "thumbnailUrl": "string (url)",
  "views": "integer",
  "similarity": "float (0.0 to 1.0)",
  "risk": "string ('high' | 'medium' | 'low')",
  "platform": "string ('youtube' | 'instagram' | 'twitter')",
  "uploadedAt": "string (ISO-8601 timestamp)",
  "duration": "string",
  "url": "string (url)"
}
```

## 8.3 Propagation Node Object
Represents a node in the D3/SVG network graph.

```json
{
  "id": "string (matches a Detection ID, or 'original')",
  "title": "string",
  "views": "integer",
  "risk": "string ('high' | 'medium' | 'low')",
  "similarity": "float (0.0 to 1.0)",
  "x": "float (0 to 100, percentage based layout)",
  "y": "float (0 to 100, percentage based layout)",
  "connections": ["array of strings (IDs of connected child nodes)"]
}
```

## 8.4 Explainability Data
Fetched dynamically or included in the main detection object to feed the `ExplainabilityPanel`.

```json
{
  "detection_id": "string",
  "whyFlagged": [
    "string (Reason 1)",
    "string (Reason 2)"
  ],
  "visualSimilarity": "float (0.0 to 1.0)",
  "metadataSimilarity": "float (0.0 to 1.0)",
  "audioSimilarity": "float (0.0 to 1.0)",
  "confidence": "float (0.0 to 1.0)"
}
```
