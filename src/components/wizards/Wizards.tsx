import { useState } from "react";
import { useDatumStore } from "@/store/datum.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search, TrendingUp, Sparkles, GitCompare, FileText, Wand2 } from "lucide-react";

type WizardId = "driver" | "predict" | "clean" | "compare" | "report";
const wizards = [
  { id: "driver" as WizardId, title: "Find what is driving a number", icon: Search, desc: "Pick a metric + dimension — we run group-by, correlation, and a regression." },
  { id: "predict" as WizardId, title: "Predict an outcome", icon: TrendingUp, desc: "Choose a target column — we train Naive Bayes + Random Forest and compare." },
  { id: "clean" as WizardId, title: "Clean this file", icon: Sparkles, desc: "Profile missing, outliers, dupes — one-click cleaning preview." },
  { id: "compare" as WizardId, title: "Compare two segments", icon: GitCompare, desc: "t-test / ANOVA between groups, with verified p-values." },
  { id: "report" as WizardId, title: "Build a report for stakeholders", icon: FileText, desc: "Pick verified artifacts and export a stamped PDF." },
];

export function WizardsPanel() {
  const { profile, sendMessage } = useDatumStore();
  const [open, setOpen] = useState<WizardId | null>(null);
  const cols = profile?.map(p=>p.col) || [];
  const [target, setTarget] = useState(cols[0]||"");
  const [group, setGroup] = useState(cols[0]||"");
  const [value, setValue] = useState(cols[0]||"");

  const run = (prompt: string) => { setOpen(null); sendMessage(prompt); };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide"><Wand2 className="w-3.5 h-3.5"/> Wizards — guided, same verified tools</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {wizards.map(w=>(
          <button key={w.id} onClick={()=>setOpen(w.id)} className="text-left p-3 rounded-xl border bg-card hover:bg-muted/50">
            <div className="flex items-center gap-2"><w.icon className="w-4 h-4 text-primary"/><span className="text-sm font-medium">{w.title}</span></div>
            <p className="text-xs text-muted-foreground mt-1">{w.desc}</p>
          </button>
        ))}
      </div>
      {open==="driver" && (
        <Card><CardHeader><CardTitle className="text-sm">Find driver</CardTitle></CardHeader><CardContent className="space-y-3">
          <div><Label className="text-xs">Metric (numeric)</Label><Input value={value} onChange={e=>setValue(e.target.value)} placeholder="revenue" className="h-8 font-mono text-xs"/></div>
          <div><Label className="text-xs">Split by (categorical)</Label><Input value={group} onChange={e=>setGroup(e.target.value)} placeholder="region" className="h-8 font-mono text-xs"/></div>
          <Button size="sm" onClick={()=>run(`What is driving ${value}? Compare ${value} by ${group}: run group_by_aggregate (${group}, ${value}, mean), correlation with other numeric columns, and linear_regression if relevant. Use verified tools only.`)}>Run driver analysis</Button>
        </CardContent></Card>
      )}
      {open==="predict" && (
        <Card><CardHeader><CardTitle className="text-sm">Predict outcome</CardTitle></CardHeader><CardContent className="space-y-3">
          <div><Label className="text-xs">Target column</Label><Input value={target} onChange={e=>setTarget(e.target.value)} placeholder="performance" className="h-8 font-mono text-xs"/></div>
          <Button size="sm" onClick={()=>run(`Predict ${target}: train both train_classifier and random_forest on target ${target}, compare accuracy and permutation importance, and explain which features matter. Use verified tools.`)}>Train + compare models</Button>
        </CardContent></Card>
      )}
      {open==="clean" && (
        <Card><CardHeader><CardTitle className="text-sm">Clean file</CardTitle></CardHeader><CardContent className="space-y-2">
          <Button size="sm" onClick={()=>run(`Profile and clean this dataset: show missing counts, outliers via outliers tool, duplicated rows estimate, and propose a cleaning plan. Then show the cleaned preview.`)}>Profile & propose cleaning</Button>
        </CardContent></Card>
      )}
      {open==="compare" && (
        <Card><CardHeader><CardTitle className="text-sm">Compare segments</CardTitle></CardHeader><CardContent className="space-y-3">
          <div><Label className="text-xs">Value column</Label><Input value={value} onChange={e=>setValue(e.target.value)} className="h-8 font-mono text-xs"/></div>
          <div><Label className="text-xs">Group column</Label><Input value={group} onChange={e=>setGroup(e.target.value)} className="h-8 font-mono text-xs"/></div>
          <Button size="sm" onClick={()=>run(`Compare ${value} across ${group}: run ttest if 2 groups else anova, report group means, p-value, and effect size. Use verified tools.`)}>Run comparison</Button>
        </CardContent></Card>
      )}
      {open==="report" && (
        <Card><CardHeader><CardTitle className="text-sm">Build report</CardTitle></CardHeader><CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Generate a narrative story from the last verified artifacts, then export a stamped PDF (verified count).</p>
          <Button size="sm" onClick={()=>run(`Turn the last verified results into a stakeholder report: executive summary, key findings (with verified numbers only), methods, and next steps. Mark unverified claims as Estimated.`)}>Draft report in chat</Button>
        </CardContent></Card>
      )}
    </div>
  );
}
