# 夯拉排名 H5：图片排名墙架构

## 1. 产品定义

这是一个用于电脑浏览器操作的单页图片排名工具。用户填写“本次排名”标题，上传本地图片，并将图片依等级从左至右排列。每个等级固定最多两行，每行最多 7 张，因此单个等级上限为 **14 张**。

不包含登录、角色、计分、后端排名计算或活动期次等业务。首版以本机可保存、可编辑、可导出的图片排名墙为目标。

核心路径固定为：**选择标签类型 → 上传图片 → 拖动排名 → 导出图片**。

## 2. 页面结构

```text
┌──────────────────────────────────────────────────────────────────────┐
│  本次排名标题（可编辑）                1 类型 · 2 上传 · 3 排名 · 4 导出 │
├──────────────────────────────────────────────────────────────────────┤
│  当前步骤操作：选择标签类型 ｜ 上传图片 ｜ 拖动排名 ｜ 导出图片        │
├──────────────────────────────────────────────────────────────────────┤
│  S 级  [01][02][03][04][05][06][07]                                  │
│        [08][09][10][11][12][13][14]                                  │
├──────────────────────────────────────────────────────────────────────┤
│  A 级  [01][02][03]…                                                  │
├──────────────────────────────────────────────────────────────────────┤
│  B 级  空状态：将图片拖到这里                                         │
└──────────────────────────────────────────────────────────────────────┘
```

- 标题栏：显示并编辑本次排名标题；可显示最近保存时间。
- 步骤导航：始终显示四步进度。未选择模板不能上传，未上传图片不能进入排名或导出；用户可返回已完成的步骤修改。
- 等级分区：固定五档。新建时可从预设模板库选择（见 [PRESET_TIER_SETS.md](PRESET_TIER_SETS.md)），默认使用 **夯、顶级、人上人、NPC、拉完了**；用户可修改每档名称，但不可新增、删除或改变等级顺序。
- 图片卡片：缩略图、当前位置序号、删除操作；图片按容器比例 `object-fit: cover` 裁切。
- 操作方式：上传后进入“待放入”图片区；拖拽到任一等级，或直接追加到选中等级。等级内拖拽即重排；跨等级拖拽即转移。
- 容量限制：第 14 张之后禁放，明确提示“该等级最多 14 张”。第 8 张自动进入第二行。

## 3. 交互与规则

### 主流程

| 步骤 | 页面动作 | 完成条件 | 结果 |
|---|---|---|---|
| 1. 选择标签类型 | 在模板选择器中选择带标签的五档模板 | 选中模板 | 写入五个等级名称，解锁上传 |
| 2. 上传图片 | 选择或拖入本地图片 | 至少成功上传一张 | 图片进入待放入区，解锁排名 |
| 3. 拖动排名 | 将图片拖入等级，并在网格内排序 | 可随时编辑 | 左→右、上→下的顺序即排名 |
| 4. 导出图片 | 预览并导出 | 点击导出 | 下载带标题、标签和等级的 PNG |

页面采用单页分步状态，而非四个独立路由；完成任一步后仍可回退修改，保留排名墙预览。

| 场景 | 规则 |
|---|---|
| 本地上传 | 支持多选 `jpg/png/webp`；上传前校验格式、文件大小和数量。 |
| 等级内排序 | 由左至右、由上至下决定名次，卡片从 1 开始连续编号。 |
| 跨等级移动 | 保留图片本体，更新所属等级及在目标等级的位置。 |
| 已满等级 | 拖入或追加被阻止，界面提示容量已满。 |
| 删除图片 | 从当前等级移除；如需要可保留在待放入区，避免重新上传。 |
| 浏览器刷新 | 自动保存草稿至 IndexedDB；重新打开后恢复标题、等级、排序和图片。 |
| 导出 | 将标题、模板标签及所有等级渲染为一张 PNG 图片，便于分享。 |
| 选择模板 | 新建或“更换等级模板”时，从带标签的模板卡片中选择一套五档名称；更换前二次确认，不影响图片在各档中的位置。 |

### 等级模板选择器

- 选择器以标签 chip + 五档名称预览呈现，例如 `修仙境界`：羽化·登仙 / 元婴·老怪 / …。
- 首版提供 27 套预设，包括 T 系、字母梯度、江湖实力、美食、修仙、职场、情绪、追剧和减肥等；完整清单见 [PRESET_TIER_SETS.md](PRESET_TIER_SETS.md)。
- “默认夯拉”是初始选中模板。选择预设只是一次性写入五档名称，随后允许逐档编辑。
- 完全相同的模板去重展示；每项都有唯一标签，作为选择、搜索和持久化的 `presetId`。

## 4. 技术选型

- Vue 3 + TypeScript + Vite：应用框架与构建。
- Pinia：集中管理标题、等级、图片、当前草稿状态。
- SortableJS / VueDraggable：稳定实现同等级排序与跨等级拖拽。
- IndexedDB（建议 `idb`）：保存原始图片 Blob 和排名结构；不把大图片放进 localStorage。
- html-to-image：导出排名墙 PNG。
- 原生 CSS Grid：每个等级 `grid-template-columns: repeat(7, ...)`，固定 7 列、最多 2 行。
- Vitest：校验容量、排序与持久化逻辑。

无需 Vue Router、Axios、Element Plus 或权限体系；首版是单页本地应用。若以后接入云端，仅替换 `storage` 层为 API 即可。

## 5. 前端结构

```text
src/
  App.vue                         # 页面组装
  main.ts
  components/
    RankingHeader.vue              # 标题编辑、四步进度、导出
    RankingStepper.vue              # 选择模板、上传、排名、导出步骤控制
    RankingToolbar.vue              # 上传、保存、清空
    RankTier.vue                    # 单个等级，固定 7×2 网格和拖拽容器
    ImageRankCard.vue               # 图片、序号、删除按钮
    UnassignedImagePanel.vue        # 待放入图片区（可选）
    EmptyTierState.vue
  stores/
    ranking.ts                      # Pinia 状态和业务 action
  composables/
    useImageUpload.ts               # 图片校验、压缩（如需要）、预览 URL
    useRankingExport.ts              # 导出 PNG
  services/
    storage.ts                      # Storage 接口
    indexed-db-storage.ts            # IndexedDB 实现
  types/
    ranking.ts                      # RankTier、RankImage、RankingDraft
  utils/
    rank.ts                         # 容量、排序、序号等纯函数
  styles/
    tokens.css
    index.css
```

分层原则：组件只渲染和派发事件；排序、移动、容量判断写入 store / `utils/rank.ts`；浏览器存储封装在 `services` 中。因此未来即使改为服务端存储也不影响 UI。

## 6. 核心数据结构

```ts
type RankImage = {
  id: string
  name: string
  blobKey: string        // IndexedDB 中图片 Blob 的键
  previewUrl?: string    // 运行时 Object URL，不持久化
  createdAt: number
}

type RankTier = {
  id: string
  name: string           // 如 S、A、B
  imageIds: string[]     // 数组顺序即从左到右、从上到下的名次
}

type RankingDraft = {
  id: string
  title: string
  presetId: string
  tiers: RankTier[]             // 固定五项，顺序即等级由高到低
  images: Record<string, RankImage>
  unassignedImageIds: string[]
  updatedAt: number
}

type TierPreset = {
  id: string
  tag: string                   // 如“修仙境界”“奶茶版”
  tierNames: [string, string, string, string, string]
}

const MAX_IMAGES_PER_TIER = 14
const IMAGES_PER_ROW = 7
```

## 7. 核心状态动作

```text
createDraft(title)
setStep(1 | 2 | 3 | 4)
applyPreset(presetId) → 用预设的五个名称替换当前等级名称，解锁步骤 2
uploadImages(files) → 校验 → Blob 存 IndexedDB → 加入待放入区，解锁步骤 3
moveImage(imageId, fromTierId | 'unassigned', toTierId, targetIndex)
reorderImages(tierId, imageIds)
renameTier(tierId, name)          // 仅允许改名，固定保留五档
removeImage(imageId)
saveDraft() / restoreDraft()
exportAsPng() → 导出标题、模板标签和五个等级，完成步骤 4
```

`moveImage` 与 `reorderImages` 必须先校验目标等级的上限。所有变更采用 300–500ms 防抖自动保存，离开页面前再执行一次立即保存。

## 8. 实施顺序

1. 初始化 Vite Vue TS，配置 CSS 变量、Pinia、模板常量、四步状态与基础单页布局。
2. 实现步骤条、模板选择器、标题、等级列表、7×2 图片网格及空状态。
3. 接入本地上传、待放入区、拖拽排序与 14 张限制。
4. 加入 IndexedDB 自动保存和恢复。
5. 完成 PNG 导出、图片加载异常处理与单元测试。

## 9. 需要在开发前确认的细节

- 默认等级固定为“夯、顶级、人上人、NPC、拉完了”；用户只能改名，不能增删等级或调整档位顺序。
- 上传图片后是否需要“待放入区”，还是默认直接放入某个等级？
- 导出目标是否只要 PNG，还是还要保存/导入 JSON 草稿？
- 单图最大上传大小建议先定为 10 MB；如图片很多，可在浏览器端压缩后保存。
