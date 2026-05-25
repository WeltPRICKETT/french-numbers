import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { ExamBank, ExamExportMode, ExamSelectionMode, ExamSessionOptions, QuestionType } from '../types/examBank';
import { addBank, getMissedQuestionIds, loadBanks, loadResults, parseBank, removeBank, validateBank } from '../utils/examBank';
import type { ExamResult } from '../types/examBank';

interface Props {
  onBack: () => void;
  onStartExam: (bank: ExamBank, options: ExamSessionOptions) => void;
}

type Tab = 'banks' | 'import' | 'history' | 'help';

const ALL_TYPES: QuestionType[] = [
  'single_choice',
  'multiple_choice',
  'true_false',
  'fill_in_blank',
  'short_answer',
  'writing',
  'listening_single_choice',
  'listening_multiple_choice',
  'listening_fill_in_blank',
];

const TYPE_META: Record<QuestionType, { label: string; note: string }> = {
  single_choice: { label: '单选', note: '需要 options，correct_answer 为选项 label' },
  multiple_choice: { label: '多选', note: '需要 options，correct_answer 为 label 数组' },
  true_false: { label: '判断', note: 'correct_answer 使用 true/false 或 "true"/"false"' },
  fill_in_blank: { label: '填空', note: '可用 accept_keywords 或 blanks' },
  short_answer: { label: '简答', note: '可用 scoring_keywords 自动判分' },
  writing: { label: '写作', note: '可用 writing_prompt、word_limit、grading_criteria' },
  listening_single_choice: { label: '听力单选', note: '需要 audio_text 和 options' },
  listening_multiple_choice: { label: '听力多选', note: '需要 audio_text 和 options' },
  listening_fill_in_blank: { label: '听力填空', note: '需要 audio_text，可用 blanks 做长篇多空' },
};

const QUESTION_SNIPPETS: Record<QuestionType, object> = {
  single_choice: {
    id: 'q001',
    type: 'single_choice',
    content: "Quel est l'article défini pour 'maison' ?",
    options: [{ label: 'A', text: 'le' }, { label: 'B', text: 'la' }],
    correct_answer: 'B',
    explanation: 'maison 是阴性名词，应使用阴性定冠词 la。',
    knowledge_tags: ['冠词', '名词性别'],
    difficulty: 'easy',
  },
  multiple_choice: {
    id: 'q002',
    type: 'multiple_choice',
    content: '哪些形式可以是不定冠词？',
    options: [{ label: 'A', text: 'un' }, { label: 'B', text: 'une' }, { label: 'C', text: 'le' }],
    correct_answer: ['A', 'B'],
    explanation: 'un 和 une 是不定冠词，le 是定冠词。',
    knowledge_tags: ['冠词'],
    difficulty: 'easy',
  },
  true_false: {
    id: 'q003',
    type: 'true_false',
    content: '法语中形容词通常需要和名词保持性数一致。',
    correct_answer: 'true',
    explanation: '多数形容词需要根据名词的阴阳性和单复数变化。',
    knowledge_tags: ['形容词'],
    difficulty: 'easy',
  },
  fill_in_blank: {
    id: 'q004',
    type: 'fill_in_blank',
    content: 'Je ______ étudiant. (être 的第一人称单数)',
    correct_answer: ['suis'],
    accept_keywords: ['suis'],
    explanation: 'être 的 je 变位是 suis。',
    knowledge_tags: ['être', '动词变位'],
    difficulty: 'easy',
  },
  short_answer: {
    id: 'q005',
    type: 'short_answer',
    content: '请简述定冠词和不定冠词的区别。',
    correct_answer: '定冠词用于特指，不定冠词用于泛指。',
    scoring_keywords: ['特指', '泛指', '定冠词', '不定冠词'],
    explanation: '需要同时说明语义差别和常见形式。',
    knowledge_tags: ['冠词'],
    difficulty: 'medium',
  },
  writing: {
    id: 'q006',
    type: 'writing',
    content: 'Écrivez un court texte pour vous présenter.',
    writing_prompt: 'Rédigez 50-80 mots. Utilisez être, avoir, étudier et habiter.',
    word_limit: 80,
    correct_answer: '',
    grading_criteria: ['语法准确性', '词汇丰富度', '内容完整度'],
    explanation: '自我介绍是入门写作常见题型，注意主谓配合。',
    knowledge_tags: ['写作', '自我介绍'],
    difficulty: 'medium',
  },
  listening_single_choice: {
    id: 'l001',
    type: 'listening_single_choice',
    content: '听语音，选择说话人要去的地方。',
    audio_text: 'Je vais à la bibliothèque cet après-midi.',
    options: [{ label: 'A', text: 'la gare' }, { label: 'B', text: 'la bibliothèque' }],
    correct_answer: 'B',
    explanation: '音频中出现 à la bibliothèque。',
    knowledge_tags: ['听力', '地点'],
    difficulty: 'easy',
  },
  listening_multiple_choice: {
    id: 'l002',
    type: 'listening_multiple_choice',
    content: '听语音，选择被提到的物品。',
    audio_text: 'Dans mon sac, il y a un livre et un stylo.',
    options: [{ label: 'A', text: 'un livre' }, { label: 'B', text: 'un stylo' }, { label: 'C', text: 'une pomme' }],
    correct_answer: ['A', 'B'],
    explanation: '音频提到 un livre 和 un stylo。',
    knowledge_tags: ['听力', '名词'],
    difficulty: 'medium',
  },
  listening_fill_in_blank: {
    id: 'l003',
    type: 'listening_fill_in_blank',
    content: '听完整段音频，填入三个空。',
    audio_text: 'Bonjour, je m’appelle Claire. Je suis étudiante à Lyon et j’aime beaucoup apprendre le français.',
    correct_answer: ['Claire', 'étudiante', 'français'],
    blanks: [
      { id: 'b1', label: '姓名', answer: ['Claire', 'claire'] },
      { id: 'b2', label: '身份', answer: ['étudiante', 'etudiante'] },
      { id: 'b3', label: '学习内容', answer: ['français', 'francais'] }
    ],
    explanation: '长篇听力填空可以用 blanks 定义多个答案位，一次播放对应多个填空。',
    knowledge_tags: ['听力', '长篇填空'],
    difficulty: 'medium',
  },
};

const DEFAULT_OPTIONS: ExamSessionOptions = {
  questionCount: 10,
  selectionMode: 'sequential',
  exportMode: 'short_answer_only',
};

function buildSchemaJSON(types: QuestionType[]): string {
  return JSON.stringify({
    exam_title: '题库标题',
    description: '题库说明',
    time_limit_minutes: 30,
    pass_score_percent: 60,
    questions: types.map(type => QUESTION_SNIPPETS[type]),
  }, null, 2);
}

function buildAgentPrompt(types: QuestionType[]): string {
  const typeLines = types.map(type => `- ${type}: ${TYPE_META[type].note}`).join('\n');
  return `请按以下 JSON 结构生成一份法语练习题库。只使用这些题型：\n${typeLines}\n\n要求：\n- 每题包含 id、type、content、correct_answer、explanation、knowledge_tags、difficulty。\n- difficulty 只能是 easy、medium、hard。\n- 选择题必须提供 options。\n- 听力题必须提供 audio_text，系统会用 TTS 播放。\n- 长篇听力填空题请使用 listening_fill_in_blank，并用 blanks 数组定义多个填空。\n- 输出必须是合法 JSON，不要添加 Markdown 代码围栏。`;
}

export default function ExamBankPage({ onBack, onStartExam }: Props) {
  const [banks, setBanks] = useState<ExamBank[]>(loadBanks);
  const [results] = useState<ExamResult[]>(loadResults);
  const [tab, setTab] = useState<Tab>('banks');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [optionsByBank, setOptionsByBank] = useState<Record<string, ExamSessionOptions>>({});
  const [helpTypes, setHelpTypes] = useState<Set<QuestionType>>(() => new Set(ALL_TYPES));
  const [copied, setCopied] = useState<'json' | 'prompt' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedTypes = ALL_TYPES.filter(type => helpTypes.has(type));
  const schemaJSON = buildSchemaJSON(selectedTypes);
  const agentPrompt = buildAgentPrompt(selectedTypes);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'banks', label: '题库' },
    { key: 'import', label: '导入' },
    { key: 'history', label: '历史' },
    { key: 'help', label: '格式' },
  ];

  const getOptions = (bank: ExamBank): ExamSessionOptions => {
    const saved = optionsByBank[bank.id] || DEFAULT_OPTIONS;
    return { ...saved, questionCount: Math.min(saved.questionCount, bank.questions.length) };
  };

  const setBankOption = <K extends keyof ExamSessionOptions>(bank: ExamBank, key: K, value: ExamSessionOptions[K]) => {
    setOptionsByBank(prev => ({ ...prev, [bank.id]: { ...getOptions(bank), [key]: value } }));
  };

  const startExam = (bank: ExamBank) => {
    const options = getOptions(bank);
    const missedIds = getMissedQuestionIds(bank.id).filter(id => bank.questions.some(q => q.id === id));
    const questionIds = options.selectionMode === 'mistakes' ? missedIds : undefined;
    onStartExam(bank, {
      ...options,
      questionCount: Math.max(1, Math.min(options.questionCount, questionIds?.length || bank.questions.length)),
      questionIds,
    });
  };

  const startHistoryMistakes = (result: ExamResult) => {
    const bank = banks.find(item => item.id === result.bankId);
    if (!bank) return;
    const wrongIds = Object.entries(result.answers)
      .filter(([, answer]) => !answer.correct)
      .map(([questionId]) => questionId)
      .filter(questionId => bank.questions.some(q => q.id === questionId));
    if (wrongIds.length === 0) return;
    onStartExam(bank, {
      ...DEFAULT_OPTIONS,
      questionCount: wrongIds.length,
      selectionMode: 'mistakes',
      exportMode: 'short_answer_only',
      questionIds: wrongIds,
    });
  };

  const tryImport = (text: string) => {
    setError('');
    setSuccess('');
    try {
      const data = JSON.parse(text);
      const err = validateBank(data);
      if (err) {
        setError(err);
        return;
      }
      const bank = parseBank(data);
      addBank(bank);
      setBanks(loadBanks());
      setJsonText('');
      setSuccess(`已导入「${bank.exam_title}」，共 ${bank.questions.length} 题。`);
    } catch {
      setError('JSON 格式错误，请检查语法。');
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    tryImport(await file.text());
    if (fileRef.current) fileRef.current.value = '';
  };

  const copyText = (kind: 'json' | 'prompt', text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    });
  };

  const toggleHelpType = (type: QuestionType) => {
    setHelpTypes(prev => {
      const next = new Set(prev);
      if (next.has(type) && next.size > 1) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const handleDelete = (id: string) => {
    removeBank(id);
    setBanks(loadBanks());
  };

  const bankResults = (bankId: string) => results.filter(r => r.bankId === bankId);

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center p-4">
      <div className="content-width w-full py-6 space-y-4 animate-fade-slide-in">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="font-display text-sm text-[var(--c-gold)] hover:text-[var(--c-gold-dark)] transition-colors">
            ← Retour
          </button>
          <h1 className="font-display text-lg font-bold text-[var(--c-heading)] tracking-wide">题库练习</h1>
          <div className="w-12" />
        </div>

        <div className="flex card-medieval p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setError(''); setSuccess(''); }} className={`flex-1 py-2 text-sm font-display rounded-lg transition-all duration-300 ${tab === t.key ? 'bg-[var(--c-heading)] text-[var(--c-bg)] shadow-sm' : 'text-[var(--c-gold-dark)] hover:text-[var(--c-heading)]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'banks' && (
          <div className="space-y-3">
            {banks.length === 0 ? (
              <div className="text-center py-16 space-y-3 animate-fade-in">
                <div className="text-4xl">📚</div>
                <p className="font-body text-[var(--c-muted)] italic">还没有题库</p>
                <button onClick={() => setTab('import')} className="font-display text-sm text-[var(--c-gold)] hover:text-[var(--c-gold-dark)]">去导入 →</button>
              </div>
            ) : (
              banks.map(bank => (
                <BankCard
                  key={bank.id}
                  bank={bank}
                  results={bankResults(bank.id)}
                  options={getOptions(bank)}
                  missedCount={getMissedQuestionIds(bank.id).filter(id => bank.questions.some(q => q.id === id)).length}
                  onSetOption={(key, value) => setBankOption(bank, key, value)}
                  onStart={() => startExam(bank)}
                  onDelete={() => handleDelete(bank.id)}
                />
              ))
            )}
          </div>
        )}

        {tab === 'import' && (
          <div className="space-y-4">
            <div className="card-medieval p-5 space-y-3">
              <h3 className="font-display text-sm font-semibold text-[var(--c-heading)]">粘贴 JSON</h3>
              <textarea value={jsonText} onChange={e => setJsonText(e.target.value)} placeholder="把题库 JSON 粘贴到这里..." rows={8} className="w-full px-3 py-2 rounded-lg border border-[var(--c-border)] bg-[var(--c-card)] text-sm font-mono text-[var(--c-text)] placeholder:text-[var(--c-muted)] focus:border-[var(--c-gold)] outline-none resize-none transition-colors" />
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => tryImport(jsonText)} disabled={!jsonText.trim()} className="btn-royal px-5 py-2 text-sm">导入</button>
                <button onClick={() => setJsonText(buildSchemaJSON(['single_choice', 'fill_in_blank', 'short_answer']))} className="font-body text-sm text-[var(--c-gold)] hover:text-[var(--c-gold-dark)]">基础示例</button>
                <button onClick={() => setJsonText(buildSchemaJSON(['listening_single_choice', 'listening_fill_in_blank']))} className="font-body text-sm text-[var(--c-gold)] hover:text-[var(--c-gold-dark)]">听力示例</button>
              </div>
            </div>

            <div className="card-medieval p-5 space-y-3">
              <h3 className="font-display text-sm font-semibold text-[var(--c-heading)]">导入文件</h3>
              <label className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--c-border)] text-sm font-display text-[var(--c-secondary)] rounded-lg hover:border-[var(--c-gold)] hover:text-[var(--c-heading)] cursor-pointer transition-all">
                选择 .json 文件
                <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
              </label>
            </div>

            {error && <div className="p-3 bg-[var(--c-error-row-bg)] border border-[var(--c-error-row-border)] text-[var(--c-error)] text-sm rounded-lg font-body">{error}</div>}
            {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg font-body">{success}</div>}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-3 stagger-children">
            {results.length === 0 ? (
              <div className="text-center py-16 space-y-3 animate-fade-in">
                <div className="text-4xl">🏆</div>
                <p className="font-body text-[var(--c-muted)] italic">暂无考试记录</p>
              </div>
            ) : (
              results.map((r, i) => {
                const wrongCount = Object.values(r.answers).filter(answer => !answer.correct).length;
                const bankExists = banks.some(bank => bank.id === r.bankId);
                return (
                  <div key={`${r.date}-${i}`} className="card-medieval p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-sm font-semibold text-[var(--c-heading)]">{r.bankTitle}</h3>
                        <p className="font-body text-xs text-[var(--c-gold-dark)] italic mt-0.5">
                          {new Date(r.date).toLocaleString()} · {r.correct}/{Math.max(1, r.total - (r.writingPending || 0))}
                        </p>
                      </div>
                      <div className={`font-display text-xl font-bold ${r.score >= 60 ? 'text-[var(--c-success)]' : 'text-[var(--c-error)]'}`}>{r.score}%</div>
                    </div>
                    <button onClick={() => startHistoryMistakes(r)} disabled={!bankExists || wrongCount === 0} className="btn-royal w-full py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                      {wrongCount > 0 ? `重考本次错题 (${wrongCount})` : '本次没有错题'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'help' && (
          <div className="space-y-4">
            <div className="card-medieval p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-[var(--c-heading)]">可出题型</h3>
                <span className="font-body text-xs text-[var(--c-muted)]">{selectedTypes.length}/{ALL_TYPES.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_TYPES.map(type => {
                  const active = helpTypes.has(type);
                  return (
                    <button key={type} onClick={() => toggleHelpType(type)} className={`p-2.5 rounded-lg border text-left transition-all ${active ? 'border-[var(--c-gold)] bg-[color-mix(in_srgb,var(--c-gold)_12%,transparent)]' : 'border-[var(--c-border)] opacity-55'}`}>
                      <div className="font-display text-xs text-[var(--c-heading)]">{TYPE_META[type].label}</div>
                      <div className="font-body text-[10px] text-[var(--c-muted)] mt-1">{type}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card-medieval p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-[var(--c-heading)]">JSON 模板</h3>
                <button onClick={() => copyText('json', schemaJSON)} className="btn-gold px-3 py-1.5 text-xs">{copied === 'json' ? '已复制' : '复制 JSON'}</button>
              </div>
              <pre className="overflow-auto rounded-lg bg-[var(--c-code-bg)] p-4 text-xs text-[var(--c-code-text)] leading-relaxed max-h-80 font-mono">{schemaJSON}</pre>
            </div>

            <div className="card-medieval p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-[var(--c-heading)]">给 Agent 的出题说明</h3>
                <button onClick={() => copyText('prompt', agentPrompt)} className="btn-gold px-3 py-1.5 text-xs">{copied === 'prompt' ? '已复制' : '复制说明'}</button>
              </div>
              <pre className="whitespace-pre-wrap overflow-auto rounded-lg bg-[var(--c-code-bg)] p-4 text-xs text-[var(--c-code-text)] leading-relaxed max-h-64 font-mono">{agentPrompt}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BankCard({
  bank,
  results,
  options,
  missedCount,
  onSetOption,
  onStart,
  onDelete,
}: {
  bank: ExamBank;
  results: ExamResult[];
  options: ExamSessionOptions;
  missedCount: number;
  onSetOption: <K extends keyof ExamSessionOptions>(key: K, value: ExamSessionOptions[K]) => void;
  onStart: () => void;
  onDelete: () => void;
}) {
  const typeCount = useMemo(() => {
    const map = new Map<QuestionType, number>();
    bank.questions.forEach(q => map.set(q.type, (map.get(q.type) || 0) + 1));
    return [...map.entries()];
  }, [bank.questions]);
  const best = results.length ? Math.max(...results.map(r => r.score)) : null;
  const maxCount = options.selectionMode === 'mistakes' ? Math.max(1, missedCount) : bank.questions.length;
  const canStart = options.selectionMode !== 'mistakes' || missedCount > 0;

  return (
    <div className="card-medieval p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-[var(--c-heading)]">{bank.exam_title}</h3>
          {bank.description && <p className="font-body text-xs text-[var(--c-gold-dark)] mt-0.5 italic">{bank.description}</p>}
        </div>
        <button onClick={onDelete} className="font-body text-xs text-[var(--c-muted)] hover:text-[var(--c-error)] transition-colors">删除</button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-body">
        <Badge>{bank.questions.length} 题</Badge>
        <Badge>错题 {missedCount}</Badge>
        {best !== null && <Badge>最好 {best}%</Badge>}
        {typeCount.map(([type, count]) => <Badge key={type}>{TYPE_META[type].label} {count}</Badge>)}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <label className="font-body text-sm text-[var(--c-secondary)]">
          每次测试题数
          <input type="number" min={1} max={maxCount} value={Math.min(options.questionCount, maxCount)} onChange={e => onSetOption('questionCount', Math.max(1, Math.min(maxCount, Number(e.target.value) || 1)))} className="input-medieval mt-1 w-full" />
        </label>

        <div>
          <div className="font-body text-sm text-[var(--c-secondary)] mb-1">出题方式</div>
          <Segmented value={options.selectionMode} options={[['sequential', '顺序'], ['random', '随机'], ['mistakes', `错题 (${missedCount})`]]} onChange={value => onSetOption('selectionMode', value as ExamSelectionMode)} />
        </div>

        <div>
          <div className="font-body text-sm text-[var(--c-secondary)] mb-1">导出范围</div>
          <Segmented value={options.exportMode} options={[['short_answer_only', '仅简答/写作'], ['all_answered', '全部已答题']]} onChange={value => onSetOption('exportMode', value as ExamExportMode)} />
        </div>
      </div>

      <button onClick={onStart} disabled={!canStart} className="btn-royal w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
        {canStart ? '开始练习' : '暂无可重考错题'}
      </button>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="px-2 py-0.5 bg-[color-mix(in_srgb,var(--c-heading)_10%,transparent)] text-[var(--c-heading)] rounded-full">{children}</span>;
}

function Segmented({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 rounded-lg bg-[color-mix(in_srgb,var(--c-border)_24%,transparent)] p-1">
      {options.map(([key, label]) => (
        <button key={key} type="button" onClick={() => onChange(key)} className={`px-2 py-2 rounded-md text-xs font-display transition-all ${value === key ? 'bg-[var(--c-heading)] text-[var(--c-bg)] shadow-sm' : 'text-[var(--c-secondary)] hover:text-[var(--c-heading)]'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}
