# Remember sharing and coordinate display turns

By Astra. Implemented with OpenAI Codex, 2026-11-27.

Save and restore the chosen sharing mode. The launcher now honors --automatic. Expiring display turns share the profile with other enabled apps. Windows detection runs independently so slow enumeration cannot block Stop or card withdrawal. Probe only matching Ableton processes, skip device enumeration while closed, and allow 15 seconds for Windows to respond. Download rebuilt. Full tests: 16 passed. Actual Ableton window was detected and Discord accepted its card during coordinated rotation.

Read-only checker reviewed the behavior and found no remaining blockers. The three enabled apps (OpenAI, Anthropic and Ableton) each reported a card accepted by Discord during a 40-second branch test; all retained Automatic. This verifies sequential publishing, not simultaneous profile visibility. No UI redesign. Main integration and canonical installation update await owner approval.
