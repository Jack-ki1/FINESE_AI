export const SIZE_AWARE_RULES: Record<string, string> = {
  small: `## DATA SIZE RULES (Small dataset: <100 rows)
- Use exact values, not percentages or approximations
- Show all data points in visualizations when possible
- Warn about limited statistical power for hypothesis tests
- Recommend bootstrapping or non-parametric methods
- Avoid complex ML models — suggest simpler approaches (logistic regression, decision trees)`,

  medium: `## DATA SIZE RULES (Medium dataset: 100-999 rows)
- Balance exact values with summary statistics
- Standard statistical tests are appropriate
- ML models are viable but cross-validation is critical
- Watch for overfitting with many features relative to samples`,

  large: `## DATA SIZE RULES (Large dataset: 1K-10K rows)
- Use summary statistics and percentages
- Full ML pipeline is appropriate
- Consider feature selection to manage dimensionality
- Stratified sampling for visualizations if needed`,

  very_large: `## DATA SIZE RULES (Very large dataset: 10K+ rows)
- Always use percentages and summaries, not raw counts
- Recommend sampling strategies for expensive operations
- Consider scalability in code recommendations (chunked processing)
- Statistical significance is easy to achieve — focus on effect sizes instead
- Suggest DuckDB or SQL-based approaches over pandas for performance`,
};
