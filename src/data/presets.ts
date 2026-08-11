import type { TierPreset } from '../types/ranking'

const definePreset = (id: string, tag: string, tierNames: TierPreset['tierNames']): TierPreset => ({ id, tag, tierNames })

export const TIER_PRESETS: TierPreset[] = [
  definePreset('hang-la', '默认夯拉', ['夯', '顶级', '人上人', 'NPC', '拉完了']),
  definePreset('t-series', 'T 系', ['T0', 'T1', 'T2', 'T3', 'T4']),
  definePreset('letter-grade', '字母梯度', ['SSS', 'S', 'A', 'B', 'C']),
  definePreset('jianghu', '江湖实力', ['绝世', '一流', '二流', '三流', '不入流']),
  definePreset('character', '人物品质', ['神', '牛', '人', '鬼', '屑']),
  definePreset('food-rating', '美食评级', ['米其林三星', '必吃榜', '能吃', '方便面级别', '黑暗料理']),
  definePreset('food-roast', '美食毒舌', ['米其林三星', '家常菜天花板', '能吃系列', '猪都不吃', '化学武器']),
  definePreset('animal', '动物链', ['霸主', '猛兽', '杂食', '食草', '微生物']),
  definePreset('cultivation', '修仙境界', ['羽化·登仙', '元婴·老怪', '筑基·真传', '炼气·杂役', '凡人·炮灰']),
  definePreset('journey-west', '西游果位', ['旃檀功德佛', '斗战胜佛', '金身罗汉', '八部天龙', '肉眼凡胎']),
  definePreset('luck', '气运', ['天选之子', '锦鲤', '欧皇', '非酋', '天谴之人']),
  definePreset('career', '财富职场', ['跨国财阀', '独角兽CEO', '中产社畜', '灵活就业', '耗材']),
  definePreset('love', '恋爱状态', ['纯爱战神', '正常恋爱', '间歇性发疯', '重度恋爱脑', '斯德哥尔摩患者']),
  definePreset('relationship', '感情走向', ['双箭头', '单箭头', '回旋镖', '回旋镖扎心', '回旋镖扎进ICU']),
  definePreset('coding', '编程考试', ['一次过·神', '能跑·别动', '玄学·随缘', '报错·崩溃', '删库·跑路']),
  definePreset('mood', '情绪状态', ['优雅', '侥幸', '焦虑', '绝望', '坐牢']),
  definePreset('study', '学业', ['保送清北', '一本稳了', '有书读', '家里蹲', '工地搬砖']),
  definePreset('sleep', '睡眠', ['婴儿般睡眠', '正常人类', '熬夜冠军', '行尸走肉', '已超度']),
  definePreset('social', '社交', ['社交天花板', '社牛症患者', '正常社交', '社恐预备役', '已社会性死亡']),
  definePreset('body', '身材', ['维密天使', '穿衣显瘦', '略有肚腩', '米其林', '球形大魔王']),
  definePreset('idol', '偶像', ['神颜·舞台神', '全能ACE', '还可以·路人粉', '糊咖·查无此人', '塌房·快跑']),
  definePreset('worker', '打工人', ['卷王之王', '正常搬砖', '带薪拉屎', '间歇性消失', '已读不回·准备跑路']),
  definePreset('office', '办公室', ['PPT之神', '日报达人', '会议混子', '工位装饰', '空气员工']),
  definePreset('emoji', '表情', ['😍', '😌', '🤔', '😡', '💀']),
  definePreset('milk-tea', '奶茶版', ['全糖快乐', '三分糖清醒', '无糖将就', '代糖欺骗', '白开水赎罪']),
  definePreset('drama', '追剧版', ['熬夜追更', '正常更新', '停更通知', '烂尾预警', '删库不更']),
  definePreset('diet', '减肥版', ['健身房常驻', '瑜伽垫吃灰', '运动鞋散步', '外卖常客', '体重秤爆炸']),
]
