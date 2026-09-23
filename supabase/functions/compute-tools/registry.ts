import describeColumn from "./tools/describe-column.ts";
import groupByAggregate from "./tools/group-by-aggregate.ts";
import correlation from "./tools/correlation.ts";
import ttest from "./tools/ttest.ts";
import outliers from "./tools/outliers.ts";
import filterCount from "./tools/filter-count.ts";
import histogram from "./tools/histogram.ts";
import trainClassifier from "./tools/train-classifier.ts";
import linearRegression from "./tools/linear-regression.ts";
import kmeans from "./tools/kmeans.ts";
import anova from "./tools/anova.ts";
import driftCheck from "./tools/drift-check.ts";

export const TOOLS: Record<string, (args: any, data: any[]) => any> = {
  describe_column: describeColumn,
  group_by_aggregate: groupByAggregate,
  correlation,
  ttest,
  outliers,
  filter_count: filterCount,
  histogram,
  train_classifier: trainClassifier,
  linear_regression: linearRegression,
  kmeans,
  anova,
  drift_check: driftCheck,
};
