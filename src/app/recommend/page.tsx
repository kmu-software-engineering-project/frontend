'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

/* ──────────────────── option data ──────────────────── */

const BOOK_TYPE_OPTIONS = ['소설', '에세이', '시/문학', '비문학'];

const GENRE_LITERATURE_OPTIONS = [
  '로맨스', '판타지', 'SF', '추리/미스터리', '스릴러',
  '공포', '역사소설', '성장소설', '가족소설', '휴먼드라마',
  '고전문학', '현대문학',
];

const GENRE_NONFICTION_OPTIONS = [
  '인문/철학', '심리', '자기계발', '경제/경영', '사회/정치',
  '역사', '과학', '기술/IT', '예술/문화', '여행', '건강', '교육', '종교',
];

const FIELD_OPTIONS = [
  '인간관계', '사랑', '성장', '위로/힐링', '자존감', '심리', '삶의 의미',
  '돈/투자', '일/커리어', '사회문제', '역사', '과학/기술',
  '예술/창작', '여행', '미스터리', '새로운 세계관',
];

const PURPOSE_OPTIONS = [
  '몰입', '기분 전환', '위로', '지식 습득', '생각거리',
  '가벼운 독서', '깊이 있는 독서', '과제·독후감', '새로운 취향 발견',
];

const ATMOSPHERE_OPTIONS = [
  '따뜻한', '어두운', '감성적인', '유쾌한', '잔잔한',
  '철학적인', '긴장감 있는', '현실적인', '몽환적인', '희망적인', '슬픈',
];

const DIFFICULTY_OPTIONS = [
  '아주 쉽게 읽히는 책', '적당히 생각하면서 읽는 책', '문장이 좋은 책',
  '전문적인 책', '깊이 있는 책', '짧고 가벼운 책', '긴 분량도 괜찮은 책',
];

/* ──────────────────── step config ──────────────────── */

type Step =
  | 'bookType' | 'genre' | 'interest' | 'purpose'
  | 'atmosphere' | 'difficulty' | 'pastBooks' | 'avoidElements';

const MULTI_SELECT_STEPS = new Set<Step>(['genre', 'interest', 'purpose', 'atmosphere', 'difficulty']);
const TEXT_ONLY_STEPS    = new Set<Step>(['pastBooks', 'avoidElements']);
const OPTIONAL_STEPS     = new Set<Step>(['pastBooks', 'avoidElements']);

function getSteps(bookType?: string): Step[] {
  const steps: Step[] = ['bookType', 'genre', 'interest', 'purpose'];
  if (!bookType || bookType !== '비문학') steps.push('atmosphere');
  steps.push('difficulty', 'pastBooks', 'avoidElements');
  return steps;
}

interface StepMeta {
  label: string;
  question: string;
  hint: string;
  placeholder: string;
  customPlaceholder: string;
  options: string[];
  optional?: boolean;
  multi?: boolean;
  textOnly?: boolean;
}

const STEP_META_BASE: Record<Step, Omit<StepMeta, 'options' | 'multi' | 'textOnly'>> = {
  bookType:      { label: '도서 유형',        question: '어떤 유형의 책을 찾고 계신가요?',  hint: '한 가지를 선택하거나 직접 입력하세요',  placeholder: '',              customPlaceholder: '예: 만화, 잡지 등 직접 입력...' },
  genre:         { label: '장르',             question: '선호하는 장르가 있나요?',           hint: '여러 개 선택하거나 직접 입력할 수 있어요', placeholder: '',             customPlaceholder: '예: 무협, 라이트노벨 등 직접 입력...' },
  interest:      { label: '끌리는 분야',      question: '요즘 어떤 분야에 끌리시나요?',      hint: '여러 개 선택하거나 직접 입력할 수 있어요', placeholder: '',             customPlaceholder: '다른 분야가 있다면 직접 입력...' },
  purpose:       { label: '독서 목적',        question: '어떤 목적으로 책을 읽으시나요?',    hint: '여러 개 선택하거나 직접 입력할 수 있어요', placeholder: '',             customPlaceholder: '다른 목적이 있다면 직접 입력...' },
  atmosphere:    { label: '선호 분위기',      question: '어떤 분위기의 책을 원하시나요?',    hint: '여러 개 선택하거나 직접 입력할 수 있어요', placeholder: '',             customPlaceholder: '다른 분위기가 있다면 직접 입력...' },
  difficulty:    { label: '읽기 난이도',      question: '어떤 난이도의 책을 원하시나요?',    hint: '여러 개 선택하거나 직접 입력할 수 있어요', placeholder: '',             customPlaceholder: '원하는 스타일이 있다면 직접 입력...' },
  pastBooks:     { label: '취향 도서',        question: '재밌게 읽었던 책이 있나요?',        hint: '입력하거나 건너뛸 수 있어요',           placeholder: '책 제목을 입력하세요', customPlaceholder: '' },
  avoidElements: { label: '피하고 싶은 요소', question: '피하고 싶은 요소가 있나요?',        hint: '입력하거나 건너뛸 수 있어요',           placeholder: '자유롭게 입력하세요', customPlaceholder: '' },
};

/* ──────────────────── form state ──────────────────── */

interface FormData {
  bookType?: string;
  genre?: string[];
  interest?: string[];
  purpose?: string[];
  atmosphere?: string[];
  difficulty?: string[];
  pastBooks?: string;
  avoidElements?: string;
}

function getStringValue(data: FormData, step: Step): string {
  const v = (data as Record<string, unknown>)[step];
  if (Array.isArray(v)) return v.join(', ');
  return (v as string | undefined) ?? '';
}

/* ──────────────────── component ──────────────────── */

export default function RecommendPage() {
  const router = useRouter();

  const [formData,     setFormData]     = useState<FormData>({});
  const [steps,        setSteps]        = useState<Step[]>(getSteps());
  const [currentStep,  setCurrentStep]  = useState(0);
  const [phase,        setPhase]        = useState<'enter' | 'idle' | 'exit'>('enter');

  const [selected,     setSelected]     = useState<string[]>([]);  // multi-select buffer
  const [textValue,    setTextValue]    = useState('');             // text-only (pastBooks/avoid) buffer
  const [customInput,  setCustomInput]  = useState('');             // free-type-add buffer

  const textInputRef   = useRef<HTMLInputElement>(null);  // for text-only steps
  const customInputRef = useRef<HTMLInputElement>(null);  // for the "직접 입력" row

  const step   = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const genreOptions = formData.bookType === '비문학' ? GENRE_NONFICTION_OPTIONS : GENRE_LITERATURE_OPTIONS;

  function getMeta(s: Step): StepMeta {
    const base     = STEP_META_BASE[s];
    const multi    = MULTI_SELECT_STEPS.has(s);
    const textOnly = TEXT_ONLY_STEPS.has(s);
    const options  =
      s === 'bookType'    ? BOOK_TYPE_OPTIONS    :
      s === 'genre'       ? genreOptions         :
      s === 'interest'    ? FIELD_OPTIONS         :
      s === 'purpose'     ? PURPOSE_OPTIONS       :
      s === 'atmosphere'  ? ATMOSPHERE_OPTIONS    :
      s === 'difficulty'  ? DIFFICULTY_OPTIONS    :
      [];
    return { ...base, options, optional: OPTIONAL_STEPS.has(s), multi, textOnly };
  }

  const meta = getMeta(step);

  /* Recompute steps when bookType changes */
  useEffect(() => {
    setSteps(getSteps(formData.bookType));
  }, [formData.bookType]);

  /* Reset buffers on step change */
  useEffect(() => {
    setPhase('enter');
    setSelected([]);
    setTextValue('');
    setCustomInput('');
    const t = setTimeout(() => {
      setPhase('idle');
      if (meta.textOnly) textInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  /* ── Advance to next step ── */
  const advance = (value: string) => {
    const isOptional = OPTIONAL_STEPS.has(step);
    if (!value.trim() && !isOptional) return;

    const updated: FormData = { ...formData };
    if (meta.multi) {
      // flush any pending custom text before saving
      const pendingCustom = customInput.trim();
      const finalSelected = pendingCustom && !selected.includes(pendingCustom)
        ? [...selected, pendingCustom]
        : selected;
      (updated as Record<string, unknown>)[step] = finalSelected;
    } else if (meta.textOnly) {
      (updated as Record<string, unknown>)[step] = value;
    } else {
      (updated as Record<string, unknown>)[step] = value;
    }
    setFormData(updated);
    setPhase('exit');

    setTimeout(() => {
      if (isLast) {
        const params = new URLSearchParams();
        (Object.keys(updated) as Step[]).forEach(k => {
          const v = getStringValue(updated, k);
          if (v.trim()) params.set(k, v);
        });
        router.push(`/recommend/result?${params.toString()}`);
      } else {
        setCurrentStep(c => c + 1);
      }
    }, 350);
  };

  /* ── Toggle chip (multi-select) ── */
  const toggleChip = (opt: string) => {
    setSelected(prev =>
      prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]
    );
  };

  /* ── Add custom text to selection ── */
  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;

    if (meta.multi) {
      // add to selected set if not already there
      if (!selected.includes(trimmed)) {
        setSelected(prev => [...prev, trimmed]);
      }
      setCustomInput('');
      customInputRef.current?.focus();
    } else {
      // bookType single-select: advance directly
      advance(trimmed);
    }
  };

  /* ── Single-select chip (bookType) ── */
  const selectSingle = (opt: string) => advance(opt);

  /* ── Can the main "다음" button fire? ── */
  const canAdvance =
    OPTIONAL_STEPS.has(step)  ? true :
    meta.multi                 ? selected.length > 0 || customInput.trim().length > 0 :
    meta.textOnly              ? textValue.trim().length > 0 :
    customInput.trim().length > 0; // bookType with custom text typed

  const progress = ((currentStep + (phase === 'idle' ? 0.3 : 0)) / steps.length) * 100;

  /* ── Derived: total selections including pending custom ── */
  const totalCount = meta.multi
    ? selected.length + (customInput.trim() && !selected.includes(customInput.trim()) ? 1 : 0)
    : 0;

  return (
    <div className="rp-root">
      <style dangerouslySetInnerHTML={{ __html: `
        .rp-root {
          min-height: 100vh;
          background: #f8f7ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1.25rem 8rem;
          position: relative;
          overflow-x: hidden;
        }
        .rp-root::before, .rp-root::after {
          content: '';
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .rp-root::before {
          width: 560px; height: 560px;
          background: radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%);
          top: -180px; left: -160px;
        }
        .rp-root::after {
          width: 440px; height: 440px;
          background: radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%);
          bottom: -100px; right: -120px;
        }

        .rp-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 560px;
        }

        /* ── Top bar ── */
        .rp-topbar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.75rem;
        }
        .rp-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 50%;
          cursor: pointer;
          color: #6b7280;
          font-size: 1rem;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .rp-back-btn:hover { background: #ede9fe; border-color: #c7d2fe; color: #4f46e5; }
        .rp-back-btn:disabled { opacity: 0.3; cursor: default; }

        .rp-progress-wrap { flex: 1; }
        .rp-progress-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #8b5cf6;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 0.3rem;
        }
        .rp-progress-track {
          height: 4px;
          background: #ede9fe;
          border-radius: 999px;
          overflow: hidden;
        }
        .rp-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          border-radius: 999px;
          transition: width 0.55s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ── Step dots ── */
        .rp-dots {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }
        .rp-dot {
          height: 4px;
          border-radius: 999px;
          transition: all 0.3s ease;
          background: #ddd6fe;
          width: 22px;
        }
        .rp-dot.done   { background: #a5b4fc; }
        .rp-dot.active { background: linear-gradient(90deg,#6366f1,#8b5cf6); width: 36px; }

        /* ── Previous answers ── */
        .rp-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-bottom: 1.5rem;
        }
        .rp-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.22rem 0.65rem;
          background: #ede9fe;
          border: 1px solid #c7d2fe;
          border-radius: 999px;
          font-size: 0.73rem;
          color: #4338ca;
          font-weight: 500;
          animation: tagIn 0.24s ease;
        }
        .rp-tag-key {
          color: #a5b4fc;
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }
        .rp-tag-skipped { color: #c4b5fd; font-style: italic; }
        @keyframes tagIn { from { opacity:0; transform:scale(0.82); } to { opacity:1; transform:scale(1); } }

        /* ── Card ── */
        .rp-card {
          transition: opacity 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.32s cubic-bezier(0.4,0,0.2,1);
        }
        .rp-card.enter { opacity: 0; transform: translateY(18px) scale(0.988); }
        .rp-card.idle  { opacity: 1; transform: translateY(0) scale(1); }
        .rp-card.exit  { opacity: 0; transform: translateY(-18px) scale(0.988); }

        .rp-step-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8b5cf6;
          margin-bottom: 0.45rem;
        }
        .rp-question {
          font-size: 1.625rem;
          font-weight: 800;
          color: #1e1b4b;
          line-height: 1.25;
          margin-bottom: 0.4rem;
          letter-spacing: -0.025em;
        }
        .rp-hint {
          font-size: 0.8rem;
          color: #a0aec0;
          margin-bottom: 1.5rem;
        }
        .rp-optional-badge {
          display: inline-block;
          font-size: 0.62rem;
          font-weight: 700;
          color: #9ca3af;
          background: #f3f4f6;
          border-radius: 999px;
          padding: 0.12rem 0.55rem;
          margin-left: 0.4rem;
          vertical-align: middle;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* ── Chip grid ── */
        .rp-chip-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }
        .rp-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1.05rem;
          border-radius: 999px;
          background: #ffffff;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          border: 1.5px solid #e5e7eb;
          transition: all 0.15s ease;
          user-select: none;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .rp-chip:hover {
          border-color: #a5b4fc;
          background: #f5f3ff;
          color: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(99,102,241,0.15);
        }
        .rp-chip.selected {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          border-color: transparent;
          box-shadow: 0 3px 12px rgba(99,102,241,0.35);
          transform: translateY(-1px);
        }
        .rp-chip.selected:hover {
          box-shadow: 0 5px 18px rgba(99,102,241,0.45);
        }
        .rp-chip-check {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: rgba(255,255,255,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.6rem;
          flex-shrink: 0;
        }

        /* ── Custom input row ── */
        .rp-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .rp-divider-line {
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .rp-divider-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #b0b7c3;
          white-space: nowrap;
          letter-spacing: 0.06em;
        }

        .rp-custom-row {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.75rem;
        }
        .rp-custom-input {
          flex: 1;
          padding: 0.7rem 1rem;
          font-size: 0.9rem;
          font-weight: 400;
          color: #111827;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 0.75rem;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .rp-custom-input::placeholder { color: #c4b5fd; }
        .rp-custom-input:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.13);
        }
        .rp-custom-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.7rem 1rem;
          background: #f5f3ff;
          color: #6366f1;
          font-size: 0.82rem;
          font-weight: 700;
          border: 1.5px solid #c7d2fe;
          border-radius: 0.75rem;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .rp-custom-add-btn:hover:not(:disabled) {
          background: #ede9fe;
          border-color: #818cf8;
          transform: translateY(-1px);
        }
        .rp-custom-add-btn:disabled {
          opacity: 0.38;
          cursor: not-allowed;
        }

        /* ── Selected preview bar ── */
        .rp-selected-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-bottom: 1rem;
          min-height: 28px;
        }
        .rp-sel-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.22rem 0.6rem;
          background: #ede9fe;
          border: 1px solid #c7d2fe;
          border-radius: 999px;
          font-size: 0.75rem;
          color: #4338ca;
          font-weight: 500;
          animation: tagIn 0.18s ease;
        }
        .rp-sel-remove {
          cursor: pointer;
          font-size: 0.8rem;
          color: #a5b4fc;
          line-height: 1;
          padding: 0 0.1rem;
        }
        .rp-sel-remove:hover { color: #6366f1; }
        .rp-sel-hint {
          font-size: 0.78rem;
          color: #c4b5fd;
          display: flex;
          align-items: center;
          font-style: italic;
        }

        /* ── Text-only input ── */
        .rp-text-input {
          width: 100%;
          padding: 0.9rem 1.1rem;
          font-size: 1rem;
          color: #111827;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 0.875rem;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          margin-bottom: 1.75rem;
        }
        .rp-text-input::placeholder { color: #b0b7c3; }
        .rp-text-input:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3.5px rgba(139,92,246,0.14);
        }

        /* ── Sticky action bar ── */
        .rp-action-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 100;
          background: rgba(248,247,255,0.92);
          backdrop-filter: blur(12px);
          border-top: 1px solid #e5e7eb;
          padding: 1rem 1.25rem calc(1rem + env(safe-area-inset-bottom));
          display: flex;
          justify-content: center;
        }
        .rp-action-inner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          max-width: 560px;
        }

        /* Main CTA button */
        .rp-next-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.825rem 1.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #ffffff;
          font-size: 0.925rem;
          font-weight: 700;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 4px 15px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
          letter-spacing: 0.01em;
          position: relative;
          overflow: hidden;
        }
        .rp-next-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
          border-radius: inherit;
        }
        .rp-next-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .rp-next-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 3px 10px rgba(99,102,241,0.3);
        }
        .rp-next-btn:disabled {
          background: linear-gradient(135deg, #c7d2fe, #ddd6fe);
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.75;
        }
        .rp-next-btn .btn-count {
          background: rgba(255,255,255,0.25);
          border-radius: 999px;
          padding: 0.1rem 0.5rem;
          font-size: 0.78rem;
          font-weight: 700;
          min-width: 1.4rem;
          text-align: center;
        }
        .rp-next-btn svg {
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }
        .rp-next-btn:hover:not(:disabled) svg { transform: translateX(3px); }

        /* ── Page title ── */
        .rp-page-title {
          font-size: 0.78rem;
          font-weight: 500;
          color: #b0b7c3;
          text-align: center;
          margin-bottom: 2rem;
          letter-spacing: 0.02em;
        }
      `}} />

      <div className="rp-content">
        <p className="rp-page-title">당신에게 꼭 맞는 책을 찾아드립니다</p>

        {/* ── Top bar ── */}
        <div className="rp-topbar">
          <button
            className="rp-back-btn"
            disabled={currentStep === 0}
            onClick={() => {
              if (currentStep === 0) return;
              setPhase('exit');
              setTimeout(() => setCurrentStep(c => c - 1), 280);
            }}
            aria-label="이전 단계"
          >
            ←
          </button>
          <div className="rp-progress-wrap">
            <div className="rp-progress-label">
              {currentStep + 1} / {steps.length} — {STEP_META_BASE[step].label}
            </div>
            <div className="rp-progress-track">
              <div className="rp-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* ── Step dots ── */}
        <div className="rp-dots">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`rp-dot ${i === currentStep ? 'active' : i < currentStep ? 'done' : ''}`}
            />
          ))}
        </div>

        {/* ── Previous answers ── */}
        {currentStep > 0 && (
          <div className="rp-summary">
            {steps.slice(0, currentStep).map(s => {
              const val = getStringValue(formData, s);
              return (
                <div key={s} className="rp-tag">
                  <span className="rp-tag-key">{STEP_META_BASE[s].label}</span>
                  {val.trim()
                    ? <span>{val}</span>
                    : <span className="rp-tag-skipped">건너뜀</span>
                  }
                </div>
              );
            })}
          </div>
        )}

        {/* ── Card ── */}
        <div className={`rp-card ${phase}`}>
          <div className="rp-step-label">
            {String(currentStep + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
          </div>
          <h2 className="rp-question">
            {meta.question}
            {meta.optional && <span className="rp-optional-badge">선택</span>}
          </h2>
          <p className="rp-hint">{meta.hint}</p>

          {/* bookType — single-select chips + custom input */}
          {step === 'bookType' && (
            <>
              <div className="rp-chip-grid">
                {BOOK_TYPE_OPTIONS.map(opt => (
                  <button key={opt} className="rp-chip" onClick={() => selectSingle(opt)}>
                    {opt}
                  </button>
                ))}
              </div>

              <div className="rp-divider">
                <div className="rp-divider-line" />
                <span className="rp-divider-label">목록에 없다면</span>
                <div className="rp-divider-line" />
              </div>

              <div className="rp-custom-row">
                <input
                  ref={customInputRef}
                  className="rp-custom-input"
                  placeholder={meta.customPlaceholder}
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCustom(); }}
                  autoComplete="off"
                />
                <button
                  className="rp-custom-add-btn"
                  onClick={addCustom}
                  disabled={!customInput.trim()}
                >
                  선택 →
                </button>
              </div>
            </>
          )}

          {/* multi-select — chip grid + selected preview + custom input */}
          {meta.multi && (
            <>
              {/* Selected tags preview */}
              <div className="rp-selected-preview">
                {selected.length === 0 && !customInput.trim()
                  ? <span className="rp-sel-hint">선택한 항목이 여기에 표시됩니다</span>
                  : selected.map(s => (
                    <span key={s} className="rp-sel-tag">
                      {s}
                      <span
                        className="rp-sel-remove"
                        role="button"
                        aria-label={`${s} 제거`}
                        onClick={() => toggleChip(s)}
                      >×</span>
                    </span>
                  ))
                }
              </div>

              {/* Chip grid */}
              <div className="rp-chip-grid">
                {meta.options.map(opt => {
                  const isSelected = selected.includes(opt);
                  return (
                    <button
                      key={opt}
                      className={`rp-chip${isSelected ? ' selected' : ''}`}
                      onClick={() => toggleChip(opt)}
                    >
                      {isSelected && <span className="rp-chip-check">✓</span>}
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Divider + custom input */}
              <div className="rp-divider">
                <div className="rp-divider-line" />
                <span className="rp-divider-label">목록에 없다면 직접 입력</span>
                <div className="rp-divider-line" />
              </div>

              <div className="rp-custom-row">
                <input
                  ref={customInputRef}
                  className="rp-custom-input"
                  placeholder={meta.customPlaceholder}
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCustom(); }}
                  autoComplete="off"
                />
                <button
                  className="rp-custom-add-btn"
                  onClick={addCustom}
                  disabled={!customInput.trim()}
                >
                  + 추가
                </button>
              </div>
            </>
          )}

          {/* text-only steps (pastBooks / avoidElements) */}
          {meta.textOnly && (
            <input
              ref={textInputRef}
              className="rp-text-input"
              placeholder={meta.placeholder}
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') advance(textValue); }}
              autoComplete="off"
            />
          )}
        </div>
      </div>

      {/* ── Sticky action bar (hidden for bookType — chips auto-advance, custom has own btn) ── */}
      {step !== 'bookType' && (
        <div className="rp-action-bar">
          <div className="rp-action-inner">
            <button
              className="rp-next-btn"
              disabled={!canAdvance}
              onClick={() => {
                if (meta.multi)    advance(selected.join(', '));
                else if (meta.textOnly) advance(textValue);
              }}
            >
              {isLast ? '추천 받기' : '다음'}
              {totalCount > 0 && (
                <span className="btn-count">{totalCount}</span>
              )}
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M3 7.5h9M9 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
