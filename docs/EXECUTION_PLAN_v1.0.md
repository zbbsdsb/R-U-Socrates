# R U Socrates v1.0.0 — 详细执行计划

> 最后冲刺：从 MVP 到商业化发布

---

## 当前进度

### ✅ 已完成（5/16）
- [x] Task 11: 产品落地页
- [x] Task 12: 定价策略文档
- [x] Task 13: 安装和快速开始指南
- [x] Task 14: FAQ 文档
- [x] Task 15: 企业版路线图

### ⏳ 等待执行（11/16）
- [ ] Task 1-7: 产品优化（性能、UX、功能）
- [ ] Task 8-10: 桌面应用打包
- [ ] Task 16: 最终发布

---

## 阶段一：产品优化 (v0.3.0)

### Sprint 1: 性能优化（预计 4-6 小时）

#### Task 1: Tree Virtualization
**文件**: [apps/web/components/reasoning/ReasoningTree.tsx](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/apps/web/components/reasoning/ReasoningTree.tsx)

**实现步骤**:
```bash
cd apps/web
npm install react-window react-virtual
```

**修改 ReasoningTree.tsx**:
```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedTree = () => {
  return (
    <List
      height={600}
      itemCount={nodes.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <TreeNode node={nodes[index]} style={style} />
      )}
    </List>
  );
};
```

**验收标准**:
- 100+ 节点树渲染流畅（60fps）
- 滚动无卡顿

---

#### Task 2: SSE Debouncing
**文件**: [apps/web/stores/taskStore.ts](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/apps/web/stores/taskStore.ts)

**实现步骤**:
```typescript
// 在 taskStore.ts 中添加
import { useMemo, useCallback } from 'react';

const DEBOUNCE_MS = 100; // 100ms debounce

const debouncedAddEvent = useMemo(
  () => debounce((event: PipelineEvent) => {
    addEvent(event);
  }, DEBOUNCE_MS),
  [addEvent]
);
```

**验收标准**:
- 高频事件时 UI 保持流畅
- 不丢失重要事件

---

### Sprint 2: 核心功能（预计 6-8 小时）

#### Task 3: 任务暂停/恢复
**文件**: 
- [apps/web/stores/taskStore.ts](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/apps/web/stores/taskStore.ts)
- [services/api/main.py](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/services/api/main.py)
- [services/worker/pipeline.py](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/services/worker/pipeline.py)

**实现步骤**:

1. **后端添加暂停/恢复 API** (`services/api/main.py`):
```python
@router.post("/tasks/{task_id}/pause")
async def pause_task(task_id: str):
    # 向 worker 发送暂停信号
    return {"status": "paused"}

@router.post("/tasks/{task_id}/resume")
async def resume_task(task_id: str):
    # 向 worker 发送恢复信号
    return {"status": "running"}
```

2. **Worker 支持暂停** (`services/worker/pipeline.py`):
```python
async def run(self):
    while not self.stop_event.is_set():
        if self.paused:
            await asyncio.sleep(0.1)
            continue
        # ... 执行逻辑
```

3. **前端添加暂停按钮**:
```typescript
// 在任务详情页添加
<button onClick={togglePause}>
  {isPaused ? '▶️ Resume' : '⏸️ Pause'}
</button>
```

**验收标准**:
- 暂停按钮可停止任务执行
- 恢复按钮从中断点继续
- 刷新后任务状态保持

---

#### Task 4: 键盘快捷键
**文件**: [apps/web/app/tasks/[id]/page.tsx](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/apps/web/app/tasks/[id]/page.tsx)

**实现步骤**:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !e.target?.closest('input, textarea')) {
      e.preventDefault();
      togglePause();
    }
    if (e.code === 'Escape') {
      cancelTask();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [togglePause, cancelTask]);
```

**验收标准**:
- Space 暂停/恢复
- Escape 取消任务
- UI 显示快捷键提示

---

#### Task 5: LLM Provider Fallback
**文件**: 
- [services/worker/llm.py](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/services/worker/llm.py)
- [services/api/.env](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/services/api/.env)

**实现步骤**:

1. **配置多个 provider** (`.env`):
```env
PRIMARY_MODEL=gpt-4
FALLBACK_MODEL=claude-3-haiku
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

2. **实现 fallback 逻辑** (`services/worker/llm.py`):
```python
async def call_llm_with_fallback(prompt: str) -> str:
    try:
        return await call_primary_llm(prompt)
    except LLMError as e:
        logger.warning(f"Primary LLM failed: {e}, trying fallback")
        return await call_fallback_llm(prompt)
```

**验收标准**:
- 主 LLM 失败时自动切换
- 用户看到友好的错误提示

---

### Sprint 3: 高级功能（预计 4-6 小时）

#### Task 6: 自定义评估器 UI
**文件**: [apps/web/app/tasks/[id]/evaluator/page.tsx](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/apps/web/app/tasks/[id]/page.tsx)

**实现步骤**:
```bash
cd apps/web
npm install @monaco-editor/react
```

```typescript
import Editor from '@monaco-editor/react';

const EvaluatorEditor = () => {
  return (
    <Editor
      height="400px"
      defaultLanguage="python"
      theme="vs-dark"
      value={evaluatorCode}
      onChange={(value) => setEvaluatorCode(value)}
    />
  );
};
```

**验收标准**:
- UI 可编辑评估器
- 语法高亮正常

---

#### Task 7: 任务模板库
**文件**: [apps/web/data/templates/](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/apps/web/)

**实现步骤**:

创建模板目录:
```
apps/web/data/templates/
├── python-helper.md
├── data-analysis.md
├── code-review.md
├── research-paper.md
└── creative-writing.md
```

**验收标准**:
- 5+ 模板可用
- 用户可选择和使用

---

## 阶段二：桌面应用

### Sprint 4: Electron 打包（预计 8-10 小时）

#### Task 8: Electron 配置
**文件**: [apps/electron/](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/apps/electron/)

**实现步骤**:

1. **安装 Electron**:
```bash
cd apps
npm install electron electron-builder concurrently wait-on
npm install -D @electron/rebuild
```

2. **创建 Electron 主进程** (`main.js`):
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { nodeIntegration: false }
  });
  
  win.loadURL('http://localhost:3000');
}

app.whenReady().then(createWindow);
```

3. **配置 electron-builder** (`package.json`):
```json
{
  "build": {
    "appId": "com.rusocrates.app",
    "productName": "R U Socrates",
    "win": { "target": "nsis" },
    "mac": { "target": "dmg" }
  }
}
```

4. **构建命令**:
```bash
# 开发
npm run electron:dev

# 构建 Windows
npm run electron:build:win

# 构建 macOS
npm run electron:build:mac
```

**验收标准**:
- Windows 可安装运行
- macOS 可安装运行
- 启动 <5s

---

#### Task 9: 系统托盘
**文件**: [apps/electron/main.js](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/apps/electron/main.js)

**实现步骤**:
```javascript
const { Tray, Menu } = require('electron');

let tray;

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => win.show() },
    { label: 'Hide', click: () => win.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  
  tray.setToolTip('R U Socrates');
  tray.setContextMenu(contextMenu);
}
```

**验收标准**:
- 托盘图标可见
- 应用可最小化到后台

---

#### Task 10: 自动更新
**文件**: [apps/electron/updater.js](file:///e:/ceaserzhao/github%20projects/R%20U%20Socrates/apps/electron/)

**实现步骤**:
```bash
npm install electron-updater
```

```javascript
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  win.webContents.send('update-available');
});

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});
```

**验收标准**:
- 检查更新工作
- 更新可正常安装

---

## 阶段三：最终发布

### Sprint 5: 测试和发布（预计 4-6 小时）

#### Task 16: v1.0.0 发布

**发布检查清单**:

1. **完整 E2E 测试**:
```bash
# 启动所有服务
cd services/api && uvicorn main:app --reload &
cd apps/web && npm run dev &
cd apps/electron && npm run electron:dev &
```

2. **功能验证**:
- [ ] 创建任务
- [ ] L1/L2/L3 可视化
- [ ] 暂停/恢复
- [ ] 键盘快捷键
- [ ] 错误处理
- [ ] 桌面应用
- [ ] 自动更新

3. **Git 提交**:
```bash
git add .
git commit -m "feat: v1.0.0 - Commercialization sprint complete

Features:
- Tree virtualization for 100+ nodes
- SSE debouncing
- Pause/Resume
- Keyboard shortcuts
- LLM fallback
- Electron desktop app
- System tray
- Auto-updates"

git tag v1.0.0
git push origin main
git push origin v1.0.0
```

4. **GitHub Release**:
```bash
gh release create v1.0.0 \
  --title "v1.0.0 — Commercial Launch" \
  --notes-file docs/RELEASE_TEMPLATE.md
```

5. **上传安装包**:
- Windows: `dist/R U Socrates Setup 1.0.0.exe`
- macOS: `dist/R U Socrates-1.0.0.dmg`

6. **社区公告**:
- GitHub Discussions
- Twitter/X
- Reddit r/MachineLearning
- Hacker News

---

## 时间估算

| Sprint | 任务 | 预计时间 | 依赖 |
|--------|------|---------|------|
| Sprint 1 | Task 1-2 (性能) | 4-6h | 无 |
| Sprint 2 | Task 3-5 (核心功能) | 6-8h | Sprint 1 |
| Sprint 3 | Task 6-7 (高级功能) | 4-6h | Sprint 2 |
| Sprint 4 | Task 8-10 (桌面应用) | 8-10h | Sprint 3 |
| Sprint 5 | Task 16 (发布) | 4-6h | Sprint 4 |
| **总计** | | **26-36h** | |

---

## 资源需求

### 开发环境
- Node.js 18+
- Python 3.10+
- Git
- GitHub Account

### API Keys
- OpenAI API Key
- (可选) Anthropic API Key
- (可选) DeepSeek API Key

### 发布准备
- GitHub Release 操作权限
- Windows/macOS 测试机器
- 社交媒体账号

---

## 风险和缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Electron 打包复杂 | 中 | 高 | 使用 electron-builder 简化 |
| SSE 性能问题 | 低 | 高 | 充分测试和优化 |
| API Key 配置复杂 | 低 | 中 | 完善文档 |
| 发布审核延迟 | 低 | 低 | 提前准备 |

---

## 下一步行动

1. ✅ 阅读并理解本计划
2. ⏳ 配置开发环境
3. ⏳ 开始 Sprint 1 (Task 1-2)
4. ⏳ 完成所有 Sprint
5. ⏳ 发布 v1.0.0
