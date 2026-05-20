import { useState, useRef } from 'react';
import type { ExamBank } from '../types/examBank';
import { loadBanks, addBank, removeBank, validateBank, parseBank, loadResults } from '../utils/examBank';
import type { ExamResult } from '../types/examBank';

interface Props {
  onBack: () => void;
  onStartExam: (bank: ExamBank) => void;
}

type Tab = 'banks' | 'import' | 'history' | 'help';

const SAMPLE_BANK = `{
  "exam_title": "法语基础语法测验",
  "description": "覆盖冠词、动词变位和基础句型",
  "time_limit_minutes": 30,
  "pass_score_percent": 60,
  "questions": [
    {
      "id": "q001",
      "type": "single_choice",
      "content": "Quel est l'article défini pour 'maison' ?",
      "options": [
        {"label": "A", "text": "le"},
        {"label": "B", "text": "la"},
        {"label": "C", "text": "les"},
        {"label": "D", "text": "l'"}
      ],
      "correct_answer": "B",
      "explanation": "maison 是阴性名词，使用阴性定冠词 la。",
      "knowledge_tags": ["冠词", "名词性别"],
      "difficulty": "easy"
    },
    {
      "id": "q002",
      "type": "true_false",
      "content": "法语中所有以 -tion 结尾的名词都是阴性的。",
      "correct_answer": "true",
      "explanation": "以 -tion 结尾的法语名词确实都是阴性的，如 la nation, la situation。",
      "knowledge_tags": ["名词性别", "词缀规则"],
      "difficulty": "medium"
    },
    {
      "id": "q003",
      "type": "fill_in_blank",
      "content": "Je ______ étudiant. (être 的第一人称单数变位)",
      "correct_answer": ["suis"],
      "accept_keywords": ["suis"],
      "explanation": "être 的第一人称单数现在时变位是 suis。Je suis = 我是。",
      "knowledge_tags": ["être变位", "动词变位"],
      "difficulty": "easy"
    },
    {
      "id": "q004",
      "type": "writing",
      "content": "Écrivez un court texte pour vous présenter (nom, âge, nationalité, études).",
      "writing_prompt": "Rédigez 50-80 mots. Utilisez les verbes être, avoir, étudier et habiter.",
      "word_limit": 80,
      "correct_answer": "",
      "grading_criteria": ["语法准确性", "词汇丰富度", "内容完整度"],
      "explanation": "自我介绍是法语入门的基本写作练习。注意主语-动词的配合以及形容词的性数一致。",
      "knowledge_tags": ["自我介绍", "基础写作"],
      "difficulty": "medium"
    }
  ]
}`;


type QType = 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_in_blank' | 'short_answer' | 'writing';

const ALL_TYPES: QType[] = ['single_choice', 'multiple_choice', 'true_false', 'fill_in_blank', 'short_answer', 'writing'];

const TYPE_META: Record<QType, { label: string; desc: string; promptRule: string }> = {
  single_choice:   { label: '单选', desc: 'options[]',         promptRule: '选择题需要 options 数组，每个选项包含 label 和 text' },
  multiple_choice: { label: '多选', desc: 'answer: []',        promptRule: '多选题 correct_answer 为数组' },
  true_false:      { label: '判断', desc: '"true"/"false"',    promptRule: '判断题 correct_answer 为 "true" 或 "false"（字符串）' },
  fill_in_blank:   { label: '填空', desc: 'accept_keywords',   promptRule: '填空题可额外提供 accept_keywords（可接受的关键词数组）' },
  short_answer:    { label: '简答', desc: 'scoring_keywords',  promptRule: '简答题可额外提供 scoring_keywords（评分关键词数组，命中 50% 以上视为正确）' },
  writing:         { label: '写作', desc: 'writing_prompt',    promptRule: '写作题需提供 writing_prompt（写作要求）、word_limit（建议字数）、grading_criteria（评分维度数组），correct_answer 留空字符串' },
};

const TYPE_LABEL_MAP: Record<string, string> = {
  single_choice: '单选题(single_choice)', multiple_choice: '多选题(multiple_choice)',
  true_false: '判断题(true_false)', fill_in_blank: '填空题(fill_in_blank)',
  short_answer: '简答题(short_answer)', writing: '写作题(writing)',
};

const QUESTION_SNIPPETS: Record<QType, object> = {
  single_choice: {
    id: 'q001', type: 'single_choice', content: '题目正文',
    options: [{ label: 'A', text: '选项A' }, { label: 'B', text: '选项B' }],
    correct_answer: 'A', explanation: '解析...', knowledge_tags: ['知识点1'], difficulty: 'medium',
  },
  multiple_choice: {
    id: 'q002', type: 'multiple_choice', content: '题目正文',
    options: [{ label: 'A', text: '选项A' }, { label: 'B', text: '选项B' }, { label: 'C', text: '选项C' }],
    correct_answer: ['A', 'C'], explanation: '解析...', knowledge_tags: ['知识点1'], difficulty: 'medium',
  },
  true_false: {
    id: 'q003', type: 'true_false', content: '判断题题目',
    correct_answer: 'true', explanation: '解析...', knowledge_tags: ['知识点1'], difficulty: 'easy',
  },
  fill_in_blank: {
    id: 'q004', type: 'fill_in_blank', content: 'Je ______ français.',
    correct_answer: ['parle'], accept_keywords: ['parle'],
    explanation: '解析...', knowledge_tags: ['动词变位'], difficulty: 'easy',
  },
  short_answer: {
    id: 'q005', type: 'short_answer', content: '请简述法语中冠词的分类。',
    correct_answer: '参考答案...', scoring_keywords: ['定冠词', '不定冠词', '部分冠词'],
    explanation: '解析...', knowledge_tags: ['冠词'], difficulty: 'medium',
  },
  writing: {
    id: 'q006', type: 'writing', content: '写作题题目',
    writing_prompt: '详细写作要求...', word_limit: 100, correct_answer: '',
    grading_criteria: ['语法准确性', '词汇丰富度'],
    explanation: '解析...', knowledge_tags: ['写作'], difficulty: 'hard',
  },
};

function buildSchemaJSON(types: QType[]): string {
  const obj = {
    exam_title: '考试标题',
    description: '考试描述（可选）',
    time_limit_minutes: 60,
    pass_score_percent: 60,
    questions: types.map(t => QUESTION_SNIPPETS[t]),
  };
  return JSON.stringify(obj, null, 2);
}

function buildAIPrompt(types: QType[]): string {
  const typeNames = types.map(t => TYPE_LABEL_MAP[t]).join('、');
  const rules = types.map(t => `- ${TYPE_META[t].promptRule}`).join('\n');
  return `请按照以下 JSON 格式为我出 [N] 道关于 [法语主题] 的练习题。题型包括${typeNames}。

每道题必须包含 id、type、content、correct_answer、explanation（不少于50字的中文详细解析）、knowledge_tags（至少2个知识点标签）和 difficulty 字段。

${rules}

difficulty 只能使用 easy、medium、hard。请确保输出的是合法 JSON。`;
}

export default function ExamBankPage({ onBack, onStartExam }: Props) {
  const [banks, setBanks] = useState<ExamBank[]>(loadBanks);
  const [results] = useState<ExamResult[]>(loadResults);
  const [tab, setTab] = useState<Tab>('banks');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [helpTypes, setHelpTypes] = useState<Set<QType>>(new Set(ALL_TYPES));
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleHelpType = (t: QType) => {
    setHelpTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) { if (next.size > 1) next.delete(t); } // 至少保留1个
      else next.add(t);
      return next;
    });
  };

  const copyWithFeedback = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 1500);
  };

  const selectedTypes = ALL_TYPES.filter(t => helpTypes.has(t));
  const schemaJSON = buildSchemaJSON(selectedTypes);
  const aiPrompt = buildAIPrompt(selectedTypes);

  const tryImport = (text: string) => {
    setError('');
    setSuccess('');
    try {
      const data = JSON.parse(text);
      const err = validateBank(data);
      if (err) { setError(err); return; }
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
    const text = await file.text();
    tryImport(text);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = (id: string) => {
    removeBank(id);
    setBanks(loadBanks());
  };

  const bankResults = (bankId: string) => results.filter(r => r.bankId === bankId);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'banks', label: '题库' },
    { key: 'import', label: '导入' },
    { key: 'history', label: '历史' },
    { key: 'help', label: '帮助' },
  ];

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center p-4">
      <div className="content-width w-full py-6 space-y-4 animate-fade-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="font-display text-sm text-[var(--c-gold)] hover:text-[var(--c-gold-dark)] transition-colors">
            ← Retour
          </button>
          <h1 className="font-display text-lg font-bold text-[var(--c-heading)] tracking-wide">Bibliothèque</h1>
          <div className="w-12" />
        </div>

        {/* Tabs */}
        <div className="flex card-medieval p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 text-sm font-display rounded-lg transition-all duration-300 ${
                tab === t.key
                  ? 'bg-[var(--c-heading)] text-[var(--c-bg)] shadow-sm'
                  : 'text-[var(--c-gold-dark)] hover:text-[var(--c-heading)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'banks' && (
          <div className="space-y-3">
            {banks.length === 0 ? (
              <div className="text-center py-16 space-y-3 animate-fade-in">
                <div className="text-4xl">&#x1F4DA;</div>
                <p className="font-body text-[var(--c-muted)] italic">La bibliothèque est vide</p>
                <button
                  onClick={() => setTab('import')}
                  className="font-display text-sm text-[var(--c-gold)] hover:text-[var(--c-gold-dark)] transition-colors"
                >
                  Importer →
                </button>
              </div>
            ) : (
              banks.map(bank => {
                const history = bankResults(bank.id);
                const best = history.length ? Math.max(...history.map(r => r.score)) : null;
                const typeCount = new Map<string, number>();
                bank.questions.forEach(q => typeCount.set(q.type, (typeCount.get(q.type) || 0) + 1));

                return (
                  <div key={bank.id} className="card-medieval p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-[var(--c-heading)]">{bank.exam_title}</h3>
                        {bank.description && (
                          <p className="font-body text-xs text-[var(--c-gold-dark)] mt-0.5 italic line-clamp-1">{bank.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(bank.id)}
                        className="font-body text-xs text-[var(--c-muted)] hover:text-[var(--c-error)] ml-2 transition-colors"
                      >
                        supprimer
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 text-xs font-body">
                      <span className="px-2 py-0.5 bg-[color-mix(in_srgb,var(--c-heading)_12%,transparent)] text-[var(--c-heading)] rounded-full">
                        {bank.questions.length} questions
                      </span>
                      {bank.time_limit_minutes && (
                        <span className="px-2 py-0.5 bg-[color-mix(in_srgb,var(--c-border)_30%,transparent)] text-[var(--c-secondary)] rounded-full">
                          {bank.time_limit_minutes} min
                        </span>
                      )}
                      {best !== null && (
                        <span className={`px-2 py-0.5 rounded-full ${
                          best >= (bank.pass_score_percent || 60)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          meilleur {best}%
                        </span>
                      )}
                      {[...typeCount.entries()].map(([type, count]) => (
                        <span key={type} className="px-2 py-0.5 bg-[var(--c-bg)] text-[var(--c-muted)] rounded-full">
                          {typeLabel(type)} {count}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => onStartExam(bank)}
                      className="btn-royal mt-3 w-full py-2.5 text-sm"
                    >
                      Commencer
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'import' && (
          <div className="space-y-4">
            {/* Paste JSON */}
            <div className="card-medieval p-5 space-y-3">
              <h3 className="font-display text-sm font-semibold text-[var(--c-heading)]">Coller le JSON</h3>
              <textarea
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder="Collez votre JSON ici..."
                rows={8}
                className="w-full px-3 py-2 rounded-lg border border-[var(--c-border)] bg-[var(--c-card)] text-sm font-mono text-[var(--c-text)] placeholder:text-[var(--c-muted)] focus:border-[var(--c-gold)] focus:ring-1 focus:ring-[color-mix(in_srgb,var(--c-gold)_30%,transparent)] outline-none resize-none transition-colors"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => tryImport(jsonText)}
                  disabled={!jsonText.trim()}
                  className="btn-royal px-5 py-2 text-sm"
                >
                  Importer
                </button>
                <button
                  onClick={() => setJsonText(SAMPLE_BANK)}
                  className="font-body text-sm text-[var(--c-gold)] hover:text-[var(--c-gold-dark)] transition-colors"
                >
                  Exemple
                </button>
              </div>
            </div>

            {/* File upload */}
            <div className="card-medieval p-5 space-y-3">
              <h3 className="font-display text-sm font-semibold text-[var(--c-heading)]">Fichier JSON</h3>
              <p className="font-body text-xs text-[var(--c-gold-dark)] italic">Sélectionnez un fichier .json</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--c-border)] text-sm font-display text-[var(--c-secondary)] rounded-lg hover:border-[var(--c-gold)] hover:text-[var(--c-heading)] cursor-pointer transition-all">
                Choisir un fichier
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json"
                  onChange={handleFile}
                  className="hidden"
                />
              </label>
            </div>

            {error && (
              <div className="p-3 bg-[var(--c-error-row-bg)] border border-[var(--c-error-row-border)] text-[var(--c-error)] text-sm rounded-lg font-body animate-scale-in">{error}</div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg font-body animate-scale-in">{success}</div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-3 stagger-children">
            {results.length === 0 ? (
              <div className="text-center py-16 space-y-3 animate-fade-in">
                <div className="text-4xl">&#x1F3C6;</div>
                <p className="font-body text-[var(--c-muted)] italic">Aucun résultat pour le moment</p>
              </div>
            ) : (
              results.map((r, i) => (
                <div key={i} className="card-medieval p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-[var(--c-heading)]">{r.bankTitle}</h3>
                    <p className="font-body text-xs text-[var(--c-gold-dark)] italic mt-0.5">
                      {new Date(r.date).toLocaleDateString('fr-FR')} · {r.correct}/{r.total}
                    </p>
                  </div>
                  <div className={`font-display text-xl font-bold ${r.score >= 60 ? 'text-[var(--c-success)]' : 'text-[var(--c-error)]'}`}>
                    {r.score}%
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'help' && (
          <div className="space-y-4 stagger-children">
            {/* Type selector */}
            <div className="card-medieval p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-[var(--c-heading)]">Types de questions</h3>
                <span className="font-body text-[10px] text-[var(--c-muted)]">{selectedTypes.length}/{ALL_TYPES.length} 已选</span>
              </div>
              <p className="font-body text-xs text-[var(--c-gold-dark)] italic">点击选择/取消题型，下方 JSON 和 Prompt 会自动更新</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {ALL_TYPES.map(type => {
                  const active = helpTypes.has(type);
                  const meta = TYPE_META[type];
                  return (
                    <button
                      key={type}
                      onClick={() => toggleHelpType(type)}
                      className={`p-2.5 rounded-lg border text-left transition-all duration-200 ${
                        active
                          ? 'bg-[color-mix(in_srgb,var(--c-gold)_12%,transparent)] border-[var(--c-gold)] shadow-sm'
                          : 'bg-[var(--c-bg)] border-[color-mix(in_srgb,var(--c-border)_50%,transparent)] opacity-50'
                      }`}
                    >
                      <span className={`font-display text-xs font-semibold ${active ? 'text-[var(--c-heading)]' : 'text-[var(--c-muted)]'}`}>
                        {meta.label}
                      </span>
                      <p className="font-mono text-[10px] text-[var(--c-gold-dark)] mt-0.5">{meta.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* JSON format — dynamic */}
            <div className="card-medieval p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-[var(--c-heading)]">Format JSON</h3>
                <button
                  onClick={() => copyWithFeedback(schemaJSON, setCopiedSchema)}
                  className="btn-gold px-3 py-1.5 text-xs"
                >
                  {copiedSchema ? '✓ Copié' : 'Copier'}
                </button>
              </div>
              <pre className="overflow-auto rounded-lg bg-[var(--c-code-bg)] p-4 text-xs text-[var(--c-code-text)] leading-relaxed max-h-72 font-mono">
                {schemaJSON}
              </pre>
            </div>

            {/* AI prompt — dynamic */}
            <div className="card-medieval p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-[var(--c-heading)]">Prompt pour l'IA</h3>
                <button
                  onClick={() => copyWithFeedback(aiPrompt, setCopiedPrompt)}
                  className="btn-gold px-3 py-1.5 text-xs"
                >
                  {copiedPrompt ? '✓ Copié' : 'Copier'}
                </button>
              </div>
              <p className="font-body text-xs text-[var(--c-gold-dark)] italic">
                Envoyez ce prompt à ChatGPT/Claude, puis collez le JSON retourné.
              </p>
              <pre className="whitespace-pre-wrap rounded-lg bg-[var(--c-code-bg)] p-4 text-xs text-[var(--c-code-text)] leading-relaxed max-h-48 overflow-auto font-mono">
                {aiPrompt}
              </pre>
            </div>

            {/* Tips */}
            <div className="card-medieval p-5 space-y-2 border-[var(--c-gold)]">
              <h3 className="font-display text-sm font-semibold text-[var(--c-gold)]">&#x2726; Conseils</h3>
              <ul className="font-body text-xs text-[var(--c-secondary)] space-y-1.5 list-none">
                <li>&#x2022; <code className="bg-[color-mix(in_srgb,var(--c-gold)_15%,transparent)] px-1 py-0.5 rounded font-mono text-[10px] text-[var(--c-gold-dark)]">accept_keywords</code> — 填空题支持多种正确写法</li>
                <li>&#x2022; <code className="bg-[color-mix(in_srgb,var(--c-gold)_15%,transparent)] px-1 py-0.5 rounded font-mono text-[10px] text-[var(--c-gold-dark)]">scoring_keywords</code> — 命中 50% 即判正确</li>
                <li>&#x2022; <code className="bg-[color-mix(in_srgb,var(--c-gold)_15%,transparent)] px-1 py-0.5 rounded font-mono text-[10px] text-[var(--c-gold-dark)]">writing</code> — 写作题不自动评分，可一键导出 JSON 交 AI 批改</li>
                <li>&#x2022; 相同 id 重复导入会覆盖更新</li>
                <li>&#x2022; 所有数据保存在本地，不会上传</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    single_choice: '单选',
    multiple_choice: '多选',
    true_false: '判断',
    fill_in_blank: '填空',
    short_answer: '简答',
    writing: '写作',
  };
  return map[type] || type;
}
