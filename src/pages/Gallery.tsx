import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
const items = [
  { title: "Sales — what drives revenue?", desc: "Group-by region + correlation + regression, all verified, Evidence Rail shows 3 tool calls.", badge: "3 verified", tag: "B2B sales" },
  { title: "HR attrition risk model", desc: "Naive Bayes vs Random Forest on 100×5 benchmark — real holdout accuracy + permutation importance.", badge: "2 verified models", tag: "HR" },
  { title: "Time-series forecast of weekly signups", desc: "Holt linear forecast with MAE/RMSE, verified receipt export.", badge: "Verified forecast", tag: "Growth" },
];
export default function Gallery() {
  const nav = useNavigate();
  return (
    <div className="flex-1 overflow-auto p-6"><div className="max-w-5xl mx-auto space-y-6">
      <div><h1 className="text-xl font-bold">Public Gallery — Verified Analyses</h1><p className="text-xs text-muted-foreground">Opt-in, anonymized sessions showing the Evidence Rail live. The whole point is the receipts.</p></div>
      <div className="grid md:grid-cols-3 gap-4">
        {items.map(it=>(
          <Card key={it.title} className="hover:shadow-md transition-shadow">
            <CardHeader><CardTitle className="text-sm">{it.title}</CardTitle><CardDescription className="text-xs">{it.desc}</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-verified/10 text-verified border border-verified/20">{it.badge}</span>
              <p className="text-xs text-muted-foreground">Load the 100×5 sample and ask the same question to reproduce.</p>
              <Button size="sm" variant="outline" onClick={()=>nav("/chat")}>Try it</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div></div>
  );
}
