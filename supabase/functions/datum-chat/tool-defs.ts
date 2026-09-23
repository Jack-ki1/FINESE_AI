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
];
