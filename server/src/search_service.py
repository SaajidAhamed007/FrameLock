"""
Search Module
- Retrieves candidate videos from YouTube based on the input video's title
- Uses yt-dlp's search functionality (no API key required)
"""

import yt_dlp


class SearchService:
    """Searches YouTube for candidate videos to compare against."""

    def __init__(self, max_results: int = 10):
        """
        Initialize SearchService.

        Args:
            max_results: Maximum number of candidate videos to retrieve.
        """
        self.max_results = max_results

    def search_videos(self, query: str) -> list:
        """
        Search YouTube for videos matching the query.

        Args:
            query: Search query string (typically the input video's title).

        Returns:
            List of dicts with keys: 'id', 'title', 'url', 'thumbnail_url'
        """
        search_url = f"ytsearch{self.max_results}:{query}"

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": True,
            "skip_download": True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                result = ydl.extract_info(search_url, download=False)

            candidates = []
            entries = result.get("entries", [])

            for entry in entries:
                if entry is None:
                    continue

                video_id = entry.get("id", "")
                title = entry.get("title", "Unknown")

                # YouTube thumbnail URL pattern
                thumbnail_url = entry.get("thumbnail") or entry.get("thumbnails", [{}])[0].get("url", "")
                if not thumbnail_url and video_id:
                    thumbnail_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"

                candidates.append({
                    "id": video_id,
                    "title": title,
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "thumbnail_url": thumbnail_url,
                })

            print(f"  ✓ Found {len(candidates)} candidate videos")
            return candidates

        except Exception as e:
            print(f"  ✗ Search failed: {e}")
            return []
