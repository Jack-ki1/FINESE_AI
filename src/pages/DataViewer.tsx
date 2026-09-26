import { useParams, useNavigate } from 'react-router-dom';
import { useDatumStore } from '@/store/datum.store';
import { AppShell } from '@/components/layout/AppShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-viewer/DataTable';
import { DataVisuals } from '@/components/data-viewer/DataVisuals';
import { DataReport } from '@/components/data-viewer/DataReport';
import { DataUpload } from '@/components/data-viewer/DataUpload';
import { AutoEDA } from '@/components/data-viewer/AutoEDA';
import { DataCleaning } from '@/components/data-viewer/DataCleaning';
import { SqlLab } from '@/components/data-viewer/SqlLab';
import { GoogleSheetsConnector } from '@/components/data-viewer/GoogleSheetsConnector';
import { DatasetHealth } from '@/components/data-viewer/DatasetHealth';
import { WatchManager } from '@/components/data-viewer/WatchManager';
import { WebTableGrab } from '@/components/data-viewer/WebTableGrab';
import { ReportExport } from '@/components/report/ReportExport';
import { ArrowLeft, TableProperties, BarChart3, FileText, Upload, Sparkles, Brush, Database, FileSpreadsheet, FileDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DataViewer() {
  const { view } = useParams<{ view: string }>();
  const navigate = useNavigate();
  const { dataset, transformedDataset, profile, fileName, fileHash, isLoaded } = useDatumStore();

  const isTransformed = view === 'transformed';
  const activeData = isTransformed ? (transformedDataset || dataset) : dataset;

  return (
    <AppShell>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/chat')} className="gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Back to Chat
            </Button>
            <div className="h-5 w-px bg-border" />
            <h1 className="text-lg font-display font-bold text-foreground">
              {isTransformed ? 'Transformed' : 'Original'} Data
            </h1>
            {isLoaded && (
              <span className="text-xs text-muted-foreground ml-2">
                {fileName} — {activeData?.length || 0} rows
              </span>
            )}
          </div>

          {!isLoaded || !activeData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-muted-foreground text-sm mb-4">No dataset loaded yet.</p>
              <DataUpload />
            </div>
          ) : (
            <>
            {profile && <DatasetHealth profile={profile} data={activeData} fileName={fileName} />}
            {profile && fileHash && <WatchManager fileHash={fileHash} fileName={fileName} rows={activeData} profile={profile} />}
            <Tabs defaultValue="table" className="w-full">
              <TabsList className="bg-muted/50 border border-border rounded-xl p-1 mb-6 flex flex-wrap">
                <TabsTrigger value="table" className="gap-2 text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <TableProperties className="w-3.5 h-3.5" /> Table
                </TabsTrigger>
                <TabsTrigger value="visuals" className="gap-2 text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <BarChart3 className="w-3.5 h-3.5" /> Visuals
                </TabsTrigger>
                <TabsTrigger value="eda" className="gap-2 text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" /> Auto-EDA
                </TabsTrigger>
                <TabsTrigger value="clean" className="gap-2 text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Brush className="w-3.5 h-3.5" /> Clean
                </TabsTrigger>
                <TabsTrigger value="sql" className="gap-2 text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Database className="w-3.5 h-3.5" /> SQL Lab
                </TabsTrigger>
                <TabsTrigger value="report" className="gap-2 text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <FileText className="w-3.5 h-3.5" /> Report
                </TabsTrigger>
                <TabsTrigger value="sheets" className="gap-2 text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Sheets
                </TabsTrigger>
                <TabsTrigger value="web" className="gap-2 text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Globe className="w-3.5 h-3.5" /> Web table
                </TabsTrigger>
                <TabsTrigger value="export" className="gap-2 text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <FileDown className="w-3.5 h-3.5" /> Export
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2 text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Upload className="w-3.5 h-3.5" /> Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="table">
                <DataTable data={activeData} />
              </TabsContent>
              <TabsContent value="visuals">
                <DataVisuals data={activeData} profile={profile!} />
              </TabsContent>
              <TabsContent value="eda">
                <AutoEDA data={activeData} profile={profile!} fileName={fileName} />
              </TabsContent>
              <TabsContent value="clean">
                <DataCleaning data={activeData} profile={profile!} />
              </TabsContent>
              <TabsContent value="sql">
                <SqlLab />
              </TabsContent>
              <TabsContent value="report">
                <DataReport data={activeData} profile={profile!} fileName={fileName} />
              </TabsContent>
              <TabsContent value="sheets">
                <GoogleSheetsConnector />
              </TabsContent>
              <TabsContent value="web">
                <WebTableGrab />
              </TabsContent>
              <TabsContent value="export">
                <ReportExport />
              </TabsContent>
              <TabsContent value="upload">
                <DataUpload />
              </TabsContent>
            </Tabs>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
