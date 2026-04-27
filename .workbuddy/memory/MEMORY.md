# R U Socrates — Project Long-Term Memory

## 项目定位
R U Socrates 是 ASI-Evolve 的端到端产品化工具。

**核心定位（用户亲口定义，2026-04-22）**：
> "普通人也能亲眼看懂的研究引擎。真正稀缺的不是生成创意，而是把研究过程从黑箱里拿出来，交还给用户判断。"

**产品原则**：
1. **透明过程优先于结论** — 用户看到的是推理路径，不是答案摘要
2. **用户是判断者** — 系统展示证据和权衡，不替用户下结论
3. **零 mock** — 任何面向用户的功能必须接真实数据，不允许 mock

目标：人人可理解、可运行、可验证、可发布。

## 当前状态（截至 2026-04-27）
- **Phase 1 前端用户流完成** ✅
  - `packages/types/` — 共享类型包
  - `apps/web/` — 完整用户流（tasks → detail → results），含模拟 SSE
  - Phase 1 UX 改进完成（Phase 1 全部 6 项）：Toast 系统、shadcn Select/Dialog、Navbar active 高亮、Template 预填表单、Settings 面包屑、Stop/Delete 按钮
- **技术债全部清理完成** ✅（2026-04-27，10 项 P0/P1/P2）
  - cancelTask/deleteTask API 端点已补全
  - sys.path.insert 脆弱导入已修复（module-level import）
  - DB session 复用（单 session per run）
  - RunEventStore 内存泄漏修复
  - ExploredNode 每 iteration 写入
  - agent_type 字段已添加至 PipelineEvent（ADR-007 后端前提 ✅）
  - NodeDatabase FAISS/ST lazy-init
  - 前后端默认 model 对齐（qwen-plus）
  - .gitignore 忽略 prepare/ 和 data/
- **ADR-007 后端前提已满足** — L2 Reasoning Tree / L3 Score Journey 可开始开发
- `prepare/` 待清理（Phase 1 末）

## 核心产品特性：推理可视化（ADR-007, 2026-04-25）
计划文档：`planning/REASONING_VISUALIZATION.md`

**核心卖点**：让普通人亲眼看懂 AI 研究推理过程，把黑箱变成白箱。

三层次（前端实现，共享 SSE 数据源）：
- **L1 — Live Reasoning Feed**（~4h）：实时 SSE 面板，Iteration accordion，Researcher→Engineer→Analyzer 三段式卡片，Shiki 代码高亮，Auto-scroll + "New events" 悬浮按钮
- **L2 — Reasoning Tree**（~3h）：节点探索树（SVG/CSS），从 SSE 事件重建 parent/child 关系，Alive/Pruned/Best 三色标识
- **L3 — Score Journey**（~2h）：Iteration-over-iteration 得分折线图（recharts），"New best" 标注、hover tooltip

**后端前提**（1 行代码）：在 `pipeline.py` 的 SSE 事件中加入 `event.type = "researcher"|"engineer"|"analyzer"` 字段
**前端依赖**：`npm install shiki recharts`

## 开发工作流
**文档优先** — 每次 implementation session 前：
1. 更新 `planning/EXECUTION_PLAN.md`
2. 有新决策 → 写入 `planning/ADR/`
3. 以上完成后才写代码

## 架构决策记录（ADR）
- ADR-001：Phase 1 用 SQLite，PostgreSQL 推迟到 Phase 3
- ADR-002：Phase 1–2 不做沙箱，process exec + timeout 代替
- ADR-003：model-gateway 用 LiteLLM，不自研 adapter
- ADR-007：**推理可视化三层次架构**（2026-04-25）：L1 Live Feed / L2 Reasoning Tree / L3 Score Journey，全部前端实现，共享 SSE 数据源

## 技术栈
| 层 | Phase 1–2（已确定）| Phase 3（待定）|
|---|---|---|
| 前端 | Next.js 14 + React 18 + TS5 + TailwindCSS + Shadcn/UI + Zustand | 同 |
| 后端 | Python 3.10+ + FastAPI + SQLAlchemy + Celery | 同 |
| 数据库 | **SQLite**（dev）| PostgreSQL 15+ |
| 队列 | Redis 7+ + Celery 5+ | 同 |
| 向量存储 | FAISS 1.7+ + sentence-transformers | 同 |
| LLM 接口 | **LiteLLM**（统一 wrapper）| 同 |
| 沙箱 | **Process exec + timeout** | Docker / gVisor |
| 容器 | Docker Compose | Kubernetes |

## 目标项目结构
```
packages/types          →  共享 TypeScript 类型
packages/utils          →  logger、error、validator
services/memory/       →  CognitionStore、VectorIndex、Distiller
services/model-gateway/→  LiteLLM wrapper
services/worker/       →  Research loop（Researcher/Engineer/Analyzer）
services/api/          →  FastAPI routes + SQLAlchemy models
apps/web/              →  Next.js 前端
infra/compose/         →  Docker Compose
```

## 上游参考项目
- **ASI-Evolve**（主内核）：`pipeline/main.py` → Pipeline.run_step() 四段式闭环，本地可跑，7个核心依赖
- **ASI-Arch**（专用能力）：线性注意力架构发现，依赖外部 MongoDB + OpenSearch，Phase 3 才接入

## 下一步
Phase 1 剩余模块：`services/memory/`（推荐优先）→ `services/api/` → `services/model-gateway/` → `services/worker/` → `infra/compose/`

## 许可方案
- 核心层（继承 ASI-Evolve）：Apache-2.0
- 应用层（新增）：PolyForm Noncommercial
