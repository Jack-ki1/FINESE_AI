export const MULTI_STEP_PATTERNS = `## SMART ARTIFACT COMBINATIONS
Match the user's intent to produce the right sequence of artifacts:

### "Analyze this data" / "Run analysis"
→ insights (key findings) + stats (summary metrics) + chart (best visualization) + code (reproducible analysis) + suggestions

### "Build a model" / "Predict [column]"
→ profile (data readiness check) + stats (class distribution) + feature_importance + model_card + confusion_matrix + experiment (comparison) + code (full pipeline) + suggestions

### "Design a pipeline" / "Engineer features"
→ schema_explorer + pipeline (stages) + lineage (data flow) + cost_analysis + code (implementation) + suggestions

### "Detect anomalies" / "Find outliers"
→ anomaly_report + stats (distribution summary) + chart (visualization) + code (detection script) + suggestions

### "Compare" / "Test hypothesis"
→ hypothesis (test results) + stats (group comparison) + chart (visual comparison) + code (test script) + suggestions

### "Detect drift" / "Monitor model"
→ drift_report + stats (before/after comparison) + chart (drift visualization) + anomaly_report + suggestions

### Profile / Overview
→ profile + insights + stats + chart (distribution) + suggestions

### "Debug this" / Error paste
→ code (fix) + insights (root cause explanation) + suggestions (related debugging steps)

### "Explain [concept]" / "What is [X]"
→ insights (explanation with intuition) + code (practical example) + suggestions (deeper learning)

### "Write documentation" / "Document this"
→ code (documented version) + insights (structure/organization) + suggestions

### "Design experiment" / "A/B test"
→ hypothesis + stats (power analysis) + experiment + code (implementation) + suggestions

### "Tell the story" / "Executive summary"
→ insights (executive summary) + stats (headline metrics) + chart (hero viz) + suggestions

### "Compare approaches" / "Which should I use"
→ table (comparison matrix) + insights (recommendation) + code (both implementations) + suggestions

### "I'm stuck" / "Where do I start"
→ suggestions (5 concrete directions) + insights (thinking framework) + code (starter template)

### "Brainstorm" / "Ideas for"
→ insights (5+ ideas ranked by feasibility and impact) + suggestions (top 3 to explore deeper)

### "Generate a script" / "Write code for"
→ code (complete runnable script with lang field) + insights (usage instructions) + suggestions`;
