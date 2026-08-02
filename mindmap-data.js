window.DOCUMENT_MINDMAP_SCHEMAS = [
  {
    id: 'computer-ch1',
    subject: '计算机',
    title: '第一章 计算机基础',
    subtitle: '按全方位原文档 01—10 的标题组织，卡片仍保留蓝色森林 / 全方位来源。',
    sections: [
      {
        id: 'computer-1-1',
        title: '1.1 计算机基础',
        groups: [
          {
            id: 'computer-01-turing', title: '01-阿兰·图灵',
            summary: '图灵机、图灵测试、人工智能与可计算理论相关内容。',
            pdf: './imports/day-01/alan-turing-source.pdf',
            match: { title: ['图灵'], excludeTitle: ['冯·诺依曼'] }
          },
          {
            id: 'computer-02-von', title: '02-冯·诺依曼',
            summary: '存储程序控制原理、冯·诺依曼体系结构和现代计算机基本组成。',
            pdf: './imports/day-02/von-neumann-source.pdf',
            match: { title: ['冯·诺依曼'] }
          },
          {
            id: 'computer-03-famous', title: '03-著名计算机',
            summary: 'ENIAC、EDVAC、UNIVAC、巴贝奇、香农、神威·太湖之光等代表人物与计算机。',
            pdf: './imports/day-03/computer-pdf/computer-basic-03-famous-computers.pdf',
            match: { title: ['ENIAC','EDVAC','UNIVAC','巴贝奇','香农','神威','著名计算机'] }
          },
          {
            id: 'computer-04-stages', title: '04-发展阶段',
            summary: '计算机分代、硬件元件变化和代表机型。',
            pdf: './imports/day-03/computer-pdf/computer-basic-04-development-stages.pdf',
            match: { title: ['计算机的分代','发展阶段','硬件上的发展'], category: ['发展阶段'] }
          },
          {
            id: 'computer-05-features', title: '05-计算机的特点',
            summary: '速度快、精度高、存储、逻辑判断、自动运行与人机交互。',
            pdf: './imports/day-12/allround-computer/comp-05-characteristics.pdf',
            points: ['运算速度快、精度高','具备存储能力','具备逻辑判断能力','自动运行和自动控制','具备人机交互功能'],
            match: { title: ['计算机的特点','六大特点'], category: ['计算机特点','计算机的特点'] }
          },
          {
            id: 'computer-06-classification', title: '06-计算机的分类',
            summary: '按用途、性能与工作原理分类，包括通用机、专用机、服务器、工作站、微型机和嵌入式计算机。',
            pdf: './imports/day-12/allround-computer/comp-06-classification.pdf',
            points: ['按用途：通用机、专用机','按性能：高性能计算机、服务器、工作站、微型机、嵌入式计算机','嵌入式计算机与单片机'],
            match: { title: ['分类','嵌入式计算机','单片机'], category: ['计算机的分类','嵌入式计算机'] }
          },
          {
            id: 'computer-07-applications', title: '07-计算机的应用',
            summary: '科学计算、数据处理、过程控制、辅助工程、多媒体、网络与人工智能。',
            pdf: './imports/day-12/allround-computer/comp-07-applications.pdf',
            points: ['科学计算','数据处理','过程控制','计算机辅助工程','多媒体技术','计算机网络','人工智能'],
            match: { title: ['计算机的应用','科学计算','数据处理','自动控制','辅助工程','多媒体','物联网','人工智能'], category: ['计算机应用','计算机辅助工程','网络、多媒体与人工智能'] }
          },
          {
            id: 'computer-08-future', title: '08-计算机的未来',
            summary: '发展方向、新型计算机与量子计算，包括巨型化、微型化、网络化、智能化等。',
            pdf: './imports/day-12/allround-computer/comp-08-future.pdf',
            points: ['未来发展方向','光子计算机','生物计算机','量子计算机','量子比特、态叠加、量子纠缠、量子并行'],
            match: { title: ['计算机的未来','四个化','未来方向','新型计算机','量子计算','九章'], category: ['计算机的发展趋势','计算机的未来','量子计算机'] }
          }
        ]
      },
      {
        id: 'computer-1-2',
        title: '1.2 计算思维',
        groups: [
          {
            id: 'computer-09-thinking', title: '09-计算思维',
            summary: '计算思维的基础、概念、本质、特征、基本问题、方法和应用。',
            pdf: './imports/reference-mindmaps/computer/09-computational-thinking.pdf',
            points: ['三大科学思维与四种科学范式','本质：抽象和自动化','特征：概念化、属于人的思维、面向所有人','基本问题：可计算性、计算复杂性、图灵测试','七类计算思维方法','计算物理、化学、生物、经济与教育应用'],
            match: { title: ['计算思维'], category: ['计算思维'] }
          },
          {
            id: 'computer-10-culture', title: '10-计算机文化',
            summary: '文化、数字文化、计算机文化、计算机教育及数字中国。',
            pdf: './imports/reference-mindmaps/computer/10-computer-culture.pdf',
            points: ['文化的概念与特点','数字时代、数字文化和数字世界','四次工业革命与数字中国','计算机文化的形成','计算机能力与计算机文化教育'],
            match: { title: ['计算机文化','数字文化','数字中国'], category: ['计算机文化'] }
          }
        ]
      },
      {
        id: 'computer-system-existing',
        title: '系统现有其他章节',
        dynamicChapters: ['1.2 数制与运算','1.3 信息编码与表示','1.4 计算机系统组成']
      }
    ]
  },
  {
    id: 'english-ch1',
    subject: '英语',
    title: '第一章 基础语法',
    subtitle: '按已上传讲义标题组织，内部再按对应知识点、课堂笔记和题目展开。',
    sections: [
      {
        id: 'english-core', title: '基础语法文档',
        groups: [
          { id:'english-noun', title:'名词', summary:'名词分类、可数与不可数、复数、所有格、数量限定词及句法功能。', match:{ chapter:['名词'], title:['名词'] } },
          { id:'english-pronoun', title:'代词', summary:'人称代词、物主代词、反身代词、指示代词、不定代词和替代词。', match:{ chapter:['代词'], title:['代词'] } },
          { id:'english-article', title:'冠词', summary:'不定冠词、定冠词、零冠词和固定搭配。', match:{ chapter:['冠词'], title:['冠词'] } },
          { id:'english-numeral', title:'数词', summary:'基数词、序数词、数词应用及主谓一致。', match:{ chapter:['数词'], title:['数词'] } },
          { id:'english-sentence', title:'句子成分及句子类型', summary:'句子成分、基本句型及句子类型课堂笔记。', match:{ chapter:['句子结构'], title:['句子成分','句子类型','基本句型'] } },
          { id:'english-overview', title:'语法总览', summary:'词性与基础语法体系总览。', match:{ chapter:['语法总览'], title:['语法总览','词性'] } }
        ]
      }
    ]
  },
  {
    id: 'math-ch1',
    subject: '数学',
    title: '第一章 函数、极限与连续',
    subtitle: '按数学资料中的章节标题组织，知识点、课堂笔记和题目放在同一结构下。',
    sections: [
      {
        id: 'math-functions', title: '函数',
        groups: [
          { id:'math-domain', title:'1.1 函数概念与定义域', summary:'函数概念、定义域及抽象函数定义域。', match:{ chapter:['函数概念与定义域'] } },
          { id:'math-expression', title:'1.1 函数解析式', summary:'代入法、换元法、配凑法等函数解析式求法。', match:{ chapter:['函数解析式'] } },
          { id:'math-classification', title:'1.1 函数分类与分段函数', summary:'函数分类、初等函数、复合函数和分段函数。', match:{ chapter:['函数分类'] } },
          { id:'math-inverse', title:'1.2 反函数', summary:'反函数定义、求法、性质与题目。', match:{ chapter:['反函数'] } },
          { id:'math-graphs', title:'1.2 基本初等函数图像', summary:'幂函数、指数函数、对数函数、三角函数和反三角函数图像。', match:{ chapter:['基本初等函数图像'] } },
          { id:'math-properties', title:'1.3 函数的性质', summary:'奇偶性、单调性、周期性和有界性。', match:{ chapter:['函数的性质'] } },
          { id:'math-formulas', title:'1.4 基础公式与三角函数', summary:'幂指数、代数公式、对数和三角函数基础公式。', match:{ chapter:['基础公式与三角函数'] } },
          { id:'math-elementary', title:'1.4 基本初等函数', summary:'幂、指数、对数、三角及反三角函数。', match:{ chapter:['基本初等函数'] } },
          { id:'math-limit', title:'1.5 极限的概念', summary:'极限概念与全方位原讲义。', match:{ chapter:['极限的概念'] } }
        ]
      }
    ]
  }
];
