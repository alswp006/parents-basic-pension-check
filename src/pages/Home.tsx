import { useRef, useState } from 'react';
import type { FocusEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, Chip, ChipItem, ListRow, Paragraph, Spacing, Switch, TextField, Top } from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { SubmitFooter } from '@/components/BottomCTA';
import { AdSlot } from '@/components/AdSlot';
import { logClick } from '@/lib/analytics';
import { sanitizeAmount, sanitizeBirthDate } from '@/lib/sanitize';
import { loadLastInput, saveLastInput, toFormState } from '@/lib/storedInput';
import { runDiagnosis, toAppInput, validateForm } from '@/lib/validation';
import type { FormState, Region, RouteState } from '@/lib/types';

type AmountKey = 'earned' | 'other' | 'general' | 'financial' | 'debt' | 'luxury';
type FieldKey = 'birthDate' | AmountKey;

/** 아직 비어 있는 필수 항목만 골라 안내한다(셋 다 비면 기존 문구 그대로). */
function missingHint(form: FormState): string {
  const names: string[] = [];
  if (form.birthDate.trim() === '') names.push('생년월일');
  if (form.hasSpouse === null) names.push('배우자 유무');
  if (form.region === null) names.push('거주 지역');
  return `${names.join('·')}을 입력해 주세요`.replace('배우자 유무을', '배우자 유무를').replace('지역을', '지역을');
}
const HINT_INVALID = '빨간 표시된 칸을 고쳐 주세요';

const REGIONS: { value: Region; label: string }[] = [
  { value: 'metro', label: '대도시' },
  { value: 'city', label: '중소도시' },
  { value: 'rural', label: '농어촌' },
];

const INCOME_FIELDS: { key: AmountKey; label: string; placeholder: string }[] = [
  { key: 'earned', label: '근로소득(부부 합산)', placeholder: '예: 150' },
  { key: 'other', label: '기타소득(연금·사업·임대 등)', placeholder: '예: 50' },
];

const PROPERTY_FIELDS: { key: AmountKey; label: string; placeholder: string }[] = [
  { key: 'general', label: '주택·토지 등 일반재산(공시가격)', placeholder: '예: 20000' },
  { key: 'financial', label: '예금·주식 등 금융재산', placeholder: '예: 3000' },
  { key: 'debt', label: '부채', placeholder: '예: 1000' },
  { key: 'luxury', label: '고급자동차·회원권', placeholder: '예: 0' },
];

const LAST_FIELD: FieldKey = 'luxury';

const EMPTY_FORM: FormState = {
  birthDate: '',
  hasSpouse: null,
  spouseEligible: false,
  region: null,
  earned: '',
  other: '',
  general: '',
  financial: '',
  debt: '',
  luxury: '',
};

/** SDK는 WebView 밖에서 throw하므로 가드한다. */
function tickWeak() {
  try {
    Promise.resolve(generateHapticFeedback({ type: 'tickWeak' })).catch(() => {});
  } catch {
    /* WebView 밖에서는 무시 */
  }
}

function scrollCenter(e: FocusEvent<HTMLInputElement>) {
  try {
    e.currentTarget.scrollIntoView?.({ block: 'center' });
  } catch {
    /* 구형 WebView에서는 무시 */
  }
}

export default function Home() {
  const navigate = useNavigate();
  // today는 한 번만 만들어 검증과 계산에 같이 넘긴다.
  const [today] = useState(() => new Date());
  const [form, setForm] = useState<FormState>(() => {
    const saved = loadLastInput(today);
    return saved ? toFormState(saved) : EMPTY_FORM;
  });
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [calcError, setCalcError] = useState(false);
  const submittingRef = useRef(false);

  const { errors, missingRequired, valid } = validateForm(form, today);
  const hasErrors = Object.keys(errors).length > 0;
  const adGroupId = import.meta.env.VITE_TOSS_AD_GROUP_ID as string | undefined;

  const touch = (key: FieldKey) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

  const setSpouse = (hasSpouse: boolean) => {
    tickWeak();
    // 배우자 없음이면 spouseEligible도 함께 초기화한다.
    setForm((f) => ({ ...f, hasSpouse, spouseEligible: false }));
  };

  const setRegion = (region: Region) => {
    tickWeak();
    setForm((f) => ({ ...f, region }));
  };

  const toggleSpouseEligible = () => {
    tickWeak();
    setForm((f) => ({ ...f, spouseEligible: !f.spouseEligible }));
  };

  const releaseSubmit = () => {
    submittingRef.current = false;
    setSubmitting(false);
  };

  const handleSubmit = () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    let state: RouteState;
    try {
      if (!validateForm(form, today).valid) {
        releaseSubmit();
        return;
      }
      const input = toAppInput(form);
      const result = runDiagnosis(input, today);
      try {
        saveLastInput(input);
      } catch {
        /* 저장 실패는 무시하고 이동한다 */
      }
      state = { input, result };
    } catch {
      releaseSubmit();
      setCalcError(true);
      return;
    }
    navigate('/result', { state });
  };

  const closeError = () => setCalcError(false);

  const retry = () => {
    tickWeak();
    closeError();
    handleSubmit();
  };

  const renderAmountField = (field: { key: AmountKey; label: string; placeholder: string }) => {
    const showError = !!touched[field.key] && !!errors[field.key];
    return (
      <div key={field.key}>
        <TextField
          variant="box"
          label={field.label}
          labelOption="sustain"
          aria-label={field.label}
          placeholder={field.placeholder}
          inputMode="numeric"
          enterKeyHint={field.key === LAST_FIELD ? 'done' : 'next'}
          value={form[field.key]}
          onChange={(e) => {
            const value = sanitizeAmount(e.target.value);
            setForm((f) => ({ ...f, [field.key]: value }));
          }}
          onFocus={scrollCenter}
          onBlur={() => touch(field.key)}
          hasError={showError}
          help={showError ? errors[field.key] : undefined}
        />
        <Spacing size={12} />
      </div>
    );
  };

  const birthError = !!touched.birthDate && !!errors.birthDate;

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>부모님 기초연금</Top.TitleParagraph>} />}
      bottom={
        <SubmitFooter
          label="진단하기"
          onClick={() => {
            logClick('diagnose_submit');
            handleSubmit();
          }}
          disabled={!valid || submitting}
          loading={submitting}
          hint={missingRequired ? missingHint(form) : hasErrors ? HINT_INVALID : undefined}
        />
      }
    >
      <Spacing size={8} />
      <Paragraph.Text typography="t6" color="var(--adaptiveGrey600)">
        소득과 재산을 넣으면 받을 수 있을지 알려드려요
      </Paragraph.Text>
      <Spacing size={24} />

      <TextField
        variant="box"
        label="생년월일 (연금 받을 분)"
        labelOption="sustain"
        aria-label="생년월일 (연금 받을 분)"
        placeholder="예: 19611110"
        inputMode="numeric"
        enterKeyHint="next"
        maxLength={10}
        value={form.birthDate}
        onChange={(e) => {
          const value = sanitizeBirthDate(e.target.value);
          setForm((f) => ({ ...f, birthDate: value }));
        }}
        onFocus={scrollCenter}
        onBlur={() => touch('birthDate')}
        hasError={birthError}
        help={birthError ? errors.birthDate : undefined}
      />
      <Spacing size={24} />

      <Paragraph.Text typography="t5">배우자</Paragraph.Text>
      <Spacing size={12} />
      <Chip kind="select" variant="fill">
        <ChipItem selected={form.hasSpouse === false} onClick={() => setSpouse(false)}>
          없음
        </ChipItem>
        <ChipItem selected={form.hasSpouse === true} onClick={() => setSpouse(true)}>
          있음
        </ChipItem>
      </Chip>
      {form.hasSpouse === true && (
        <ListRow
          contents={<ListRow.Texts type="1RowTypeA" top="배우자도 만 65세 이상이에요" />}
          right={
            <Switch
              checked={form.spouseEligible}
              onChange={toggleSpouseEligible}
              aria-label="배우자도 만 65세 이상이에요"
            />
          }
        />
      )}
      <Spacing size={24} />

      <Paragraph.Text typography="t5">거주 지역</Paragraph.Text>
      <Spacing size={12} />
      <Chip kind="select" variant="fill">
        {REGIONS.map((r) => (
          <ChipItem key={r.value} selected={form.region === r.value} onClick={() => setRegion(r.value)}>
            {r.label}
          </ChipItem>
        ))}
      </Chip>
      <Spacing size={24} />

      <Paragraph.Text typography="t5">월 소득 (만 원)</Paragraph.Text>
      <Spacing size={12} />
      {INCOME_FIELDS.map(renderAmountField)}
      <Spacing size={12} />

      <Paragraph.Text typography="t5">재산 (만 원)</Paragraph.Text>
      <Spacing size={12} />
      {PROPERTY_FIELDS.map(renderAmountField)}
      <Spacing size={12} />

      {adGroupId ? <AdSlot adGroupId={adGroupId} /> : null}
      <Spacing size={120} />

      <AlertDialog
        open={calcError}
        title="계산 중 문제가 생겼어요"
        onClose={closeError}
        alertButton={<AlertDialog.AlertButton onClick={retry}>다시 시도</AlertDialog.AlertButton>}
      />
    </ScreenScaffold>
  );
}
