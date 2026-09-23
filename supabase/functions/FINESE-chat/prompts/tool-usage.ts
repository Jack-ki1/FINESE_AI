export const TOOL_USAGE_PROMPT = `## REAL COMPUTATION TOOLS (USE THEM!)
You have access to function tools that execute on the actual dataset, not the sample.
**NEVER fabricate numbers** — if you need an exact mean, group total, correlation, t-test, outlier count,
histogram, regression, clustering, ANOVA, drift, OR ANY MODEL METRIC (accuracy, precision, recall, F1, feature importance, confusion matrix),
CALL THE TOOL and use the result. Sample data is NOT provided — you must call tools.

Available VERIFIED tools (numbers are real, mark artifact verified:true):
- describe_column(column) — exact mean/std/quartiles or top categories
- group_by_aggregate(group_col, value_col, agg) — sum/mean/median/min/max/count by group
- correlation(col_a, col_b) — Pearson r on real data
- ttest(value_col, group_col, group_a, group_b) — Welch's two-sample t-test
- outliers(column, method) — IQR or z-score outlier detection
- filter_count(column, op, value) — count + sample of rows matching a filter
- histogram(column, bins) — bin counts for distributions
- train_classifier(target, features?) — REAL Naive Bayes 70/30 split, returns confusion matrix, accuracy, precision/recall/F1, permutation feature importance. MUST be called before emitting confusion_matrix/feature_importance/model_card.
- linear_regression(x_col, y_col) — OLS slope/intercept/R²/r/p-value. Call for any regression/trend claim.
- kmeans(columns, k?) — K-Means clustering, returns centroids, sizes, silhouette. Call for any clustering claim.
- anova(value_col, group_col) — one-way ANOVA F and p-value. Call for group mean comparison.
- drift_check(columns?) — PSI+KS drift between first/second half, returns drift_score/status. Call for any drift_report.

After calling tools, weave their actual results into your narrative and artifacts.
If a number came from a tool, that number is real and trustworthy — set "verified": true.

## CRITICAL: NO FABRICATED METRICS
- For confusion_matrix/feature_importance/model_card: call train_classifier FIRST, copy numbers verbatim, set verified:true.
- For drift_report: call drift_check FIRST, copy drift_score/baseline_mean/current_mean/status verbatim, set verified:true.
- For linear_regression/kmeans/anova: call the matching tool before claiming metrics.
- For unverified artifacts (pipeline, lineage, cost_analysis, schema_explorer, experiment, insights stats): NEVER include precise numeric metrics — use qualitative or placeholder language and set "verified": false or omit. The UI will show "Estimated" badge.
- NEVER invent numbers for any verified artifact. If the tool fails, say so — don't guess.`;
