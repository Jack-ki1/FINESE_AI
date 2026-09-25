# FINESE AI - Chat-First Data Intelligence Platform

**FINESE AI** is an advanced, chat-first data intelligence platform that enables data professionals to analyze datasets, build machine learning models, and gain insights through natural language conversation. Built with modern web technologies and powered by AI tool-calling for accurate, verifiable computations.

## 🌟 Key Features

### **Intelligent Data Analysis**
- **Automatic Dataset Profiling**: Instant column-level analysis including types, nulls, outliers, distributions, and correlations
- **Server-Side Statistical Compute**: Verified statistics (describe, correlation, t-test, ANOVA, regression, clustering, drift) computed on real data via tool-calls; unverified design artifacts are clearly marked "Estimated"
- **Rich Artifact Rendering**: Charts, tables, statistical panels, code blocks, and more rendered inline in chat — verified artifacts show a "Verified · real compute" badge
- **Multi-Dataset Support**: Upload and switch between multiple datasets within a single session (profile fetched without re-uploading full data)

### **Machine Learning & Data Science**
- **Real Model Training**: Naive Bayes (`train_classifier`) and bagged-tree ensemble (`random_forest`) with holdout accuracy, confusion matrix, permutation importance; OLS linear regression (`linear_regression`)
- **Verified Analytics (16 tools)**: `describe_column`, `group_by_aggregate`, `correlation` (Pearson), `ttest` (Welch), `anova`, `outliers` (IQR/zscore), `filter_count`, `histogram`, `kmeans` (silhouette), `drift_check` (PSI+KS), `pca` (eigenvalues/loadings), `forecast` (Holt linear), `random_forest` (bagged CART), `semantic_metric` (derived-metric evaluation) — all server-computed and badge-verified (`● Verified · real compute`). In-browser SQL Lab also runs real DuckDB-WASM.
- **Semantic Layer**: Define metrics once (e.g. `profit = revenue - cost`) in **Settings → Metrics** — the model checks `metric_definitions` via `semantic_metric` before guessing what a column means.
- **Estimated/Code Artifacts**: Pipeline/lineage/cost analysis/experiment designs are AI-generated scaffolds and shown as `⚠ Estimated · AI-generated` (not verified numbers) — run them in your infra

### **Data Engineering Capabilities**
- **SQL Generation**: CTEs, window functions, optimization hints (generated code, `Estimated` — or real execution via **SQL Lab** + DuckDB-WASM in-browser)
- **Pipeline & Schema**: ETL/ELT, dbt/Airflow scaffolds, schema lineage (generated, `Estimated`)
- **Data Quality**: Profiling, validation rules, health scoring — backed by `describe_column`/`outliers` where possible

### **MLOps & Production Readiness**
- **Drift & Monitoring**: Real `drift_check` (verified); alerting/deployment strategies as generated guidance (`Estimated`)
- **Experiment & Cost**: Templates for tracking/versioning/cost analysis (`Estimated`) — bring your own runner; `forecast` is verified for time-series

### **Specialized Response Modes**
The AI adapts its behavior based on context:
- **Debugging Partner**: Root cause analysis with code fixes
- **Research Synthesizer**: Compare methods with trade-off tables
- **Experiment Designer**: A/B test setup with power analysis
- **Data Storyteller**: Executive summaries and stakeholder-ready narratives
- **Documentation Generator**: Docstrings, READMEs, data dictionaries
- **System Architect**: Pipeline design and architecture reasoning

## 🏗️ Architecture

FINESE AI follows a clean separation between frontend and backend:

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React + Vite)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Pages   │  │Components│  │     Store        │  │
│  │          │  │          │  │  (Zustand)       │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│         ↓              ↓              ↓             │
│  ┌──────────────────────────────────────────────┐  │
│  │         Client Libraries (src/lib/)          │  │
│  │  streaming.ts | ingest-client.ts | parsers   │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │ HTTPS / SSE
                      ↓
┌─────────────────────────────────────────────────────┐
│              Backend (Supabase Edge Functions)      │
│  ┌────────────────┐  ┌──────────────────────────┐  │
│  │ dataset-ingest │  │    FINESE-chat (AI)      │  │
│  │                │  │  + Tool Calling Loop     │  │
│  └────────────────┘  └──────────────────────────┘  │
│  ┌────────────────┐  ┌──────────────────────────┐  │
│  │compute-tools   │  │   dataset-fetch          │  │
│  │(stats/ML)      │  │  (authenticated proxy)   │  │
│  └────────────────┘  └──────────────────────────┘  │
│                                                    │
│  Storage: datasets/<user_id>/<file_hash>.json     │
│  Database: datasets, dataset_profiles, jobs       │
└─────────────────────────────────────────────────────┘
```

### **Frontend (`src/`)**

| Directory | Responsibility |
|-----------|---------------|
| `pages/` | Routed screens (chat, data viewer, auth, prompts) |
| `components/` | Presentation: layout shell, chat UI, artifacts, data viewer, shadcn/ui kit |
| `store/` | Client state management (Zustand with localStorage persistence) |
| `hooks/` | Auth session, viewport helpers, toast notifications |
| `lib/` | Client-side helpers: parsing, streaming client, ingest client, artifact parser |
| `workers/` | Off-main-thread file parsing and Pyodide execution |
| `integrations/` | Generated Supabase client (auto-generated, do not edit) |

**Rules:**
- Components never call backend directly—they use `src/lib/*-client.ts` or the store
- No statistics are computed in the UI; the UI only renders what the backend verified
- All async operations go through typed client libraries

### **Backend (`supabase/functions/`)**

| Function | Responsibility |
|----------|---------------|
| `dataset-ingest` | Validates size/row caps, stores dataset in Storage, builds column profile, caches in DB |
| `dataset-fetch` | Authenticated, cacheable read proxy for stored datasets |
| `dataset-profile` | Lightweight profile-only fetch (no row download) for session switching |
| `compute-tools` | 16 verified tools: describe, group-by, correlation, t-test, ANOVA, outliers, filter-count, histogram, classifier, regression, k-means, drift, pca, forecast, random_forest, semantic_metric |
| `FINESE-chat` | AI orchestration with tool-calling loop (6 rounds, history cap 30); streams responses via SSE |
| `metrics` | Semantic-layer CRUD for `metric_definitions` (name→expression) — user_id-scoped, RLS |
| `mcp` | MCP server for external agents — requires `MCP_API_KEY` or Supabase JWT + rate-limited |

**Security Rules:**
- Every function requires a valid session token and verifies row ownership
- All tables use owner-only Row Level Security (RLS)
- Storage objects live under `<user_id>/` namespace for privacy
- Errors returned to clients are generic; details stay in server logs

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Supabase account** (free tier works)
- **AI provider API key** (OpenAI, Anthropic, or any OpenAI-compatible gateway)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FINESE_AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   # any OpenAI-compatible endpoint
   AI_GATEWAY_URL=https://api.openai.com/v1
   AI_API_KEY=your_openai_api_key
   AI_MODEL=gpt-4o-mini
   # Supabase edge functions also need:
   # AI_GATEWAY_URL, AI_API_KEY (or OPENAI_API_KEY), AI_MODEL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
   ```

4. **Initialize Supabase**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Link to your project
   supabase link --project-ref your-project-ref
   
   # Apply migrations
   supabase db push
   ```

5. **Deploy edge functions**
   ```bash
   supabase functions deploy dataset-ingest
   supabase functions deploy dataset-fetch
   supabase functions deploy compute-tools
   supabase functions deploy datum-chat
   supabase functions deploy mcp
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:8080`

### Build for Production

```bash
npm run build
npm run preview  # Test production build locally
```

## 📊 Usage Guide

### 1. Upload a Dataset

- Click **Upload** in the sidebar or navigate to `/data/upload`
- Supported formats: CSV, JSON (max 20MB, 250K rows)
- The system automatically profiles columns, detects types, and computes statistics

### 2. Chat with Your Data

- Navigate to `/chat` or start a new session
- Ask questions like:
  - "Profile all columns and summarize data quality"
  - "Build a classification model to predict [target]"
  - "Show the distribution of revenue by region"
  - "Detect outliers in the salary column"
  - "Design a data pipeline for this dataset"

### 3. View Artifacts

The AI response includes rich interactive artifacts:
- **Charts**: Bar, line, scatter, heatmap, histogram, box plots
- **Tables**: Paginated data views with sorting
- **Stats Panels**: Key metrics with color-coded values
- **Code Blocks**: Runnable Python/SQL/R scripts (downloadable)
- **Statistical Tests**: Hypothesis tests with p-values and confidence intervals
- **Model Cards**: Complete ML model documentation

### 4. Explore Sample Prompts

Visit `/prompts` for 200+ curated prompts across Data Analysis, Data Science, Data Engineering, and Business analysis — each prompt maps to either a verified tool (when numeric claims are needed) or an `Estimated` scaffolding artifact. No prompt fabricates numbers: verified artifacts are always badge-marked.

### 5. Use External Agents via MCP

FINESE AI exposes an MCP (Model Context Protocol) server for integration with:
- Claude Desktop
- Cursor IDE
- Other MCP-compatible tools

Configure the MCP endpoint:
```
https://your-project.supabase.co/functions/v1/mcp
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5 with SWC
- **Routing**: React Router v6
- **State Management**: Zustand (persisted to localStorage)
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS 3 with custom animations
- **Charts**: Recharts
- **Markdown**: react-markdown with rehype plugins
- **File Parsing**: PapaParse (CSV), XLSX (Excel), DuckDB WASM
- **Python Execution**: Pyodide (in-browser Python runtime via Web Workers)
- **Forms**: React Hook Form + Zod validation

### Backend
- **Platform**: Supabase (PostgreSQL + Edge Functions + Storage)
- **Runtime**: Deno (edge functions)
- **AI Gateway**: Any OpenAI-compatible endpoint (OpenAI, Anthropic via proxy, self-hosted) — configured via `AI_GATEWAY_URL`/`AI_API_KEY`/`AI_MODEL`
- **Authentication**: Supabase Auth (email/password, OAuth via `supabase.auth.signInWithOAuth`)
- **Database**: PostgreSQL with Row Level Security
- **Storage**: Supabase Storage (namespaced by user)

### Development Tools
- **Testing**: Vitest + Testing Library
- **E2E Testing**: Playwright
- **Linting**: ESLint 9 with TypeScript support
- **Type Checking**: TypeScript 5.8

## 📁 Project Structure

```
FINESE_AI/
├── src/
│   ├── components/           # React components
│   │   ├── artifacts/        # Artifact renderers (ChartArtifact, TableArtifact, etc.)
│   │   ├── chat/             # Chat UI (ChatWindow, MessageBubble, InputBar)
│   │   ├── data-viewer/      # Data exploration (DataTable, DataVisuals, DataReport)
│   │   ├── layout/           # AppShell, Sidebar, Topbar, ChangelogSidebar
│   │   ├── ui/               # shadcn/ui component library
│   │   └── python/           # Pyodide runner component
│   ├── pages/                # Route components
│   │   ├── Chat.tsx          # Main chat interface
│   │   ├── DataViewer.tsx    # Data exploration tabs
│   │   ├── Auth.tsx          # Authentication
│   │   └── SamplePrompts.tsx # Prompt library browser
│   ├── store/                # Zustand state management
│   │   └── datum.store.ts    # Central application state
│   ├── lib/                  # Client-side utilities
│   │   ├── streaming.ts      # SSE chat streaming
│   │   ├── ingest-client.ts  # Dataset upload client
│   │   ├── artifact-parser.ts # Extract artifacts from AI responses
│   │   ├── stats.ts          # Client-side statistics (fallback)
│   │   └── constants.ts      # Runtime limits and config
│   ├── workers/              # Web Workers
│   │   ├── parse.worker.ts   # Off-thread file parsing
│   │   └── pyodide.worker.ts # Python execution sandbox
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript type definitions
│   └── integrations/         # Auto-generated Supabase client
├── supabase/
│   ├── functions/            # Edge functions (Deno)
│   │   ├── dataset-ingest/   # Upload, profile, cache datasets
│   │   ├── compute-tools/    # Real statistical computation
│   │   ├── datum-chat/       # AI orchestration with tool-calling
│   │   ├── dataset-fetch/    # Authenticated dataset download
│   │   └── mcp/              # MCP server for external agents
│   ├── migrations/           # Database schema migrations
│   └── config.toml           # Supabase configuration
├── public/                   # Static assets
├── ARCHITECTURE.md           # Detailed architecture docs
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite build configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## 🔒 Security & Privacy

### Data Ownership
- All datasets are scoped to individual users via `user_id`
- File hashes are unique per user (`file_hash + user_id`)
- Storage paths: `datasets/<user_id>/<file_hash>.json`

### Access Control
- **Row Level Security (RLS)**: Users can only access their own data
- **Edge Functions**: All functions verify JWT tokens and ownership
- **Service Role**: Only edge functions use service role key (bypasses RLS)
- **No Raw Data to LLM**: Sample data is never sent to AI models; all numbers come from tool-calls

### Privacy Guarantees
- Datasets stored in private Supabase Storage buckets
- Authentication required for all data operations
- Generic error messages prevent information leakage
- Client-side Python execution (Pyodide) keeps sensitive code local

## ⚙️ Configuration

### Runtime Limits

| Parameter | Value | Location |
|-----------|-------|----------|
| Max file size | 20 MB | `src/lib/constants.ts` |
| Max rows | 250,000 | `src/lib/constants.ts` |
| Max JSON payload | 25 MB | `supabase/functions/dataset-ingest/index.ts` |
| Persisted sessions | 25 (LRU) | `src/store/datum.store.ts` |
| Tool-call rounds | 4 max | `supabase/functions/datum-chat/index.ts` |

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Yes |
| `AI_GATEWAY_URL` | AI gateway base URL (e.g. `https://api.openai.com/v1`) | Yes |
| `AI_API_KEY` | AI provider API key (`OPENAI_API_KEY` also accepted) | Yes |
| `AI_MODEL` | Model name (e.g. `gpt-4o-mini`) | No (default `gpt-4o-mini`) |
| `SUPABASE_URL` | (Edge functions) Supabase URL | Yes |
| `SUPABASE_ANON_KEY` | (Edge functions) Anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | (Edge functions) Service role key | Yes |
| `FALLBACK_MODELS` | Comma-separated fallback models | No |

## 🧪 Testing

### Unit Tests
```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode
```

Tests use Vitest with Testing Library for React component testing.

### E2E Tests
```bash
npx playwright test     # Run Playwright tests
npx playwright ui       # Interactive UI mode
```

Test configuration: `playwright.config.ts`

## 📈 Performance Considerations

### Large Datasets
- Files >10MB should use direct Storage upload (future enhancement)
- Profile computation is O(n × m) where n=rows, m=columns
- Correlation matrix limited to top 20 pairs by absolute value

### AI Response Optimization
- Tool-calling reduces hallucinations but adds latency (2-4 rounds typical)
- Streaming responses provide immediate feedback
- Retry logic with exponential backoff (max 3 attempts)

### Client-Side Rendering
- Artifacts rendered lazily as they arrive
- Virtual scrolling for large tables (>1000 rows)
- Web Workers prevent UI blocking during parsing

## 🤝 Contributing

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test**
   ```bash
   npm run lint      # Check code style
   npm run test      # Run unit tests
   npm run build     # Verify production build
   ```

3. **Commit with conventional messages**
   ```bash
   git commit -m "feat: add new chart type for time series"
   git commit -m "fix: handle null values in correlation calculation"
   git commit -m "docs: update README with MCP setup instructions"
   ```

4. **Submit a pull request**

### Code Style Guidelines
- **TypeScript**: Incremental strictness — `strictNullChecks` and `noImplicitAny` enabled; full `strict` mode tracked but not yet enforced (see `tsconfig.app.json`)
- **Components**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Imports**: Grouped by source (React, third-party, internal)
- **Error Handling**: Try-catch with user-friendly messages (generic to client, details in server logs)

## 🐛 Troubleshooting

### Common Issues

**"Unauthorized" errors**
- Ensure you're signed in (check `/auth` page)
- Verify Supabase keys are correct in `.env`
- Check browser console for CORS issues

**Dataset upload fails**
- File must be <20MB and <250K rows
- CSV should have consistent column counts — schema drift is now detected server-side and surfaced as a warning (see `dataset-ingest` logs / `advanced.warnings`)
- Check network connectivity to Supabase

**AI not responding**
- Verify `AI_API_KEY` / `AI_GATEWAY_URL` / `AI_MODEL` are set
- Check browser network tab for 402/429 (credits/rate limit) or 401 (bad key)
- Review Supabase function logs: `supabase functions logs datum-chat`

**Charts not rendering**
- Ensure data has numeric columns for the selected chart type
- Check artifact JSON syntax in AI response
- Verify Recharts dependencies installed

### Debug Mode

Enable verbose logging:
```typescript
// In browser console
localStorage.setItem('debug', 'true');
```

View Supabase function logs:
```bash
supabase functions logs datum-chat --tail
supabase functions logs dataset-ingest --tail
```

## 📚 Resources

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Detailed architecture documentation
- **[Supabase Docs](https://supabase.com/docs)**: Backend platform documentation
- **[shadcn/ui](https://ui.shadcn.com/)**: UI component library
- **[Recharts](https://recharts.org/)**: Charting library
- **[Zustand](https://zustand-demo.pmnd.rs/)**: State management

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

Built with:
- [Supabase](https://supabase.com/) - Backend platform
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Recharts](https://recharts.org/) - Charting library
- [Pyodide](https://pyodide.org/) - Python in the browser

---

**Need help?** Open an issue or contact the development team.
