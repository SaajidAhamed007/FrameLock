"""
AI-Based Video Similarity Detection — Proof of Concept
=======================================================

CLI entry point for the video similarity detection system.

Usage:
    python main.py <youtube_url> [--frames N] [--threshold T] [--candidates C]

Example:
    python main.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --frames 3 --threshold 0.85
"""

import argparse
import io
import sys
import time

# Fix Windows console encoding for Unicode output
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from src.analyzer import Analyzer


def print_banner():
    """Print a styled banner for the application."""
    banner = """
+==============================================================+
|         AI Video Similarity Detector                         |
|              Proof of Concept v1.0                           |
+==============================================================+
    """
    print(banner)


def print_results(results: dict):
    """
    Display the analysis results in a formatted table.

    Args:
        results: The results dict from Analyzer.run()
    """
    print("\n" + "=" * 66)
    print("                       📊  RESULTS")
    print("=" * 66)

    input_video = results.get("input_video", {})
    if input_video:
        print(f"\n  Input Video : {input_video.get('title', 'N/A')}")
        print(f"  URL         : {input_video.get('url', 'N/A')}")
        print(f"  Frames Used : {results.get('n_frames', 'N/A')}")
        print(f"  Threshold   : {results.get('threshold', 'N/A')}")

    candidates = results.get("candidates", [])
    matches = results.get("matches", [])

    if not candidates:
        print("\n  ⚠️  No candidates were processed.")
        return

    print(f"\n  Candidates Analyzed: {len(candidates)}")
    print(f"  Matches Found     : {len(matches)}")

    # Display all candidates
    print("\n" + "-" * 66)
    print(f"  {'#':<4} {'Score':<10} {'Match':<8} {'Title'}")
    print("-" * 66)

    for i, c in enumerate(candidates, 1):
        match_flag = "🔴 YES" if c["is_match"] else "⚪ no"
        title = c["title"][:45] + "..." if len(c["title"]) > 45 else c["title"]
        print(f"  {i:<4} {c['max_similarity']:<10.4f} {match_flag:<8} {title}")

    # Highlight matches
    if matches:
        print("\n" + "=" * 66)
        print("                    🔴  MATCHES DETECTED")
        print("=" * 66)
        for m in matches:
            print(f"\n  📌 {m['title']}")
            print(f"     URL          : {m['url']}")
            print(f"     Max Similarity: {m['max_similarity']:.4f}")
            print(f"     Avg Similarity: {m['avg_similarity']:.4f}")
    else:
        print(f"\n  ✅ No matches above threshold ({results['threshold']}).")

    print("\n" + "=" * 66)


def main():
    """Main entry point."""
    print_banner()

    parser = argparse.ArgumentParser(
        description="AI-Based Video Similarity Detection (POC)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py "https://www.youtube.com/watch?v=VIDEO_ID"
  python main.py "https://youtu.be/VIDEO_ID" --frames 5 --threshold 0.80
        """,
    )
    parser.add_argument(
        "url",
        type=str,
        help="YouTube video URL to analyze",
    )
    parser.add_argument(
        "--frames",
        type=int,
        default=3,
        help="Number of frames to extract (default: 3, range: 1-5 recommended)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.85,
        help="Similarity threshold for match detection (default: 0.85)",
    )
    parser.add_argument(
        "--candidates",
        type=int,
        default=10,
        help="Maximum number of candidate videos to compare (default: 10)",
    )
    parser.add_argument(
        "--candidate-frames",
        "-m",
        type=int,
        default=0,
        help="Number of frames to extract for candidates in addition to thumbnail (default: 0)",
    )

    args = parser.parse_args()

    # Validate inputs
    if args.frames < 1 or args.frames > 10:
        print("Error: --frames must be between 1 and 10.")
        sys.exit(1)
    if args.threshold < 0.0 or args.threshold > 1.0:
        print("Error: --threshold must be between 0.0 and 1.0.")
        sys.exit(1)
    if args.candidates < 1 or args.candidates > 50:
        print("Error: --candidates must be between 1 and 50.")
        sys.exit(1)
    if args.candidate_frames < 0 or args.candidate_frames > 10:
        print("Error: --candidate-frames must be between 0 and 10.")
        sys.exit(1)

    print(f"  Configuration:")
    print(f"    URL              : {args.url}")
    print(f"    Input Frames     : {args.frames}")
    print(f"    Candidate Frames : {args.candidate_frames}")
    print(f"    Threshold        : {args.threshold}")
    print(f"    Candidates       : {args.candidates}")

    # Run analysis
    start_time = time.time()

    analyzer = Analyzer(
        n_frames=args.frames,
        m_frames=args.candidate_frames,
        threshold=args.threshold,
        max_candidates=args.candidates,
    )

    results = analyzer.run(args.url)

    elapsed = time.time() - start_time

    # Display results
    print_results(results)
    print(f"\n  ⏱️  Total execution time: {elapsed:.2f}s")
    print()


if __name__ == "__main__":
    main()
