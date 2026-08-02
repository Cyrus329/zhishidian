window.DOCUMENT_MINDMAP_SCHEMAS = [
  {
    id: 'computer-ch1',
    subject: '计算机',
    title: '第一章 计算机基础',
    subtitle: '严格按照原思维导图中的 01—10 小标题组织；需要背诵的知识点和题目挂在对应小标题下面；课堂笔记已移到独立页面。',
    sections: [
      {
        id: 'computer-1-1',
        title: '1.1 计算机基础',
        groups: [
          {
            id: 'computer-01-turing', title: '01-阿兰·图灵',
            summary: '按照原文档标题整理图灵机、图灵测试、人工智能与可计算理论。',
            pdf: './imports/day-01/alan-turing-source.pdf',
            match: { title: ['图灵'], excludeTitle: ['冯·诺依曼'] },
            outline: [
              {id:'turing-machine',title:'图灵机',summary:'抽象计算模型与可计算理论。',match:{keyword:['图灵机','可计算']}},
              {id:'turing-test',title:'图灵测试',summary:'判断机器是否表现出人工智能的测试思想。',match:{keyword:['图灵测试']}},
              {id:'turing-ai',title:'人工智能',summary:'图灵与人工智能思想的关系。',match:{keyword:['人工智能','AI']}}
            ]
          },
          {
            id: 'computer-02-von', title: '02-冯·诺依曼',
            summary: '按照原文档标题整理存储程序控制原理和冯·诺依曼体系结构。',
            pdf: './imports/day-02/von-neumann-source.pdf',
            match: { title: ['冯·诺依曼'] },
            outline: [
              {id:'von-principle',title:'存储程序控制原理',match:{keyword:['存储程序','程序控制']}},
              {id:'von-structure',title:'冯·诺依曼体系结构',match:{keyword:['体系结构','五大部件','运算器','控制器','存储器','输入设备','输出设备']}},
              {id:'von-binary',title:'二进制编码',match:{keyword:['二进制']}}
            ]
          },
          {
            id: 'computer-03-famous', title: '03-著名计算机',
            summary: '按照原文档中的人物和代表计算机小标题组织。',
            pdf: './imports/day-03/computer-pdf/computer-basic-03-famous-computers.pdf',
            match: { title: ['ENIAC','EDVAC','UNIVAC','巴贝奇','香农','神威','著名计算机'] },
            outline: [
              {id:'famous-babbage',title:'巴贝奇',match:{title:['巴贝奇']}},
              {id:'famous-shannon',title:'香农',match:{title:['香农']}},
              {id:'famous-eniac',title:'ENIAC',match:{title:['ENIAC']}},
              {id:'famous-edvac',title:'EDVAC',match:{title:['EDVAC']}},
              {id:'famous-univac',title:'UNIVAC',match:{title:['UNIVAC']}},
              {id:'famous-sunway',title:'神威·太湖之光',match:{title:['神威']}}
            ]
          },
          {
            id: 'computer-04-stages', title: '04-发展阶段',
            summary: '按照计算机分代、硬件元件变化和代表事件组织。',
            pdf: './imports/day-03/computer-pdf/computer-basic-04-development-stages.pdf',
            match: { title: ['计算机的分代','发展阶段','硬件上的发展'], category: ['发展阶段'] },
            outline: [
              {id:'stage-standard',title:'划分标志：物理器件',match:{keyword:['物理器件','划分标志']}},
              {id:'stage-first',title:'第一代：电子管',match:{keyword:['第一代','电子管']}},
              {id:'stage-second',title:'第二代：晶体管',match:{keyword:['第二代','晶体管']}},
              {id:'stage-third',title:'第三代：中小规模集成电路',match:{keyword:['第三代','中小规模集成电路']}},
              {id:'stage-fourth',title:'第四代：大规模、超大规模集成电路',match:{keyword:['第四代','超大规模集成电路','Intel 4004']}}
            ]
          },
          {
            id: 'computer-05-features', title: '05-计算机的特点',
            summary: '原思维导图小标题：参阅、考点、概念、特点。',
            pdf: './imports/day-12/allround-computer/comp-05-characteristics.pdf',
            match: { title: ['计算机的特点','六大特点'], category: ['计算机特点','计算机的特点'] },
            outline: [
              {id:'feature-reference',title:'参阅',children:[
                {id:'feature-textbook',title:'教材 P006~007'},
                {id:'feature-exam',title:'真题 2009-06-单选'}
              ]},
              {id:'feature-points',title:'考点',summary:'速度快、精度高，具有存储、逻辑判断、自动运行和人机交互的能力。',match:{keyword:['速度快','精度高','存储','逻辑判断','自动运行','人机交互']}},
              {id:'feature-content',title:'内容',children:[
                {id:'feature-concept',title:'概念',summary:'计算机是一种按事先存储程序自动、高速处理数据的现代化电子设备。',match:{keyword:['计算机是一种','现代化电子设备']}},
                {id:'feature-list',title:'特点',children:[
                  {id:'feature-speed',title:'运算速度快、精度高',match:{keyword:['运算速度快','精度高','CPU']}},
                  {id:'feature-storage',title:'具备存储能力',match:{keyword:['存储能力','存储设备']}},
                  {id:'feature-logic',title:'具备逻辑判断能力',match:{keyword:['逻辑判断','布尔代数','逻辑机']}},
                  {id:'feature-auto',title:'具备自动运行和自动控制能力',match:{keyword:['自动运行','自动控制','存储程序控制']}},
                  {id:'feature-human',title:'具备人机交互功能',match:{keyword:['人机交互','用户界面']}}
                ]}
              ]}
            ]
          },
          {
            id: 'computer-06-classification', title: '06-计算机的分类',
            summary: '原思维导图小标题：按用途、按性能及其下属类型。',
            pdf: './imports/day-12/allround-computer/comp-06-classification.pdf',
            match: { title: ['分类','嵌入式计算机','单片机'], category: ['计算机的分类','嵌入式计算机'] },
            outline: [
              {id:'class-reference',title:'参阅',children:[
                {id:'class-textbook',title:'教材 P007~009'},
                {id:'class-exam',title:'真题 2011-65-填空'}
              ]},
              {id:'class-points',title:'考点',children:[
                {id:'class-point-use',title:'按用途：专用机和通用机',match:{keyword:['按用途','专用机','通用机']}},
                {id:'class-point-performance',title:'按性能：高性能计算机、服务器、工作站、微型计算机、嵌入式计算机',match:{keyword:['按性能','高性能计算机','服务器','工作站','微型计算机','嵌入式计算机']}}
              ]},
              {id:'class-content',title:'内容',children:[
                {id:'class-use',title:'按用途',children:[
                  {id:'class-general',title:'通用机',match:{keyword:['通用机']}},
                  {id:'class-special',title:'专用机',match:{keyword:['专用机']}}
                ]},
                {id:'class-performance',title:'按性能',children:[
                  {id:'class-hpc',title:'高性能计算机',match:{keyword:['高性能计算机','巨型机','超级计算机']}},
                  {id:'class-server',title:'服务器',match:{keyword:['服务器']}},
                  {id:'class-workstation',title:'工作站',match:{keyword:['工作站']}},
                  {id:'class-micro',title:'微型计算机',match:{keyword:['微型计算机','个人计算机','PC']}},
                  {id:'class-embedded',title:'嵌入式计算机',match:{keyword:['嵌入式计算机']},children:[
                    {id:'class-embedded-concept',title:'概念',match:{keyword:['信息处理部件','嵌入到应用系统']}},
                    {id:'class-chip',title:'单片机',match:{keyword:['单片机']}},
                    {id:'class-embedded-feature',title:'特点：软硬件一体化、应用广泛、数量超过PC',match:{keyword:['软硬件一体化','数量超过PC']}}
                  ]}
                ]}
              ]}
            ]
          },
          {
            id: 'computer-07-applications', title: '07-计算机的应用',
            summary: '原思维导图小标题：科学计算、数据处理、过程控制、辅助工程、多媒体技术、计算机网络、人工智能。',
            pdf: './imports/day-12/allround-computer/comp-07-applications.pdf',
            match: { title: ['计算机的应用','科学计算','数据处理','自动控制','辅助工程','多媒体','物联网','人工智能'], category: ['计算机应用','计算机辅助工程','网络、多媒体与人工智能'] },
            outline: [
              {id:'app-reference',title:'参阅',children:[
                {id:'app-textbook',title:'教材 P009~010'},
                {id:'app-exam',title:'真题 2019-42、2023-22、2024-25'}
              ]},
              {id:'app-points',title:'考点',summary:'科学计算、数据处理、过程控制、计算机辅助工程、多媒体技术、人工智能。'},
              {id:'app-content',title:'内容',children:[
                {id:'app-science',title:'科学计算',match:{keyword:['科学计算','数值计算']},children:[
                  {id:'app-science-concept',title:'概念'},
                  {id:'app-science-field',title:'应用领域'}
                ]},
                {id:'app-data',title:'数据处理',match:{keyword:['数据处理','非数值计算','事务处理']},children:[
                  {id:'app-data-concept',title:'概念'},
                  {id:'app-data-field',title:'应用领域'}
                ]},
                {id:'app-control',title:'过程控制',match:{keyword:['过程控制','自动控制']},children:[
                  {id:'app-control-concept',title:'概念'},
                  {id:'app-control-field',title:'应用领域'}
                ]},
                {id:'app-aided',title:'辅助工程',match:{keyword:['辅助工程','CAD','CAI','CAM','CIMS','CAE']},children:[
                  {id:'app-aided-concept',title:'概念'},
                  {id:'app-aided-class',title:'分类：CAD、CAI、CBE、CAM、CIMS、CAL、CBL、CAE、CAT、CMI、CAPP、EDA'},
                  {id:'app-aided-future',title:'未来：集成化、智能化、协同化、柔性化、绿色化'}
                ]},
                {id:'app-media',title:'多媒体技术',match:{keyword:['多媒体技术']},children:[
                  {id:'app-media-concept',title:'概念'},
                  {id:'app-media-field',title:'应用领域'}
                ]},
                {id:'app-network',title:'计算机网络',match:{keyword:['计算机网络','互联网','物联网']},children:[
                  {id:'app-internet',title:'互联网 Internet'},
                  {id:'app-iot',title:'物联网 IoT'}
                ]},
                {id:'app-ai',title:'人工智能',match:{keyword:['人工智能','机器学习','AlphaGO','CHATGPT']},children:[
                  {id:'app-ai-concept',title:'概念'},
                  {id:'app-ai-field',title:'应用领域'},
                  {id:'app-ai-event',title:'标志事件'}
                ]}
              ]}
            ]
          },
          {
            id: 'computer-08-future', title: '08-计算机的未来',
            summary: '原思维导图小标题：六个化、元件升级、光子计算机、生物计算机、量子计算机。',
            pdf: './imports/day-12/allround-computer/comp-08-future.pdf',
            match: { title: ['计算机的未来','四个化','未来方向','新型计算机','量子计算','九章'], category: ['计算机的发展趋势','计算机的未来','量子计算机'] },
            outline: [
              {id:'future-reference',title:'参阅',children:[
                {id:'future-textbook',title:'教材 P010~011'},
                {id:'future-exam',title:'真题 2008-61-填空'}
              ]},
              {id:'future-points',title:'考点',summary:'计算机的发展方向和计算机元件升级。'},
              {id:'future-content',title:'内容',children:[
                {id:'future-six',title:'六个化',match:{keyword:['巨型化','微型化','网络化','智能化','多核化','多媒体化','四个化']}},
                {id:'future-upgrade',title:'元件升级',children:[
                  {id:'future-photon',title:'光子计算机',match:{keyword:['光子计算机']}},
                  {id:'future-bio',title:'生物计算机',match:{keyword:['生物计算机','分子计算机']}},
                  {id:'future-quantum',title:'量子计算机',match:{keyword:['量子计算机','量子比特','量子纠缠','量子并行','九章']},children:[
                    {id:'future-quantum-concept',title:'概念'},
                    {id:'future-quantum-development',title:'发展'},
                    {id:'future-quantum-principle',title:'原理',children:[
                      {id:'future-qubit',title:'量子比特 Qubit'},
                      {id:'future-superposition',title:'态叠加原理'},
                      {id:'future-space',title:'量子空间'},
                      {id:'future-entanglement',title:'量子纠缠'},
                      {id:'future-parallel',title:'量子并行'}
                    ]},
                    {id:'future-achievement',title:'成就'}
                  ]}
                ]}
              ]}
            ]
          }
        ]
      },
      {
        id: 'computer-1-2',
        title: '1.2 计算思维',
        groups: [
          {
            id: 'computer-09-thinking', title: '09-计算思维',
            summary: '完全按原思维导图中的基础、概念、本质、特征、问题、方法、应用组织。',
            pdf: './imports/reference-mindmaps/computer/09-computational-thinking.pdf',
            match: { title: ['计算思维'], category: ['计算思维'] },
            outline: [
              {id:'thinking-reference',title:'参阅',children:[
                {id:'thinking-textbook',title:'教材 P011~017'},
                {id:'thinking-exam',title:'真题 2018-26、2020-01'}
              ]},
              {id:'thinking-points',title:'考点',summary:'计算思维基础、本质、特征、基本问题、基本方法和应用。'},
              {id:'thinking-content',title:'内容',children:[
                {id:'thinking-base',title:'基础',children:[
                  {id:'thinking-compute',title:'计算'},
                  {id:'thinking-three',title:'三大科学思维',children:[
                    {id:'thinking-theory',title:'理论思维'},
                    {id:'thinking-experiment',title:'实验思维'},
                    {id:'thinking-computational',title:'计算思维'}
                  ]},
                  {id:'thinking-paradigm',title:'四种科学范式',children:[
                    {id:'thinking-paradigm1',title:'第一范式：实验范式'},
                    {id:'thinking-paradigm2',title:'第二范式：理论范式'},
                    {id:'thinking-paradigm3',title:'第三范式：仿真范式'},
                    {id:'thinking-paradigm4',title:'第四范式：数据密集型科学发现'}
                  ]}
                ]},
                {id:'thinking-concept',title:'概念'},
                {id:'thinking-essence',title:'本质',children:[
                  {id:'thinking-abstraction',title:'抽象'},
                  {id:'thinking-automation',title:'自动化'}
                ]},
                {id:'thinking-features',title:'特征',children:[
                  {id:'thinking-feature1',title:'概念化，不是程序化'},
                  {id:'thinking-feature2',title:'是思想，不是人造品'},
                  {id:'thinking-feature3',title:'属于人的，不是计算机的思维'},
                  {id:'thinking-feature4',title:'可由人执行，也可由计算机执行'},
                  {id:'thinking-feature5',title:'基础的，不是机械的技能'},
                  {id:'thinking-feature6',title:'面向所有人、所有地方'}
                ]},
                {id:'thinking-problems',title:'问题',children:[
                  {id:'thinking-computability',title:'可计算性'},
                  {id:'thinking-complexity',title:'计算复杂性'},
                  {id:'thinking-turing-test',title:'图灵测试'}
                ]},
                {id:'thinking-method',title:'方法：计算思维的七大类方法'},
                {id:'thinking-application',title:'应用：计算物理、化学、生物、经济和教育'}
              ]}
            ]
          },
          {
            id: 'computer-10-culture', title: '10-计算机文化',
            summary: '完全按原思维导图中的文化、数字文化、计算机文化、计算机教育组织。',
            pdf: './imports/reference-mindmaps/computer/10-computer-culture.pdf',
            match: { title: ['计算机文化','数字文化','数字中国'], category: ['计算机文化'] },
            outline: [
              {id:'culture-reference',title:'参阅',children:[{id:'culture-textbook',title:'教材 P017~020'}]},
              {id:'culture-points',title:'考点',summary:'文化、数字文化、计算机文化和计算机教育的概念。'},
              {id:'culture-content',title:'内容',children:[
                {id:'culture-general',title:'文化',children:[
                  {id:'culture-concept',title:'概念：广义与狭义'},
                  {id:'culture-features',title:'特点：广泛性、传递性、教育性、深刻性'}
                ]},
                {id:'culture-digital',title:'数字文化',children:[
                  {id:'culture-digital-age',title:'数字时代'},
                  {id:'culture-digital-culture',title:'数字文化'},
                  {id:'culture-digital-world',title:'数字世界'},
                  {id:'culture-industrial',title:'四次工业革命'},
                  {id:'culture-china',title:'数字中国'}
                ]},
                {id:'culture-computer',title:'计算机文化',children:[
                  {id:'culture-early',title:'早期'},
                  {id:'culture-current',title:'目前'}
                ]},
                {id:'culture-education',title:'计算机教育',children:[
                  {id:'culture-ability',title:'能力'},
                  {id:'culture-teaching',title:'教育'}
                ]}
              ]}
            ]
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
    subtitle: '按照资料中的语法大标题和小标题组织，点击小标题可查看对应的必背知识点和题目；课堂笔记从独立页面查看。',
    sections: [
      {
        id: 'english-core', title: '基础语法文档',
        groups: [
          { id:'english-noun', title:'名词', summary:'按名词思维导图的小标题展开。', match:{ chapter:['名词'], title:['名词'] }, outline:[
            {id:'noun-class',title:'名词分类',match:{keyword:['名词分类','专有名词','普通名词','集合名词','物质名词','抽象名词']}},
            {id:'noun-number',title:'名词的数',children:[
              {id:'noun-countability',title:'可数名词与不可数名词',match:{keyword:['可数','不可数']}},
              {id:'noun-regular',title:'规则复数变化',match:{keyword:['规则变化','规则复数']}},
              {id:'noun-irregular',title:'不规则复数变化',match:{keyword:['不规则变化','不规则复数','复合名词']}},
              {id:'noun-special-meaning',title:'复数形式的特殊意义',match:{keyword:['复数表达不一样意义','复数词义变化']}},
              {id:'noun-quantifier',title:'数量限定词与量化表达',match:{keyword:['限定词','量化表达','主谓一致']}}
            ]},
            {id:'noun-case',title:'名词所有格（所属关系）',children:[
              {id:'noun-s',title:"'s所有格",match:{keyword:["'s所有格",'s所有格']}},
              {id:'noun-of',title:'of所有格',match:{keyword:['of所有格']}},
              {id:'noun-double',title:'双重所有格',match:{keyword:['双重所有格']}}
            ]},
            {id:'noun-function',title:'名词的句法功能',match:{keyword:['句法功能','名词作定语']}},
            {id:'noun-concrete',title:'抽象名词具体化与专有名词普通化',match:{keyword:['抽象名词具体化','专有名词普通化']}}
          ]},
          { id:'english-pronoun', title:'代词', summary:'按代词思维导图的小标题展开。', match:{ chapter:['代词'], title:['代词'] }, outline:[
            {id:'pronoun-personal',title:'人称代词',match:{keyword:['人称代词']}},
            {id:'pronoun-possessive',title:'物主代词',match:{keyword:['物主代词']}},
            {id:'pronoun-reflexive',title:'反身代词',match:{keyword:['反身代词']}},
            {id:'pronoun-demonstrative',title:'指示代词',match:{keyword:['指示代词','that与those']}},
            {id:'pronoun-indefinite',title:'不定代词',children:[
              {id:'pronoun-one',title:'one系列',match:{keyword:['one、the one','one系列']}},
              {id:'pronoun-other',title:'other系列',match:{keyword:['other、the other','other系列']}},
              {id:'pronoun-quantity',title:'all、none、both、either、neither',match:{keyword:['all、none','both','either','neither']}},
              {id:'pronoun-some-any',title:'some与any',match:{keyword:['some与any']}},
              {id:'pronoun-composite',title:'复合不定代词',match:{keyword:['复合不定代词']}}
            ]},
            {id:'pronoun-substitute',title:'替代词 it、one、that、those',match:{keyword:['it、one、that、those','替代词']}},
            {id:'pronoun-link',title:'疑问代词、连接代词与关系代词',match:{keyword:['疑问代词','连接代词','关系代词']}}
          ]},
          { id:'english-article', title:'冠词', summary:'按冠词课堂资料的小标题展开。', match:{ chapter:['冠词'], title:['冠词'] }, outline:[
            {id:'article-overview',title:'冠词总览',match:{keyword:['冠词总览']}},
            {id:'article-a-an',title:'不定冠词 a/an',match:{keyword:['不定冠词','a/an']}},
            {id:'article-the',title:'定冠词 the',match:{keyword:['定冠词','the的常见用法']}},
            {id:'article-zero',title:'零冠词',match:{keyword:['零冠词']}},
            {id:'article-phrases',title:'有the/无the与固定短语辨析',match:{keyword:['有the','固定短语']}},
            {id:'article-exercises',title:'冠词练习题',match:{keyword:['冠词练习']}}
          ]},
          { id:'english-numeral', title:'数词', summary:'按数词课堂资料的小标题展开。', match:{ chapter:['数词'], title:['数词'] }, outline:[
            {id:'numeral-cardinal',title:'基数词',children:[
              {id:'numeral-cardinal-form',title:'构成与大数读法',match:{keyword:['基数词构成','大数读法']}},
              {id:'numeral-cardinal-function',title:'句法功能与数量单位',match:{keyword:['句法功能','数量单位']}}
            ]},
            {id:'numeral-ordinal',title:'序数词',match:{keyword:['序数词']}},
            {id:'numeral-use',title:'数词应用',children:[
              {id:'numeral-time',title:'分数、时间、日期、年代与年龄',match:{keyword:['分数、时间','日期','年代','年龄']}},
              {id:'numeral-multiple',title:'倍数、长宽高与主谓一致',match:{keyword:['倍数','长宽高','主谓一致']}}
            ]}
          ]},
          { id:'english-sentence', title:'句子成分及句子类型', summary:'按句子结构资料的小标题展开。', match:{ chapter:['句子结构'], title:['句子成分','句子类型','基本句型'] }, outline:[
            {id:'sentence-components',title:'句子成分',match:{keyword:['句子成分']}},
            {id:'sentence-patterns',title:'五种基本句型',match:{keyword:['五种基本句型','基本句型']}},
            {id:'sentence-linking',title:'系动词与主系表',match:{keyword:['系动词','主系表']}},
            {id:'sentence-objects',title:'双宾语与宾语补足语',match:{keyword:['双宾语','宾语补足语']}},
            {id:'sentence-types',title:'句子类型',match:{keyword:['句子类型']}}
          ]},
          { id:'english-overview', title:'语法总览', summary:'词性与基础语法体系总览。', match:{ chapter:['语法总览'], title:['语法总览','词性'] } }
        ]
      }
    ]
  },
  {
    id: 'math-ch1',
    subject: '数学',
    title: '第一章 函数、极限与连续',
    subtitle: '按照数学课堂资料的小标题组织；需要背诵的知识点和题目挂在相应方法或性质下面；课堂笔记从独立页面查看。',
    sections: [
      {
        id: 'math-functions', title: '函数',
        groups: [
          { id:'math-domain', title:'1.1 函数概念与定义域', summary:'函数概念、函数相同、具体和抽象函数定义域。', match:{ chapter:['函数概念与定义域'] }, outline:[
            {id:'math-function-concept',title:'函数概念与两大要素',match:{keyword:['函数概念','两大要素']}},
            {id:'math-same-function',title:'函数相同的判定',match:{keyword:['函数相同']}},
            {id:'math-domain-common',title:'常见函数定义域',match:{keyword:['常见函数定义域','常见限制']}},
            {id:'math-domain-concrete',title:'具体函数定义域',match:{keyword:['具体定义域','对数','根式','反正弦']}},
            {id:'math-domain-abstract',title:'抽象函数定义域',match:{keyword:['抽象函数定义域','同位置']}},
            {id:'math-domain-piecewise',title:'分段函数定义域',match:{keyword:['分段函数定义域','区间并集']}}
          ]},
          { id:'math-expression', title:'1.1 函数解析式', summary:'代入法、换元法、配凑法和恒等变形。', match:{ chapter:['函数解析式'] }, outline:[
            {id:'math-substitution',title:'代入法',match:{keyword:['代入法']}},
            {id:'math-variable',title:'换元法',match:{keyword:['换元']}},
            {id:'math-completion',title:'配凑法',match:{keyword:['配凑']}},
            {id:'math-identity',title:'恒等变形',match:{keyword:['恒等变形','x−1/x']}}
          ]},
          { id:'math-classification', title:'1.1 函数分类与分段函数', summary:'复合函数、基本初等函数、初等函数和分段函数。', match:{ chapter:['函数分类'] }, outline:[
            {id:'math-composite',title:'复合函数',match:{keyword:['复合函数']}},
            {id:'math-basic-elementary',title:'基本初等函数',match:{keyword:['基本初等函数']}},
            {id:'math-elementary-function',title:'初等函数',match:{keyword:['初等函数']}},
            {id:'math-piecewise',title:'分段函数',match:{keyword:['分段函数']}}
          ]},
          { id:'math-inverse', title:'1.2 反函数', summary:'反函数定义、存在条件、求解步骤、性质和典型题。', match:{ chapter:['反函数'] }, outline:[
            {id:'math-inverse-definition',title:'反函数定义与存在条件',match:{keyword:['反函数定义','存在条件']}},
            {id:'math-inverse-steps',title:'反函数求解步骤',match:{keyword:['求解步骤','反解','交换变量']}},
            {id:'math-inverse-properties',title:'反函数性质',match:{keyword:['反函数性质']}},
            {id:'math-inverse-common',title:'常见互为反函数',match:{keyword:['互为反函数']}},
            {id:'math-inverse-questions',title:'反函数典型题',match:{keyword:['反函数题','定义域回填']}}
          ]},
          { id:'math-graphs', title:'1.2 基本初等函数图像', summary:'幂、指数、对数、三角和反三角函数图像。', match:{ chapter:['基本初等函数图像'] }, outline:[
            {id:'math-graph-power',title:'幂函数',match:{keyword:['幂函数']}},
            {id:'math-graph-exp',title:'指数函数',match:{keyword:['指数函数']}},
            {id:'math-graph-log',title:'对数函数',match:{keyword:['对数函数']}},
            {id:'math-graph-trig',title:'三角函数',match:{keyword:['三角函数']}},
            {id:'math-graph-inverse-trig',title:'反三角函数',match:{keyword:['反三角函数']}}
          ]},
          { id:'math-properties', title:'1.3 函数的性质', summary:'奇偶性、单调性、周期性和有界性。', match:{ chapter:['函数的性质'] }, outline:[
            {id:'math-parity',title:'奇偶性',children:[
              {id:'math-parity-definition',title:'奇偶性定义与判断前提',match:{keyword:['奇偶性定义','判断前提']}},
              {id:'math-parity-odd',title:'常见奇函数',match:{keyword:['常见奇函数']}},
              {id:'math-parity-even',title:'常见偶函数',match:{keyword:['常见偶函数']}},
              {id:'math-parity-rule',title:'奇偶函数运算规律',match:{keyword:['运算规律','奇偶性综合']}}
            ]},
            {id:'math-monotonicity',title:'单调性',match:{keyword:['单调性']}},
            {id:'math-periodicity',title:'周期性',match:{keyword:['周期性']}},
            {id:'math-boundedness',title:'有界性',match:{keyword:['有界性','有界函数']}}
          ]},
          { id:'math-formulas', title:'1.4 基础公式与三角函数', summary:'幂、指数、对数和三角函数常用公式。', match:{ chapter:['基础公式与三角函数'] }, outline:[
            {id:'math-power-laws',title:'幂与指数运算规律',match:{keyword:['幂函数运算规律','指数运算规律']}},
            {id:'math-algebra-formulas',title:'平方、立方与一元二次公式',match:{keyword:['平方与立方','一元二次']}},
            {id:'math-log-laws',title:'对数运算性质',match:{keyword:['对数运算性质']}},
            {id:'math-trig-definition',title:'三角函数定义',match:{keyword:['三角函数定义']}},
            {id:'math-trig-relations',title:'倒数、平方、二倍角与降幂公式',match:{keyword:['倒数关系','平方关系','二倍角','降幂']}},
            {id:'math-special-angles',title:'特殊角三角函数值',match:{keyword:['特殊角']}}
          ]},
          { id:'math-elementary', title:'1.4 基本初等函数', summary:'幂、指数、对数、三角和反三角函数的必背内容。', match:{ chapter:['基本初等函数'] }, outline:[
            {id:'math-elementary-pel',title:'幂、指数、对数函数性质',match:{keyword:['幂、指数、对数','幂指数对数']}},
            {id:'math-elementary-trig',title:'三角函数图像性质与常用公式',match:{keyword:['三角函数图像性质']}},
            {id:'math-elementary-inverse',title:'反三角函数图像与性质',match:{keyword:['反三角函数图像']}}
          ]},
          { id:'math-limit', title:'1.5 极限的概念', summary:'数列极限和函数极限入门。', match:{ chapter:['极限的概念'] }, outline:[
            {id:'math-sequence-limit',title:'数列极限',match:{keyword:['数列极限']}},
            {id:'math-function-limit',title:'函数极限',match:{keyword:['函数极限']}},
            {id:'math-limit-intro',title:'极限概念入门',match:{keyword:['极限概念','极限入门']}}
          ]}
        ]
      }
    ]
  }
];
