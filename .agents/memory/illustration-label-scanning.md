---
name: Illustration label pixel scanning
description: How to reliably locate and erase AI-baked text labels in the Meridian brand illustrations
---

In the Meridian medical illustrations, AI-generated text labels always follow this structure:
- A POINTER ARROW runs from the anatomy structure toward the label text.
- The pointer occupies the TOP portion of the label's dark-pixel bounding box.
- The actual text CHARACTERS sit at the BOTTOM of the bounding box.

**Why:** The labels are rendered by the AI model with the anatomy pointer drawn first, then the text appended below, so a broad bbox scan captures the full arrow-to-text range. Naive bbox-top erase coordinates only clear the arrow shaft, leaving the text untouched.

**How to apply:**
1. Never assume the text is at the top of the bbox.
2. Use a row-by-row pixel-density scan (count dark pixels per row, threshold~155) across the FULL image height to find the exact rows where character density spikes (usually 30+ dark pixels).
3. Erase precisely from a few rows above the first spike to a few rows below the last spike.
4. After erasing, confirm with a follow-up scan that no high-density rows remain in that x-column.

The treatment-care image (1408x768) has a second label row at y~556-618 (not y~490 where the circles sit). Condition-hiatus "Esophagm" label characters were at y=588-601 even though the full bbox extended up to y=390.
