export const TOOL_DEFS = [
  {
    type: "function",
    function: {
      name: "describe_column",
      description: "Compute exact descriptive stats for one column (mean, std, quartiles, or top categories).",
      parameters: { type: "object", properties: { column: { type: "string" } }, required: ["column"] },
    },
  },
  {
    type: "function",
    function: {
      name: "group_by_aggregate",
      description: "Group rows by group_col and aggregate value_col with sum/mean/median/min/max/count.",
      parameters: {
        type: "object",
        properties: {
          group_col: { type: "string" },
          value_col: { type: "string" },
          agg: { type: "string", enum: ["sum", "mean", "median", "min", "max", "count"] },
        },
        required: ["group_col", "value_col", "agg"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "correlation",
      description: "Compute Pearson correlation between two numeric columns on the real data.",
      parameters: {
        type: "object",
        properties: { col_a: { type: "string" }, col_b: { type: "string" } },
        required: ["col_a", "col_b"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ttest",
      description: "Welch's two-sample t-test on value_col between two groups in group_col.",
      parameters: {
        type: "object",
        properties: {
          value_col: { type: "string" },
          group_col: { type: "string" },
          group_a: { type: "string" },
          group_b: { type: "string" },
        },
        required: ["value_col", "group_col", "group_a", "group_b"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "outliers",
      description: "Detect outliers in a numeric column via IQR or z-score method.",
      parameters: {
        type: "object",
        properties: {
          column: { type: "string" },
          method: { type: "string", enum: ["iqr", "zscore"] },
        },
        required: ["column"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "filter_count",
      description: "Count rows matching a filter and return a sample.",
      parameters: {
        type: "object",
        properties: {
          column: { type: "string" },
          op: { type: "string", enum: ["eq", "neq", "gt", "gte", "lt", "lte", "contains"] },
          value: {},
        },
        required: ["column", "op", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "histogram",
      description: "Compute histogram bins for a numeric column.",
      parameters: {
        type: "object",
        properties: { column: { type: "string" }, bins: { type: "number" } },
        required: ["column"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "train_classifier",
      description:
        "Trains a real classifier (Naive Bayes) on a 70/30 train/test split. Returns REAL accuracy, confusion matrix, per-class precision/recall/F1, and permutation feature importance. ALWAYS call this for any model_card, confusion_matrix, or feature_importance artifact — never fabricate model metrics.",
      parameters: {
        type: "object",
        properties: {
          target: { type: "string", description: "Column to predict" },
          features: {
            type: "array",
            items: { type: "string" },
            description: "Feature columns (omit to auto-pick all non-target columns)",
          },
        },
        required: ["target"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "linear_regression",
      description: "Fit OLS linear regression y ~ x. Returns slope, intercept, R², Pearson r, t-stat, p-value. Call for any regression or trend claim.",
      parameters: {
        type: "object",
        properties: {
          x_col: { type: "string" },
          y_col: { type: "string" },
        },
        required: ["x_col", "y_col"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "kmeans",
      description: "Run real K-Means clustering on numeric columns. Returns centroids, cluster sizes, silhouette score. Call before emitting clustering claims.",
      parameters: {
        type: "object",
        properties: {
          columns: { type: "array", items: { type: "string" } },
          k: { type: "number", description: "number of clusters (2-10)" },
        },
        required: ["columns"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "anova",
      description: "One-way ANOVA: test if value_col means differ across groups in group_col. Returns F, p-value, group means.",
      parameters: {
        type: "object",
        properties: {
          value_col: { type: "string" },
          group_col: { type: "string" },
        },
        required: ["value_col", "group_col"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "drift_check",
      description: "Real drift detection between first-half vs second-half of dataset. Returns PSI, KS, drift_score, status per column. Call for any drift_report artifact.",
      parameters: {
        type: "object",
        properties: {
          columns: { type: "array", items: { type: "string" }, description: "Columns to check (omit to auto-pick numeric)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "pca",
      description: "Real PCA on numeric columns (correlation matrix + power iteration + deflation). Returns eigenvalues, explained_ratio, cumulative, loadings (eigenvectors), projected_sample. Call for dimensionality-reduction or variance-explained claims.",
      parameters: {
        type: "object",
        properties: {
          columns: { type: "array", items: { type: "string" }, description: "Numeric columns to include" },
          n_components: { type: "number", description: "Number of components (default 3, max columns)" },
        },
        required: ["columns"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "forecast",
      description: "Holt linear-trend forecast on a numeric column (optionally sorted by date_col). Returns forecasts, MAE/RMSE/MAPE, last level/trend. Call for any time-series prediction.",
      parameters: {
        type: "object",
        properties: {
          value_col: { type: "string" },
          date_col: { type: "string", description: "Optional datetime column to sort by" },
          periods: { type: "number", description: "Periods to forecast (1-50, default 6)" },
        },
        required: ["value_col"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "random_forest",
      description: "Real bagged-tree ensemble (bootstrap + CART, sqrt(p) split sampling). Returns REAL holdout accuracy, confusion matrix, permutation importance. Use when user wants an ensemble or comparison to Naive Bayes.",
      parameters: {
        type: "object",
        properties: {
          target_col: { type: "string" },
          feature_cols: { type: "array", items: { type: "string" } },
          n_trees: { type: "number", description: "Trees (5-50, default 15)" },
          max_depth: { type: "number", description: "Max depth 2-6 (default 4)" },
        },
        required: ["target_col"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "semantic_metric",
      description: "Evaluate a user-defined derived metric (e.g. 'revenue - cost') row-wise and return its distribution. Check metric_definitions first: if the user defined 'profit = revenue - cost', use semantic_metric with metric_name='profit' before inventing a formula.",
      parameters: {
        type: "object",
        properties: {
          metric_name: { type: "string", description: "Stored metric name (from metric_definitions)" },
          expression: { type: "string", description: "Or a raw arithmetic expression over column names, e.g. 'revenue - cost'" },
          description: { type: "string" },
        },
        required: [],
      },
    },
  },
];
