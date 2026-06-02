'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const BOOK_TYPE_OPTIONS = ['소설', '에세이', '시/문학', '비문학']
const GENRE_LITERATURE_OPTIONS = ['로맨스', '판타지', 'SF', '추리/미스터리', '스릴러', '공포', '역사소설', '성장소설', '가족소설', '휴먼드라마', '고전문학', '현대문학']
const GENRE_NONFICTION_OPTIONS = ['인문/철학', '심리', '자기계발', '경제/경영', '사회/정치', '역사', '과학', '기술/IT', '예술/문화', '여행', '건강', '교육', '종교']
const FIELD_OPTIONS = ['인간관계', '사랑', '성장', '위로/힐링', '자존감', '심리', '삶의 의미', '돈/투자', '커리어', '사회문제', '역사', '과학/기술', '예술/창작', '여행', '미스터리', '새로운 세계관']
const PURPOSE_OPTIONS = ['몰입', '기분 전환', '위로', '지식 습득', '생각거리', '가벼운 독서', '깊이 있는 독서', '과제/독후감', '새로운 취향 발견']
const ATMOSPHERE_OPTIONS = ['따뜻한', '어두운', '감성적인', '유쾌한', '잔잔한', '철학적인', '긴장감 있는', '현실적인', '몽환적인', '희망적인', '슬픈']
const DIFFICULTY_OPTIONS = ['아주 쉽게 읽히는 책', '적당히 생각하며 읽는 책', '문장이 좋은 책', '전문적인 책', '깊이 있는 책', '짧고 가벼운 책', '긴 분량도 괜찮은 책']

type Step = 'bookType' | 'genre' | 'interest' | 'purpose' | 'atmosphere' | 'difficulty' | 'pastBooks' | 'avoidElements'

const MULTI_SELECT_STEPS = new Set<Step>(['genre', 'interest', 'purpose', 'atmosphere', 'difficulty'])
const TEXT_ONLY_STEPS = new Set<Step>(['pastBooks', 'avoidElements'])
const OPTIONAL_STEPS = new Set<Step>(['pastBooks', 'avoidElements'])

function getSteps(bookType?: string): Step[] {
  const steps: Step[] = ['bookType', 'genre', 'interest', 'purpose']
  if (!bookType || bookType !== '비문학') steps.push('atmosphere')
  steps.push('difficulty', 'pastBooks', 'avoidElements')
  return steps
}

interface StepMeta {
  label: string
  question: string
  hint: string
  placeholder: string
  customPlaceholder: string
  options: string[]
  optional?: boolean
  multi?: boolean
  textOnly?: boolean
}

const STEP_META_BASE: Record<Step, Omit<StepMeta, 'options' | 'multi' | 'textOnly'>> = {
  bookType: {
    label: '도서 유형',
    question: '어떤 유형의 책을 찾고 계신가요?',
    hint: '하나를 선택하거나 직접 입력하세요.',
    placeholder: '',
    customPlaceholder: '예: 만화, 그래픽노블',
  },
  genre: {
    label: '장르',
    question: '선호하는 장르는 무엇인가요?',
    hint: '여러 개를 선택할 수 있습니다.',
    placeholder: '',
    customPlaceholder: '다른 장르를 입력하세요',
  },
  interest: {
    label: '관심 분야',
    question: '요즘 어떤 분야에 끌리나요?',
    hint: '현재 관심사를 알려주면 추천이 더 정확해집니다.',
    placeholder: '',
    customPlaceholder: '다른 관심 분야를 입력하세요',
  },
  purpose: {
    label: '독서 목적',
    question: '어떤 목적으로 책을 읽고 싶나요?',
    hint: '독서 상황과 기대를 골라주세요.',
    placeholder: '',
    customPlaceholder: '다른 목적을 입력하세요',
  },
  atmosphere: {
    label: '분위기',
    question: '어떤 분위기의 책을 원하나요?',
    hint: '책을 펼쳤을 때 느끼고 싶은 감각을 골라주세요.',
    placeholder: '',
    customPlaceholder: '다른 분위기를 입력하세요',
  },
  difficulty: {
    label: '읽기 난이도',
    question: '어떤 난이도의 책이 좋을까요?',
    hint: '지금의 집중력과 독서 리듬에 맞춰 선택하세요.',
    placeholder: '',
    customPlaceholder: '원하는 난이도를 입력하세요',
  },
  pastBooks: {
    label: '취향 도서',
    question: '좋았던 책이 있나요?',
    hint: '입력하거나 건너뛸 수 있습니다.',
    placeholder: '책 제목을 입력하세요',
    customPlaceholder: '',
  },
  avoidElements: {
    label: '피하고 싶은 요소',
    question: '피하고 싶은 요소가 있나요?',
    hint: '입력하거나 건너뛸 수 있습니다.',
    placeholder: '자유롭게 입력하세요',
    customPlaceholder: '',
  },
}

interface FormData {
  bookType?: string
  genre?: string[]
  interest?: string[]
  purpose?: string[]
  atmosphere?: string[]
  difficulty?: string[]
  pastBooks?: string
  avoidElements?: string
}

function getStringValue(data: FormData, step: Step): string {
  const value = (data as Record<string, unknown>)[step]
  if (Array.isArray(value)) return value.join(', ')
  return (value as string | undefined) ?? ''
}

export default function RecommendPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({})
  const [steps, setSteps] = useState<Step[]>(getSteps())
  const [currentStep, setCurrentStep] = useState(0)
  const [phase, setPhase] = useState<'enter' | 'idle' | 'exit'>('enter')
  const [selected, setSelected] = useState<string[]>([])
  const [textValue, setTextValue] = useState('')
  const [customInput, setCustomInput] = useState('')
  const textInputRef = useRef<HTMLInputElement>(null)
  const customInputRef = useRef<HTMLInputElement>(null)

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1
  const genreOptions = formData.bookType === '비문학' ? GENRE_NONFICTION_OPTIONS : GENRE_LITERATURE_OPTIONS

  function getMeta(selectedStep: Step): StepMeta {
    const base = STEP_META_BASE[selectedStep]
    const multi = MULTI_SELECT_STEPS.has(selectedStep)
    const textOnly = TEXT_ONLY_STEPS.has(selectedStep)
    const options =
      selectedStep === 'bookType'
        ? BOOK_TYPE_OPTIONS
        : selectedStep === 'genre'
          ? genreOptions
          : selectedStep === 'interest'
            ? FIELD_OPTIONS
            : selectedStep === 'purpose'
              ? PURPOSE_OPTIONS
              : selectedStep === 'atmosphere'
                ? ATMOSPHERE_OPTIONS
                : selectedStep === 'difficulty'
                  ? DIFFICULTY_OPTIONS
                  : []
    return { ...base, options, optional: OPTIONAL_STEPS.has(selectedStep), multi, textOnly }
  }

  const meta = getMeta(step)

  useEffect(() => {
    setSteps(getSteps(formData.bookType))
  }, [formData.bookType])

  useEffect(() => {
    setPhase('enter')
    setSelected([])
    setTextValue('')
    setCustomInput('')
    const timer = window.setTimeout(() => {
      setPhase('idle')
      if (meta.textOnly) textInputRef.current?.focus()
    }, 50)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep])

  const advance = (value: string) => {
    const isOptional = OPTIONAL_STEPS.has(step)
    if (!value.trim() && !isOptional) return

    const updated: FormData = { ...formData }
    if (meta.multi) {
      const pendingCustom = customInput.trim()
      const finalSelected = pendingCustom && !selected.includes(pendingCustom) ? [...selected, pendingCustom] : selected
      ;(updated as Record<string, unknown>)[step] = finalSelected
    } else {
      ;(updated as Record<string, unknown>)[step] = value
    }

    setFormData(updated)
    setPhase('exit')

    window.setTimeout(() => {
      if (isLast) {
        const params = new URLSearchParams()
        ;(Object.keys(updated) as Step[]).forEach((key) => {
          const nextValue = getStringValue(updated, key)
          if (nextValue.trim()) params.set(key, nextValue)
        })
        router.push(`/recommend/result?${params.toString()}`)
      } else {
        setCurrentStep((current) => current + 1)
      }
    }, 260)
  }

  const toggleChip = (option: string) => {
    setSelected((current) => (current.includes(option) ? current.filter((item) => item !== option) : [...current, option]))
  }

  const addCustom = () => {
    const trimmed = customInput.trim()
    if (!trimmed) return
    if (meta.multi) {
      if (!selected.includes(trimmed)) setSelected((current) => [...current, trimmed])
      setCustomInput('')
      customInputRef.current?.focus()
    } else {
      advance(trimmed)
    }
  }

  const canAdvance = OPTIONAL_STEPS.has(step)
    ? true
    : meta.multi
      ? selected.length > 0 || customInput.trim().length > 0
      : meta.textOnly
        ? textValue.trim().length > 0
        : customInput.trim().length > 0

  const progress = ((currentStep + 1) / steps.length) * 100
  const totalCount = meta.multi ? selected.length + (customInput.trim() && !selected.includes(customInput.trim()) ? 1 : 0) : 0

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Book recommendation</p>
        <h1 className="mt-3 text-center text-4xl font-light tracking-tight text-stone-950">취향을 읽는 짧은 설문</h1>

        <div className="mt-8 flex items-center gap-3">
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-900/10 bg-white/70 text-stone-600 transition hover:bg-white disabled:opacity-30"
            disabled={currentStep === 0}
            onClick={() => {
              if (currentStep === 0) return
              setPhase('exit')
              window.setTimeout(() => setCurrentStep((current) => current - 1), 220)
            }}
            aria-label="이전 단계"
          >
            ←
          </button>
          <div className="flex-1">
            <div className="mb-2 flex justify-between text-xs font-semibold text-stone-500">
              <span>
                {currentStep + 1} / {steps.length} · {STEP_META_BASE[step].label}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/70">
              <div className="h-full rounded-full bg-stone-950 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {currentStep > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {steps.slice(0, currentStep).map((savedStep) => {
              const value = getStringValue(formData, savedStep)
              return (
                <span key={savedStep} className="rounded-full border border-stone-900/10 bg-white/65 px-3 py-1.5 text-xs text-stone-600">
                  <span className="font-semibold text-primary-700">{STEP_META_BASE[savedStep].label}</span>{' '}
                  {value.trim() ? value : '건너뜀'}
                </span>
              )
            })}
          </div>
        )}

        <section className={`mt-7 rounded-lg border border-stone-900/10 bg-white/70 p-6 shadow-sm transition duration-300 ${phase === 'idle' ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
            {String(currentStep + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-stone-950">
            {meta.question}
            {meta.optional && <span className="ml-2 align-middle text-xs font-semibold text-stone-400">선택</span>}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">{meta.hint}</p>

          {step === 'bookType' && (
            <>
              <div className="mt-6 flex flex-wrap gap-2">
                {BOOK_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    className="rounded-full border border-stone-900/10 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-primary-300 hover:bg-primary-50"
                    onClick={() => advance(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <input
                  ref={customInputRef}
                  className="min-w-0 flex-1 rounded-full border border-stone-900/10 bg-white px-4 py-2 text-sm outline-none focus:border-primary-400"
                  placeholder={meta.customPlaceholder}
                  value={customInput}
                  onChange={(event) => setCustomInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') addCustom()
                  }}
                />
                <button className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-30" onClick={addCustom} disabled={!customInput.trim()}>
                  선택
                </button>
              </div>
            </>
          )}

          {meta.multi && (
            <>
              <div className="mt-5 min-h-8">
                {selected.length === 0 && !customInput.trim() ? (
                  <span className="text-sm text-stone-400">선택한 항목이 여기에 표시됩니다.</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selected.map((item) => (
                      <button key={item} className="rounded-full bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-800" onClick={() => toggleChip(item)}>
                        {item} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {meta.options.map((option) => {
                  const isSelected = selected.includes(option)
                  return (
                    <button
                      key={option}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? 'border-stone-950 bg-stone-950 text-white'
                          : 'border-stone-900/10 bg-white text-stone-700 hover:border-primary-300 hover:bg-primary-50'
                      }`}
                      onClick={() => toggleChip(option)}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
              <div className="mt-6 flex gap-2">
                <input
                  ref={customInputRef}
                  className="min-w-0 flex-1 rounded-full border border-stone-900/10 bg-white px-4 py-2 text-sm outline-none focus:border-primary-400"
                  placeholder={meta.customPlaceholder}
                  value={customInput}
                  onChange={(event) => setCustomInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') addCustom()
                  }}
                />
                <button className="rounded-full border border-stone-900/10 px-4 py-2 text-sm font-semibold text-stone-700 disabled:opacity-30" onClick={addCustom} disabled={!customInput.trim()}>
                  추가
                </button>
              </div>
            </>
          )}

          {meta.textOnly && (
            <input
              ref={textInputRef}
              className="mt-6 w-full rounded-full border border-stone-900/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary-400"
              placeholder={meta.placeholder}
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') advance(textValue)
              }}
            />
          )}
        </section>
      </div>

      {step !== 'bookType' && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-900/10 bg-[#f5efe3]/90 px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-2xl justify-end">
            <button
              className="rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-35"
              disabled={!canAdvance}
              onClick={() => {
                if (meta.multi) advance(selected.join(', '))
                else if (meta.textOnly) advance(textValue)
              }}
            >
              {isLast ? '추천 받기' : '다음'}
              {totalCount > 0 && <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">{totalCount}</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
