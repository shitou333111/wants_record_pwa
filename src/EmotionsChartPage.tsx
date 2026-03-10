import React, { useState, useRef, useEffect } from 'react';

/* ── 数据 ─────────────────────────────────────────────── */
// 3种想要，颜色匹配首页按钮
const DESIRES = [
  { label: '想被认同', bg: '#dbeafe', color: '#1e40af', border: '#1e40af' },
  { label: '想要控制', bg: '#d1fae5', color: '#065f46', border: '#065f46' },
  { label: '想要安全', bg: '#fef3c7', color: '#92400e', border: '#92400e' },
] as const;

interface EmotionGroup {
  name: string;
  /** 按钮背景色（同首页 emotion-button background-color） */
  btnBg: string;
  /** 按钮文字色（同首页 emotion-button color） */
  btnColor: string;
  subEmotions: string[];
}

// 颜色完全对应首页9个情绪按钮
const EMOTION_GROUPS: EmotionGroup[] = [
  {
    name: '万念俱灰',
    btnBg: '#94a3b8', btnColor: '#334155',
    subEmotions: ['无聊','赢不了','粗心大意','冷淡','被隔离','心如死灰','被击败/被挫败','沮丧','泄气','凄凉/孤独','绝望','气馁','幻想破灭','死定了','精疲力竭','失败','健忘','没出息','放弃','铁石心肠','无可救药','缺乏幽默感','我不行','我不在乎','我不计较','怠慢','漫不经心','优柔寡断','漠不关心','没有存在感','太迟了','懒惰','再等等吧','无精打采','失败者','迷茫','消极','麻木','不堪重负','无能为力','无奈/听天由命','震惊','魂不守舍','神志恍惚','停滞不前','太累了','冷酷无情','漫无目的','没用的/没能力的','模糊不清','浪费/挥霍','有什么用呢','为什么要尝试呢','不值得'],
  },
  {
    name: '悲苦',
    btnBg: '#fda4af', btnColor: '#dc2626',
    subEmotions: ['被遗弃','被辱骂','被指责','极度痛苦','羞耻/耻辱','被背叛','忧郁','被欺骗','绝望','失望','心烦意乱','尴尬','被遗忘','内疚','心碎','头痛','苦恼/沮丧','无助','痛苦','要是……多好','被忽视','信心不足','伤心欲绝','不公平','被冷落/被排挤','渴望/向往','失落忧郁','哀愁','被误解','哀悼','疏于照顾','没人在乎我','没人爱我','怀旧/乡愁','错失机缘','怜悯','我好可怜','遗憾','被拒绝','懊悔','难过','悲哀','泪流满面','被折磨','痛不欲生','被虐待','不开心','不被爱','多余的/没人要','脆弱','为什么是我','受伤'],
  },
  {
    name: '恐惧',
    btnBg: '#93c5fd', btnColor: '#1d4ed8',
    subEmotions: ['担忧/不安','小心谨慎','湿冷/湿粘','怯懦','防御心理强','不信任','怀疑','惧怕','尴尬','逃避','不祥的预感','狂乱','犹豫不决','惊骇','歇斯底里','拘束','缺乏安全感','不理智','恶心','紧张','恐慌','麻痹','偏执','被吓到','偷偷摸摸','不可靠','害羞','多疑','怯场','迷信','猜忌','简短生硬','惊恐','被威胁','胆小','陷入困境','不明确/心神不宁','不自在/不舒服','脆弱/容易受伤','想要逃跑','警惕/小心翼翼','担心'],
  },
  {
    name: '贪求',
    btnBg: '#fcd34d', btnColor: '#d97706',
    subEmotions: ['放纵','期盼','冷酷无情','迫不及待','强迫','渴望','苛刻','不坦诚/狡诈','紧迫感','嫉妒','剥削','过分迷恋','暴怒','失意/不得志','贪吃暴食','贪婪','囤积','饥饿','我想要……','不耐烦/焦躁','淫荡','好色','颐指气使/操纵别人','吝啬','必须得有……','从来都不够','从来都不满足','健忘','痴迷','骄纵任性','占有欲强','掠夺成性','固执己见','鲁莽','无情','诡计多端','自私','狼吞虎咽','荒唐放肆'],
  },
  {
    name: '愤怒',
    btnBg: '#f87171', btnColor: '#b91c1c',
    subEmotions: ['生硬粗暴','争强好斗','恼怒','爱争辩','好战','怒发冲冠','阴郁','刻薄','挑衅','苛求/强人所难','破坏性','嫌恶','暴躁','凶猛','泄气','气愤','狂怒','严厉','憎恨','敌意','不耐烦','愤愤不平','易怒','妒忌','怒气冲冲','疯狂','卑鄙','残忍','凶残','义愤填膺','任性','一意孤行','叛逆','怨恨','抵抗','造反','粗鲁','野蛮','怒气冲天','五内俱焚','郁闷','怀恨在心','冷酷无情','着急','倔强','愠怒','复仇心切','恶毒','暴力','易爆发','邪恶','故意'],
  },
  {
    name: '自尊自傲',
    btnBg: '#c4b5fd', btnColor: '#7e22ce',
    subEmotions: ['无可指责','超然离群','自负','固执己见','自夸','无聊','聪明机灵','封闭','洋洋自得','逞能','轻蔑','酷','挑剔','鄙弃','傲慢专断','假谦虚','伪善','幸灾乐祸','傲慢','自以为是','虚伪','冷冰冰','孤僻','评头论足','假装博学','心胸狭隘','从来都对','武断','专横','优越感十足','虔诚','有偏见','放肆','自以为公正','死板','刚直不屈','自恋','自鸣得意','利己主义/自私','自命不凡','势利眼','独特','被宠坏','禁欲主义','顽固不化','高傲','出众','强硬不妥协','无情','记仇','刚强/不屈服','爱慕虚荣'],
  },
  {
    name: '无畏',
    btnBg: '#6ee7b7', btnColor: '#059669',
    subEmotions: ['爱冒险','警觉','活泼','胸有成竹','清醒明了','目标坚定','有把握','快乐','思路清晰','慈悲','能干','自信','有创造力','勇敢','果断','充满活力','热切','热情','兴奋','有探索精神','灵活变通','专注','慷慨','开心','光荣','幽默','我能行','独立','主动','正直','无敌','有爱','清醒','上进','来者不拒','开放','乐观','有洞察力','积极','意志坚强','善于接受','可迅速恢复','足智多谋','反应快','安全可靠','自给自足','犀利','天真率真','坚强','助人为乐','不知疲倦','精力充沛','乐意','热忱'],
  },
  {
    name: '接纳',
    btnBg: '#a78bfa', btnColor: '#6d28d9',
    subEmotions: ['丰盛','感激','平衡','美丽','有归属感','天真烂漫','慈悲','体贴','高兴','兴高采烈','欣然接受','有同理心','充实','一切都很好','友好','圆满','温和','热情洋溢','亲切','和睦','和谐','凭直觉获知','合拍','欢喜','有爱','大度','成熟','自然真挚','没什么需要改变','开放','轻松/无忧无虑','容光焕发','乐于接受','有安全感','温柔','慈爱','有理解力','温暖','幸福','奇妙'],
  },
  {
    name: '平和',
    btnBg: '#d6d3d1', btnColor: '#4b5563',
    subEmotions: ['永不衰老','有觉悟','存在','无边无际','镇静','完整','不朽','自由','满足','热情','轻快','合一','完美','纯粹','安静','宁静','无限空间','静止','永恒','安宁','无限','一体'],
  },
];

interface Props {
  onClose: () => void;
}

const EmotionsChartPage: React.FC<Props> = ({ onClose }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const activePillRef = useRef<HTMLButtonElement>(null);
  const subListRef = useRef<HTMLDivElement>(null);

  // 滑动检测：区分横向滑动 vs 点击
  const touchStartX = useRef(0);
  const isSwiping = useRef(false);

  // Scroll active pill into view
  useEffect(() => {
    activePillRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeIdx]);

  const selectGroup = (idx: number) => {
    if (idx === activeIdx || animating) return;
    setAnimating(true);
    setActiveIdx(idx);
    if (subListRef.current) subListRef.current.scrollTop = 0;
    setTimeout(() => setAnimating(false), 320);
  };

  const group = EMOTION_GROUPS[activeIdx];

  return (
    <div className="ec-page">
      {/* ── Top bar ── */}
      <div className="ec-topbar">
        <button
          className="ec-back"
          onTouchEnd={(e) => { e.preventDefault(); onClose(); }}
          onClick={onClose}
        >
          ‹ 返回
        </button>
        <span className="ec-topbar-title">情绪表</span>
        <div style={{ width: 48 }} />
      </div>

      {/* ── Sticky header: desires + emotion pills ── */}
      <div className="ec-sticky-header">
        {/* Desires row */}
        <div className="ec-desires-row">
          {DESIRES.map(d => (
            <div
              key={d.label}
              className="ec-desire-chip"
              style={{ background: d.bg, color: d.color, borderColor: d.border }}
            >
              {d.label}
            </div>
          ))}
        </div>

        {/* Emotion group pills — horizontal scroll with swipe detection */}
        <div
          className="ec-pills-track"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
            isSwiping.current = false;
          }}
          onTouchMove={(e) => {
            if (Math.abs(e.touches[0].clientX - touchStartX.current) > 6) {
              isSwiping.current = true;
            }
          }}
        >
          {EMOTION_GROUPS.map((g, i) => (
            <button
              key={g.name}
              ref={i === activeIdx ? activePillRef : undefined}
              className={`ec-pill${i === activeIdx ? ' active' : ''}`}
              style={i === activeIdx
                ? { background: g.btnBg, color: g.btnColor, borderColor: g.btnBg }
                : { borderColor: g.btnBg, color: g.btnColor, background: 'transparent' }
              }
              onTouchEnd={(e) => {
                e.preventDefault();
                if (!isSwiping.current) selectGroup(i);
              }}
              onClick={() => selectGroup(i)}
            >
              {g.name}
              {i !== activeIdx && (
                <span className="ec-pill-count">{g.subEmotions.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable sub-emotions ── */}
      <div className="ec-sub-scroll" ref={subListRef}>
        <div className={`ec-sub-list${animating ? ' ec-sub-entering' : ''}`}>
          <div className="ec-chips-wrap">
            {group.subEmotions.map((e, i) => (
              <div
                key={e}
                className="ec-chip"
                style={{
                  background: group.btnBg + '33',
                  animationDelay: animating ? `${i * 18}ms` : '0ms',
                }}
              >
                {e}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionsChartPage;
