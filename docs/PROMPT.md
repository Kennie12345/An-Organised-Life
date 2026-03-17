#What This is:
A reusable session start prompt for the user to start a new claude session. This is a metatask and should not be modified by Claude Code, unless explicitly asked to. 

#PROMPT:
`
  Start a new working session on the An Organised Life project.

  1. Read /project/CURRENT_STATE.md
  2. Read /project/TASKS.md — find the current phase, locate the next uncompleted task
  3. Read the docs listed under that phase's "Docs to read" header

  Then tell me in 3 lines:
  - What phase we are in
  - What the next task is
  - What you are about to do

  Then begin. Stop at any ✋ and wait for me.
`