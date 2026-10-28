// Sourced from /workspace/portfolio-content/content.json (profile + experience).
// Public descriptions only: no internal Xiaomi data, metrics, or performance ratings.
export type Lang = 'zh' | 'en'
export type Milestone = {
  id: string
  when: string
  color: [number, number, number] // accent, 0..1
  phrase: Record<Lang, string>
  narrative: Record<Lang, string>
  keywords: Record<Lang, string[]>
}

const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
]

export const milestones: Milestone[] = [
  {
    id: 'origin',
    when: '',
    color: hex('#b48cff'),
    phrase: { zh: '从视觉传达，走向交互', en: 'From visual comm to interaction' },
    narrative: {
      zh: '设计生涯从视觉传达开始，研究生阶段转入交互设计。',
      en: 'His design career began in visual communication, then shifted to interaction design in graduate school.',
    },
    keywords: { zh: ['视觉传达', '交互设计'], en: ['Visual communication', 'Interaction design'] },
  },
  {
    id: 'intern',
    when: '2018 – 2019',
    color: hex('#4fb3ff'),
    phrase: { zh: 'IBM 与微软的实习', en: 'Interning at IBM & Microsoft' },
    narrative: {
      zh: '在 IBM 客户体验与创新中心和微软亚洲研究院做体验设计实习，参与 Design Thinking 工作坊与 Text-to-Viz 相关探索。',
      en: 'UX internships at IBM’s Client Experience & Innovation Center and Microsoft Research Asia — Design Thinking workshops and Text-to-Viz explorations.',
    },
    keywords: { zh: ['Design Thinking', 'UX 研究', 'Text-to-Viz'], en: ['Design Thinking', 'UX research', 'Text-to-Viz'] },
  },
  {
    id: 'feishu',
    when: '2019.10 – 2021',
    color: hex('#2fd6c3'),
    phrase: { zh: '字节跳动 · 飞书设计', en: 'ByteDance · Feishu design' },
    narrative: {
      zh: '校招加入字节跳动飞书，做飞书任务的主设计，并参与第一版设计系统 Universe Design 官网与规范。',
      en: 'Joined ByteDance Feishu via campus hiring — lead designer on Feishu Tasks, and contributor to the first Universe Design system site and guidelines.',
    },
    keywords: { zh: ['Universe Design', 'DS 官网', '飞书任务'], en: ['Universe Design', 'DS website', 'Feishu Tasks'] },
  },
  {
    id: 'kuaishou',
    when: '2022 – 2023',
    color: hex('#ff8a3d'),
    phrase: { zh: '快手 KID · 设计中台', en: 'Kuaishou KID · design platform' },
    narrative: {
      zh: '2022 年加入快手 KID 设计中台，负责企业服务设计系统，推进组件化与工程化。',
      en: 'Joined Kuaishou’s KID design platform in 2022, owning the enterprise-service design system through componentization and engineering.',
    },
    keywords: { zh: ['设计系统', '组件化', '工程化'], en: ['Design system', 'Components', 'Engineering'] },
  },
  {
    id: 'baidu',
    when: '2023.06 –',
    color: hex('#5b7cff'),
    phrase: { zh: '百度 MEUX · 内容生态', en: 'Baidu MEUX · content ecosystem' },
    narrative: {
      zh: '在百度 MEUX 负责内容生态方向设计，建设并维护内容生态设计系统与 Token 体系。',
      en: 'At Baidu MEUX he led content-ecosystem design, building and maintaining its design system and token architecture.',
    },
    keywords: { zh: ['内容生态', 'Design Token', '多主题'], en: ['Content ecosystem', 'Design tokens', 'Multi-theme'] },
  },
  {
    id: 'hyperos',
    when: '2025 –',
    color: hex('#ff5a1f'),
    phrase: { zh: '小米 HyperOS · 设计工程', en: 'Xiaomi HyperOS · design eng' },
    narrative: {
      zh: '现在在小米 HyperOS 做设计系统与设计工程：Token、组件、Figma 插件与 AI 工作流。',
      en: 'Now at Xiaomi HyperOS on design systems and design engineering: tokens, components, Figma plugins and AI workflows.',
    },
    keywords: { zh: ['Token', 'Figma 插件', 'AI 工作流'], en: ['Tokens', 'Figma plugins', 'AI workflows'] },
  },
]

export const ui = {
  zh: {
    name: '薛一飞',
    role: '设计工程师',
    hint: '轻点胶囊暂停 · 左右滑动切换',
    hi: '打个招呼',
    toast: '正在打开 xyf.design',
    lang: 'EN',
  },
  en: {
    name: 'Allen Xue',
    role: 'Design Engineer',
    hint: 'Tap the pill to pause · swipe to browse',
    hi: 'Say hi',
    toast: 'Opening xyf.design',
    lang: '中文',
  },
}
export const SITE = 'https://xyf.design'
