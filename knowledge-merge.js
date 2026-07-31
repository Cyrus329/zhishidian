(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.KNOWLEDGE_MERGE_ENGINE = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const RULES = [
    {
      id: "computer-turing",
      subject: "计算机",
      title: "图灵：图灵机、可计算性、图灵测试与图灵奖",
      ids: [
        "D01-COMP-HIST-002",
        "D01-COMP-PDF-001",
        "D01-COMP-TURING-IMAGE-001"
      ],
      aliases: ["图灵", "阿兰图灵"],
      overview: "图灵相关考点可归成四块：图灵机、可计算性、图灵测试、图灵奖。",
      core: [
        "1936年，图灵发表《论可计算数及其在判定问题中的应用》，提出图灵机思想。",
        "图灵机（TM）是假想的抽象数学模型，不是一台实际计算机。",
        "图灵机由无限长的纸带、读写头、控制规则和状态寄存器组成；状态数有限，并含停机状态。",
        "普通图灵机通常针对一个具体问题；通用图灵机（UTM）可以模拟所有图灵机。",
        "丘奇—图灵论题认为：直觉上可计算的函数都能由图灵机计算，反之亦然。",
        "一个问题可计算，当且仅当它能被图灵机在有限步骤内解决。",
        "存在不可计算问题，典型例子是停机问题；现代计算机也不能突破这一可计算边界。",
        "图灵测试通过人机对话判断机器是否表现出类似人类的智能。",
        "图灵被称为“人工智能之父”。",
        "图灵奖由美国计算机学会（ACM）设立，是计算机领域最高奖项；姚期智于2000年获奖。"
      ],
      method: [
        "记忆顺序：模型组成 → 通用图灵机 → 可计算边界 → 测试与奖项。",
        "注意区分：图灵机是理论模型，现代计算机是实际机器。",
        "“可计算”必须同时满足：图灵机能够求解，并且能在有限步骤内结束。"
      ]
    },
    {
      id: "computer-von-neumann",
      subject: "计算机",
      title: "冯·诺依曼与冯·诺依曼体系结构",
      ids: [
        "D01-COMP-HIST-001",
        "D02-COMP-PDF-001",
        "D02-COMP-VON-IMAGE-001"
      ],
      aliases: ["冯诺依曼"]
    },
    {
      id: "computer-features",
      subject: "计算机",
      title: "计算机的特点",
      ids: ["D06-COMP-007", "D12-COMP-PDF-001", "D12-COMP-K-001"],
      aliases: ["计算机的特点", "计算机六大特点"]
    },
    {
      id: "computer-classification",
      subject: "计算机",
      title: "计算机的分类",
      ids: [
        "D03-COMP-CLASS-001",
        "D03-COMP-CLASS-002",
        "D03-COMP-CLASS-003",
        "D12-COMP-PDF-002",
        "D12-COMP-K-002",
        "D12-COMP-K-003"
      ],
      aliases: ["计算机的分类", "按用途和性能分类"]
    },
    {
      id: "computer-applications",
      subject: "计算机",
      title: "计算机的主要应用",
      ids: [
        "D06-COMP-008",
        "D06-COMP-009",
        "D06-COMP-010",
        "D06-COMP-011",
        "D12-COMP-PDF-003",
        "D12-COMP-K-004",
        "D12-COMP-K-005",
        "D12-COMP-K-006"
      ],
      aliases: ["计算机的应用", "计算机辅助工程缩写总表"]
    },
    {
      id: "computer-future",
      subject: "计算机",
      title: "计算机的发展趋势与未来方向",
      ids: [
        "D03-COMP-TREND-001",
        "D03-COMP-TREND-002",
        "D12-COMP-PDF-004",
        "D12-COMP-K-007"
      ],
      aliases: ["计算机的未来", "未来方向与新型计算机"]
    },
    {
      id: "english-possessive",
      subject: "英语",
      title: "名词所有格总表",
      ids: [
        "D02-ENG-NOUN-001",
        "D02-ENG-NOUN-002",
        "D02-ENG-NOUN-003",
        "D11-ENG-NOUN-006",
        "D12-ENG-K-008",
        "D12-ENG-K-009"
      ],
      aliases: ["名词的格与三种所有格总表"]
    },
    {
      id: "english-noun-plural",
      subject: "英语",
      title: "可数名词复数变化",
      ids: [
        "D03-ENG-NOUN-004",
        "D03-ENG-NOUN-005",
        "D03-ENG-NOUN-006",
        "D03-ENG-NOUN-007",
        "D11-ENG-NOUN-002",
        "D12-ENG-K-005",
        "D12-ENG-K-006"
      ],
      aliases: ["可数名词复数变化总表", "规则复数变化", "不规则复数与复合名词"]
    },
    {
      id: "english-uncountable",
      subject: "英语",
      title: "不可数名词与量化表达",
      ids: [
        "D03-ENG-NOUN-009",
        "D03-ENG-NOUN-010",
        "D03-ENG-NOUN-011",
        "D03-ENG-NOUN-012",
        "D11-ENG-NOUN-005",
        "D12-ENG-K-007"
      ],
      aliases: ["不可数名词的量化表达", "不可数名词量化与advice辨析"]
    },
    {
      id: "english-sentence-structure",
      subject: "英语",
      title: "句子成分、基本句型与句子类型",
      ids: [
        "D02-ENG-SENT-004",
        "D02-ENG-SENT-005",
        "D02-ENG-NOTE-001",
        "D02-ENG-NOTE-002",
        "D02-ENG-NOTE-003",
        "D02-ENG-NOTE-004",
        "D02-ENG-NOTE-005",
        "D02-ENG-NOTE-006"
      ],
      aliases: ["句子成分核心", "五种基本句型", "句子成分及句子类型"]
    },
    {
      id: "english-pronoun-substitution",
      subject: "英语",
      title: "it、one、that、those替代词辨析",
      ids: [
        "D05-ENG-PRON-001",
        "D05-ENG-PRON-002",
        "D05-ENG-PRON-003",
        "D11-ENG-PRON-005"
      ],
      aliases: ["替代词it、one、that、those"]
    },
    {
      id: "english-articles",
      subject: "英语",
      title: "冠词总览：a/an、the与零冠词",
      ids: [
        "D06-ENG-001",
        "D06-ENG-002",
        "D06-ENG-003",
        "D06-ENG-004",
        "D12-ENG-PDF-003",
        "D12-ENG-K-010",
        "D12-ENG-K-011",
        "D12-ENG-K-012"
      ],
      aliases: ["冠词全方位扫描讲义", "冠词总览与aan"]
    },
    {
      id: "math-domain",
      subject: "数学",
      title: "函数定义域：具体函数与抽象函数",
      ids: [
        "D02-MATH-KNOW-002",
        "D02-MATH-KNOW-003",
        "D02-MATH-KNOW-004",
        "D02-MATH-NOTE-002",
        "D02-MATH-NOTE-003",
        "D02-MATH-NOTE-004",
        "D12-MATH-BF-001"
      ],
      aliases: ["抽象函数定义域同位置法", "常见函数定义域"]
    },
    {
      id: "math-inverse",
      subject: "数学",
      title: "反函数：定义、求法与性质",
      ids: [
        "D03-MATH-NOTE-001",
        "D12-MATH-BF-004",
        "D12-MATH-BF-005",
        "D12-MATH-QFW-002"
      ],
      aliases: ["求解步骤反函数", "反函数定义存在条件与求解步骤", "反函数性质与常见互反函数"]
    },
    {
      id: "math-parity",
      subject: "数学",
      title: "函数奇偶性：定义、判断与常见函数",
      ids: [
        "D03-MATH-PROP-001",
        "D03-MATH-PROP-002",
        "D03-MATH-PROP-003",
        "D12-MATH-BF-006",
        "D12-MATH-BF-007"
      ],
      aliases: ["奇偶性定义", "奇偶性定义与判断前提", "常见奇偶函数与运算规律"]
    },
    {
      id: "math-power-exp-log",
      subject: "数学",
      title: "幂函数、指数函数与对数函数",
      ids: [
        "D05-MATH-GRAPH-001",
        "D05-MATH-GRAPH-002",
        "D05-MATH-GRAPH-003",
        "D06-MATH-001",
        "D06-MATH-005",
        "D06-MATH-006",
        "D12-MATH-BF-010"
      ],
      aliases: ["幂指数对数函数性质"]
    },
    {
      id: "math-trigonometry",
      subject: "数学",
      title: "三角函数图像、性质与常用公式",
      ids: [
        "D05-MATH-GRAPH-004",
        "D06-MATH-007",
        "D06-MATH-008",
        "D06-MATH-009",
        "D06-MATH-010",
        "D06-MATH-011",
        "D06-MATH-012",
        "D12-MATH-BF-011"
      ],
      aliases: ["三角函数图像性质与常用公式"]
    },
    {
      id: "math-inverse-trigonometry",
      subject: "数学",
      title: "反三角函数图像与性质",
      ids: ["D05-MATH-GRAPH-005", "D12-MATH-BF-012"],
      aliases: ["反三角函数图像与性质"]
    }
  ];

  function normalizeTitle(value) {
    return String(value || "")
      .replace(/[（(][^）)]*[）)]/g, "")
      .replace(
        /PDF专题|知识点图|扫描笔记|课堂笔记|全方位扫描讲义|全方位|蓝色森林|专题|笔记整理|笔记|详解|重点/g,
        ""
      )
      .replace(/第\d+组|[（(]?\d+[）)]?/g, "")
      .replace(/[·\s：:、，。—–\-_/｜|]/g, "")
      .toLowerCase();
  }

  function normalizeSentence(value) {
    return String(value || "")
      .replace(/\[\[(.*?)\]\]/g, "$1")
      .replace(/^[•·\-—\d.、）)\s]+/, "")
      .replace(/[“”"'‘’（）()\[\]【】\s，。；：、！？,.!?;:]/g, "")
      .toLowerCase();
  }

  function sentenceScore(value) {
    const text = String(value || "");
    let score = Math.min(text.length, 100);
    if (/这张卡|单独保存|完全按照|图片知识点|PDF列出|来源于图片/.test(text)) score -= 120;
    if (/当且仅当|定义|组成|区别|步骤|条件|核心|最高|典型/.test(text)) score += 12;
    return score;
  }

  function bigrams(value) {
    const text = normalizeSentence(value);
    const result = new Set();
    for (let index = 0; index < text.length - 1; index += 1) {
      result.add(text.slice(index, index + 2));
    }
    return result;
  }

  function similarity(left, right) {
    const a = bigrams(left);
    const b = bigrams(right);
    if (!a.size || !b.size) return 0;
    let overlap = 0;
    a.forEach(token => {
      if (b.has(token)) overlap += 1;
    });
    return overlap / (a.size + b.size - overlap);
  }

  function dedupeSentences(lines, limit = Infinity) {
    const result = [];
    for (const raw of lines || []) {
      const text = String(raw || "").replace(/\[\[(.*?)\]\]/g, "$1").trim();
      const normalized = normalizeSentence(text);
      if (!normalized || normalized.length < 3) continue;
      if (/这张卡.*单独|完全按照.*保存|只保留图中/.test(text)) continue;
      const duplicateIndex = result.findIndex(existing => {
        const other = normalizeSentence(existing);
        const shorter = Math.min(normalized.length, other.length);
        const longer = Math.max(normalized.length, other.length);
        const contained =
          (normalized.includes(other) || other.includes(normalized)) &&
          shorter / Math.max(1, longer) >= 0.58;
        return contained || similarity(text, existing) >= 0.72;
      });
      if (duplicateIndex >= 0) {
        if (sentenceScore(text) > sentenceScore(result[duplicateIndex])) {
          result[duplicateIndex] = text;
        }
        continue;
      }
      result.push(text);
      if (result.length >= limit) break;
    }
    return result;
  }

  function isQuestionCard(item) {
    return (
      /(?:^|-)Q(?:-|$)/.test(String(item?.id || "")) ||
      /题目|例题|练习|选择题|填空题/.test(String(item?.recordType || "")) ||
      /例题|练习|选择题|填空题|求f\(|已知f\(/.test(String(item?.title || ""))
    );
  }

  function chapterKey(item) {
    return `${item?.subject || ""}|${String(item?.chapter || "")
      .replace(/\s+/g, "")
      .toLowerCase()}`;
  }

  function matchRule(item) {
    const normalized = normalizeTitle(item?.title);
    return (
      RULES.find(rule => {
        if (rule.subject !== item?.subject) return false;
        if ((rule.ids || []).includes(item?.id)) return true;
        return (rule.aliases || []).map(normalizeTitle).includes(normalized);
      }) || null
    );
  }

  function buildMergeIndex(items) {
    const pending = new Map();
    for (const item of items || []) {
      if (!item || isQuestionCard(item)) continue;
      const rule = matchRule(item);
      const normalized = normalizeTitle(item.title);
      if (!rule && normalized.length < 2) continue;
      const key = rule
        ? `rule:${rule.id}`
        : `auto:${chapterKey(item)}:${normalized}`;
      if (!pending.has(key)) {
        pending.set(key, {
          id: rule?.id || key,
          title: rule?.title || item.title,
          subject: item.subject,
          rule,
          items: []
        });
      }
      pending.get(key).items.push(item);
    }

    const groups = new Map();
    const byItemId = new Map();
    pending.forEach((group, key) => {
      if (group.items.length < 2) return;
      group.items.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
      groups.set(key, group);
      group.items.forEach(item => byItemId.set(item.id, group));
    });
    return { groups, byItemId };
  }

  function groupFor(item, index) {
    return item && index ? index.byItemId.get(item.id) || null : null;
  }

  function groupLines(group, field) {
    const lines = [];
    group.items.forEach(item => {
      lines.push(...(item[field] || []));
      (item.memoBlocks || []).forEach(block => {
        if (field === "mustPatterns") lines.push(...(block.mustKnow || []));
        if (field === "basicExplain") lines.push(...(block.understanding || []));
      });
    });
    return lines;
  }

  function summaryFor(item, index) {
    const group = groupFor(item, index);
    if (!group) return null;
    const rule = group.rule || {};
    const core = rule.core
      ? [...rule.core]
      : dedupeSentences(groupLines(group, "mustPatterns"), 12);
    const method = rule.method
      ? [...rule.method]
      : dedupeSentences(groupLines(group, "basicExplain"), 6);
    const mistakes = dedupeSentences(
      group.items.flatMap(entry => entry.examRefine || []),
      4
    );
    const keywords = dedupeSentences(
      group.items.flatMap(entry => entry.keywords || []),
      6
    );
    return {
      overview:
        rule.overview ||
        `${group.title}已合并 ${group.items.length} 张同主题卡片，下面只保留不重复、适合抄写的内容。`,
      core,
      method,
      mistakes,
      conclusion: core[0] || group.title,
      mnemonic: keywords.join(" → "),
      sourceLabel: `${group.items.length}张同主题卡片合并`,
      mergedTitle: group.title,
      mergedCount: group.items.length,
      mergeGroupId: group.id,
      sourceIds: group.items.map(entry => entry.id),
      sourceTitles: group.items.map(entry => entry.title)
    };
  }

  function exportItems(items, index) {
    const seen = new Set();
    return (items || []).filter(item => {
      const group = groupFor(item, index);
      if (!group) return true;
      if (seen.has(group.id)) return false;
      seen.add(group.id);
      return true;
    });
  }

  return {
    RULES,
    normalizeTitle,
    dedupeSentences,
    buildMergeIndex,
    groupFor,
    summaryFor,
    exportItems
  };
});
