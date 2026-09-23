export default function filterCount(args: any, data: any[]) {
  const { column, op, value } = args;
  const v = isNaN(Number(value)) ? value : Number(value);
  const matched = data.filter((r) => {
    const x = isNaN(Number(r[column])) ? r[column] : Number(r[column]);
    switch (op) {
      case "eq": return x === v;
      case "neq": return x !== v;
      case "gt": return x > v;
      case "gte": return x >= v;
      case "lt": return x < v;
      case "lte": return x <= v;
      case "contains": return String(x).includes(String(v));
      default: return false;
    }
  });
  return { n_matched: matched.length, total: data.length, sample: matched.slice(0, 10) };
}
