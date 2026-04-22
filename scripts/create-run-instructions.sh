#!/bin/bash
# Creates HOW-TO-RUN.txt for macOS artifacts

cat > "HOW-TO-RUN.txt" << 'EOF'
=== CutDeck macOS Installation Instructions ===

Because CutDeck is not signed with an Apple Developer certificate,
you must explicitly allow it to run on your Mac:

METHOD 1 — Easiest (Recommended):
1. Right-click on CutDeck.app
2. Select "Open" from the context menu
3. macOS will show a warning popup
4. Click "Open Anyway"
5. CutDeck will launch ✅

METHOD 2 — Terminal:
1. Open Terminal (Applications → Utilities → Terminal)
2. Copy and paste this command:
   sudo xattr -rd com.apple.quarantine "/Applications/CutDeck.app"
3. Press Enter, enter your password when prompted
4. Launch CutDeck from Applications normally

METHOD 3 — System Settings:
1. Try to open CutDeck (double-click)
2. Go to System Settings → Privacy & Security
3. Scroll down to "Security policy" section
4. Click "Open Anyway" next to CutDeck
5. Launch CutDeck again

For more help: https://github.com/Agions/CutDeck/releases
EOF
echo "Created HOW-TO-RUN.txt"