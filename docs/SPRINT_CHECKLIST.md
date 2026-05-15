# R U Socrates v1.0.0 — Sprint 执行清单

---

## Sprint 1: 性能优化 (Task 1-2)

### Day 1 Morning (2-3h)
- [ ] Task 1.1: 安装依赖 `npm install react-window react-virtual`
- [ ] Task 1.2: 修改 ReasoningTree.tsx 添加虚拟化
- [ ] Task 1.3: 测试 100+ 节点渲染

### Day 1 Afternoon (2-3h)
- [ ] Task 2.1: 修改 taskStore.ts 添加 debounce
- [ ] Task 2.2: 测试高频事件性能
- [ ] Task 2.3: 性能调优

**完成标准**: 100+ 节点树渲染流畅，60fps

---

## Sprint 2: 核心功能 (Task 3-5)

### Day 2 (4h)
- [ ] Task 3.1: 后端添加 pause/resume API
- [ ] Task 3.2: Worker 支持暂停
- [ ] Task 3.3: 前端添加暂停按钮
- [ ] Task 3.4: 测试暂停/恢复功能
- [ ] Task 3.5: 测试刷新后状态保持

### Day 3 (4h)
- [ ] Task 4.1: 添加键盘事件监听
- [ ] Task 4.2: 实现 Space 暂停/恢复
- [ ] Task 4.3: 实现 Escape 取消
- [ ] Task 4.4: 添加快捷键提示 UI
- [ ] Task 4.5: 测试快捷键

**完成标准**: 暂停/恢复和快捷键工作正常

---

## Sprint 3: LLM 优化 (Task 5)

### Day 4 (2h)
- [ ] Task 5.1: 配置多个 LLM provider
- [ ] Task 5.2: 实现 fallback 逻辑
- [ ] Task 5.3: 添加错误 UI
- [ ] Task 5.4: 测试 fallback

**完成标准**: 主 LLM 失败时自动切换

---

## Sprint 4: 高级功能 (Task 6-7)

### Day 5 (3h)
- [ ] Task 6.1: 安装 Monaco Editor `npm install @monaco-editor/react`
- [ ] Task 6.2: 创建评估器编辑页面
- [ ] Task 6.3: 测试语法高亮

### Day 6 (3h)
- [ ] Task 7.1: 创建 templates 目录
- [ ] Task 7.2: 创建 5+ 模板
- [ ] Task 7.3: 创建模板选择 UI
- [ ] Task 7.4: 测试模板功能

**完成标准**: 评估器可编辑，5+ 模板可用

---

## Sprint 5: Electron 桌面应用 (Task 8-10)

### Day 7-8 (8h)
- [ ] Task 8.1: 安装 Electron `npm install electron electron-builder`
- [ ] Task 8.2: 创建 main.js 主进程
- [ ] Task 8.3: 配置 electron-builder
- [ ] Task 8.4: 打包 Windows 安装包
- [ ] Task 8.5: 打包 macOS 安装包
- [ ] Task 8.6: 测试桌面应用

### Day 9 (4h)
- [ ] Task 9.1: 添加系统托盘
- [ ] Task 9.2: 实现后台运行
- [ ] Task 9.3: 测试托盘功能

- [ ] Task 10.1: 安装 electron-updater
- [ ] Task 10.2: 配置自动更新
- [ ] Task 10.3: 测试更新机制

**完成标准**: 桌面应用可安装运行，自动更新工作

---

## Sprint 6: 最终发布 (Task 16)

### Day 10 (4-6h)

#### Morning: 测试
- [ ] 功能测试 (L1/L2/L3)
- [ ] 暂停/恢复测试
- [ ] 快捷键测试
- [ ] 桌面应用测试
- [ ] 自动更新测试

#### Afternoon: 发布
- [ ] 更新 CHANGELOG.md
- [ ] 更新版本号
- [ ] Git 提交
- [ ] Git 标签
- [ ] GitHub Release
- [ ] 上传安装包

#### Evening: 公告
- [ ] GitHub Discussions 公告
- [ ] Twitter/X 公告
- [ ] Reddit r/MachineLearning 帖子
- [ ] Hacker News 帖子

---

## 每日站会问题

1. 昨天完成了什么？
2. 今天计划完成什么？
3. 有什么阻碍？

---

## 成功标准

- [ ] 100+ 节点树渲染流畅
- [ ] 暂停/恢复功能正常
- [ ] 键盘快捷键工作
- [ ] LLM fallback 工作
- [ ] 桌面应用可安装
- [ ] v1.0.0 发布完成
