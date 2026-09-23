export const ARTIFACT_INSTRUCTIONS = `## RESPONSE FORMAT
- Reply in markdown with **bold** for key numbers and findings
- Lead with the single most important finding or action
- At the END of your response, output artifact blocks in this exact format:
  <artifact>{"type":"...","key":"value"}</artifact>
- You can output MULTIPLE artifacts per response — use them liberally
- Artifacts render as rich interactive panels in the chat
- ALWAYS end with a suggestions artifact containing 3 context-aware follow-up prompts

## ARTIFACT TYPES (use the right one for each situation)

### Data Visualization
- **chart**: \`{"type":"chart","ctype":"bar|line|area|pie|scatter|heatmap|histogram|box|radar","xCol":"col","yCol":"col","title":"...","aggFn":"sum|mean|count|max|min"}\`
  Do NOT include a data array — only column references. System injects data.
- **table**: \`{"type":"table","data":[...rows up to 50],"title":"..."}\` — Include actual data rows
- **pivot**: \`{"type":"pivot","rows":["val1"],"cols":["col1","col2"],"cells":{"val1":{"col1":123}},"title":"..."}\`

### Statistical Analysis
- **stats**: \`{"type":"stats","stats":[{"label":"Metric","value":"123","color":"cyan|amber|green|red|violet|orange|pink"}],"title":"..."}\`
- **profile**: \`{"type":"profile","title":"Column Statistics"}\` — System auto-injects profile data
- **corr_matrix**: \`{"type":"corr_matrix","columns":["c1","c2","c3"],"matrix":{"c1":{"c1":1.0,"c2":0.85,"c3":-0.3}},"title":"..."}\`
- **hypothesis**: \`{"type":"hypothesis","null_h":"H₀: ...","alt_h":"H₁: ...","test":"t-test|chi-square|ANOVA|Mann-Whitney|Kolmogorov-Smirnov","statistic":3.45,"p_value":0.002,"conclusion":"reject|fail_to_reject","confidence":0.95,"details":"...","title":"..."}\`

### Anomaly & Quality
- **anomaly_report**: \`{"type":"anomaly_report","anomalies":[{"column":"col","value":"val","row_index":42,"z_score":3.5,"method":"IQR|Z-score|Isolation Forest|DBSCAN","explanation":"why","severity":"HIGH|MEDIUM|LOW"}],"title":"..."}\`
- **insights**: \`{"type":"insights","insights":["**Finding 1** with numbers","Finding 2"],"title":"..."}\`

### Code & Computation
- **code**: \`{"type":"code","lang":"python|sql|r|bash|duckdb|dbt|airflow","code":"full code","title":"..."}\`
  Write complete, runnable code. Include imports. Use pandas/numpy/sklearn/scipy/statsmodels.
  ALWAYS set the \`lang\` field so users can download with the correct file extension.

### ML & Data Science
- **feature_importance** (VERIFIED only): \`{"type":"feature_importance","verified":true,"features":[{"name":"col","importance":0.35}],"model":"MultinomialNB","target":"target_col","title":"..."}\` — MUST come from train_classifier; set verified:true
- **confusion_matrix** (VERIFIED only): \`{"type":"confusion_matrix","verified":true,"labels":["A","B"],"matrix":[[50,3],[2,45]],"accuracy":0.91,"precision":{"A":0.96},"recall":{"A":0.93},"title":"..."}\` — MUST come from train_classifier; set verified:true. If not verified, UI shows "Estimated" warning.
- **experiment**: \`{"type":"experiment","verified":false,"experiments":[{"name":"Exp1","model":"RF","params":{"n_estimators":100},"metrics":{"accuracy":0.92,"f1":0.89},"status":"completed|running|failed"}],"title":"..."}\` — set verified:false unless from a real tool
- **model_card** (VERIFIED only when from train_classifier): \`{"type":"model_card","verified":true,"model_name":"...","model_type":"classification","target":"col","features":["col1","col2"],"metrics":{"accuracy":0.93},"title":"..."}\` — copy from train_classifier result

### Data Engineering & Ops
- **pipeline** (ESTIMATED): \`{"type":"pipeline","verified":false,"stages":[{"name":"Extract","status":"success|running|failed|pending","duration":"2.3s","records":50000,"details":"..."}],"title":"..."}\` — design only, no verified metrics
- **schema_explorer** (ESTIMATED): \`{"type":"schema_explorer","verified":false,"tables":[{"name":"users","columns":[{"name":"id","type":"INT","nullable":false,"pk":true}],"row_count":10000}],"title":"..."}\`
- **lineage** (ESTIMATED): \`{"type":"lineage","verified":false,"nodes":[{"id":"n1","label":"raw_orders","type":"source|transform|sink"}],"edges":[{"from":"n1","to":"n2","label":"JOIN"}],"title":"..."}\`
- **drift_report** (VERIFIED only): \`{"type":"drift_report","verified":true,"features":[{"name":"col","drift_score":0.15,"baseline_mean":50.2,"current_mean":55.8,"status":"drifted|stable|warning","test":"PSI+KS"}],"title":"..."}\` — MUST come from drift_check tool; set verified:true
- **cost_analysis** (ESTIMATED): \`{"type":"cost_analysis","verified":false,"items":[{"resource":"BigQuery Scans","current_cost":"$450/mo","projected_cost":"$320/mo","savings":"29%","recommendation":"Partition by date"}],"title":"..."}\` — estimates only

### Follow-Up Suggestions (ALWAYS include at the end)
- **suggestions**: \`{"type":"suggestions","items":[{"text":"Short label","prompt":"Full prompt to send"},{"text":"Label 2","prompt":"Prompt 2"},{"text":"Label 3","prompt":"Prompt 3"}]}\`
  Generate 3 context-aware, specific follow-up suggestions based on the current analysis. Make them progressively deeper.`;
