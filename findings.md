# Findings & Decisions

## Requirements
- 产物：一个“夯拉排名”H5 页面，主要在电脑浏览器中操作。
- 技术栈：Vite + Vue + TypeScript。
- 排名对象为本地上传的一张张图片，不需要任何计分规则。
- 每个等级由左到右、由上到下排列；每行最多 7 张、最多两行，即每等级最多 14 张。
- 默认固定五个等级：夯、顶级、人上人、NPC、拉完了；用户可修改等级名称，但不能增删等级或改变等级顺序。
- 用户可在创建时选择带标签的五档预设模板；完整模板清单记录于 PRESET_TIER_SETS.md。
- 操作主流程固定为：1. 选择标签类型；2. 上传图片；3. 拖动排名；4. 导出图片。
- 页面顶部有本次排名的标题栏。
- 不需要登录和角色权限。
- 当前目录为空，可按新项目规划；本轮交付为规划，不初始化工程。

## Product Assumptions
- 默认作为浏览器本地应用：标题、等级、排序和图片以 IndexedDB 自动保存，避免用户刷新后丢失本地上传的图片。
- 默认各等级可拖拽排序和跨等级移动；数组顺序就是展示和排名顺序。等级数组固定为五项。
- 默认上传图片先进入待放入区，用户再拖入对应等级，便于批量整理。

## Proposed Information Architecture
1. 标题栏：本次排名标题、保存状态和导入/导出。
2. 操作栏：本地上传、添加等级、保存、清空。
3. 待放入图片区：展示刚上传、尚未分类的图片。
4. 等级排名墙：每等级固定 7 列、最多两行的图片排序网格。

## Data Model Draft
| Entity | Core fields |
|---|---|
| RankingDraft | id, title, tiers, image metadata, updatedAt |
| RankTier | id, name, imageIds |
| RankImage | id, name, blobKey, createdAt |

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 分层为 view / feature component / store / service / model | 页面保持编排职责；业务逻辑、请求和类型可独立测试与复用。 |
| 单页应用，不引入路由和网络请求层 | 目前仅需本机操作，不存在多页面、登录或服务端数据。 |
| IndexedDB 保存图片 Blob | 相较 localStorage 可容纳二进制图片，不受字符串容量和编码开销限制。 |
| CSS Grid 固定 7 列 | 能直接表达每行 7 张图片，且第 8 张自然换行。 |
| 每等级容量为 14 | 严格满足最多两行、每行最多 7 张。 |
| SortableJS 实现拖拽 | 成熟地支持网格内排序与跨容器移动。 |
| 模板预设以 `id + tag + tierNames` 定义 | 标签可用于展示、搜索和持久化；等级名称数组严格固定五项。 |
| 单页四步状态流 | 使模板、上传、排序和导出按自然顺序完成。 |

## Resources
- 建议依赖：pinia、sortablejs（或 vuedraggable）、idb、html-to-image、vitest。

## Visual/Browser Findings
- 未使用视觉或浏览器资料；视觉规范将在实施前依据品牌素材补充。
