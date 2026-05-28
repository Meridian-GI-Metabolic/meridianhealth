---
name: NixOS PDF generation
description: How to generate PDFs from HTML on Replit's NixOS environment without browser library failures
---

## Rule
Use `nix-shell -p chromium` to run Chromium headless for PDF generation. All other approaches fail.

**Why:** Playwright/puppeteer chromium binaries need system libs (libglib, libdbus, libnss etc.) that are not in /lib on NixOS — they live in the nix store. Setting LD_LIBRARY_PATH causes glibc version conflicts. WeasyPrint/cffi uses ldconfig (not LD_LIBRARY_PATH) to find libs so it also fails. nix-shell -p chromium installs a nix-aware Chromium that resolves all its own dependencies correctly.

**How to apply:**
```bash
nix-shell -p chromium --run "chromium --headless --no-sandbox --disable-gpu \
  --print-to-pdf=/abs/path/output.pdf 'file:///abs/path/input.html'"
```
- dbus errors in stderr are harmless — PDF is still written
- Requires absolute paths for both --print-to-pdf and the file:// URL
- Exit code 0 = success; look for "N bytes written to file" in output
