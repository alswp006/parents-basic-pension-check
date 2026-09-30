import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Button, ListRow, Paragraph, Spacing, Top } from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { SummaryHero } from '@/components/SummaryHero';
import { EmptyState } from '@/components/StateView';
import { SubmitFooter } from '@/components/BottomCTA';
import { AdSlot } from '@/components/AdSlot';
import BreakdownSection from '@/components/BreakdownSection';
import { logClick } from '@/lib/analytics';
import { requestReviewOnce } from '@/lib/review';
import { shareApp } from '@/lib/share';
import { loadLastInput } from '@/lib/storedInput';
import { runDiagnosis } from '@/lib/validation';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { AppInput, AppResult, Reduction, RouteState, Verdict } from '@/lib/types';

const VERDICT_TEXT: Record<Verdict, string> = {
  likely: '받을 가능성이 높아요',
  borderline: '기준선 근처예요',
  unlikely: '받기 어려워 보여요',
};

const REDUCTION_TEXT: Record<Reduction, string> = {
  couple: '부부 감액 20%',
  incomeReversal: '소득역전 방지 감액',
};

const NO_REDUCTION = '감액 없음';

const REDUCTION_COLOR: Record<string, 'blue' | 'yellow' | 'elephant'> = {
  [REDUCTION_TEXT.couple]: 'blue',
  [REDUCTION_TEXT.incomeReversal]: 'yellow',
  [NO_REDUCTION]: 'elephant',
};

type ViewState =
  | { kind: 'ok'; result: AppResult }
  | { kind: 'empty' }
  | { kind: 'error' };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function allFinite(obj: unknown, keys: string[]): boolean {
  return isObject(obj) && keys.every((k) => isFiniteNumber(obj[k]));
}

function isAppInput(v: unknown): v is AppInput {
  return (
    isObject(v) &&
    typeof v.birthDate === 'string' &&
    typeof v.hasSpouse === 'boolean' &&
    typeof v.spouseEligible === 'boolean' &&
    (v.region === 'metro' || v.region === 'city' || v.region === 'rural') &&
    allFinite(v, [
      'monthlyEarnedIncome',
      'monthlyOtherIncome',
      'generalProperty',
      'financialProperty',
      'debt',
      'luxuryAssets',
    ])
  );
}

function isAppResult(v: unknown): v is AppResult {
  if (!isObject(v)) return false;
  const { pension, schedule } = v;
  return (
    allFinite(v, ['recognizedIncome', 'threshold', 'ratio', 'policyYear']) &&
    (v.verdict === 'likely' || v.verdict === 'borderline' || v.verdict === 'unlikely') &&
    allFinite(v.income, ['earnedReflected', 'other', 'total']) &&
    allFinite(v.property, ['general', 'financial', 'debt', 'basicDeduction', 'luxury', 'total']) &&
    allFinite(pension, ['recipients', 'perPerson', 'household']) &&
    isObject(pension) &&
    typeof pension.eligible === 'boolean' &&
    Array.isArray(pension.reductions) &&
    allFinite(schedule, ['age', 'dDay']) &&
    isObject(schedule) &&
    typeof schedule.turns65On === 'string' &&
    typeof schedule.applyFrom === 'string' &&
    typeof schedule.canApplyNow === 'boolean'
  );
}

function isRouteState(v: unknown): v is RouteState {
  return isObject(v) && isAppInput(v.input) && isAppResult(v.result);
}

/** 'YYYY-MM-DD' → '2026년 10월 1일' */
function formatDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

function tickWeak() {
  try {
    Promise.resolve(generateHapticFeedback({ type: 'tickWeak' })).catch(() => {});
  } catch {
    /* WebView 밖에서는 무시 */
  }
}

export default function Result() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const adGroupId = import.meta.env.VITE_TOSS_AD_GROUP_ID as string | undefined;

  const view = useMemo<ViewState>(() => {
    if (state != null) {
      return isRouteState(state) ? { kind: 'ok', result: state.result } : { kind: 'error' };
    }
    const today = new Date();
    const input = loadLastInput(today);
    if (!input) return { kind: 'empty' };
    try {
      return { kind: 'ok', result: runDiagnosis(input, today) };
    } catch {
      return { kind: 'error' };
    }
  }, [state]);

  useEffect(() => {
    if (view.kind === 'ok') requestReviewOnce();
  }, [view.kind]);

  const goHome = () => {
    tickWeak();
    navigate('/');
  };

  const recalc = () => {
    logClick('recalc_tap');
    goHome();
  };

  const shareResult = (verdict: Verdict) => {
    logClick('share_tap');
    void shareApp({
      message: `부모님 기초연금 모의 진단: ${VERDICT_TEXT[verdict]}. 생년월일과 소득·재산만 넣으면 바로 확인할 수 있어요.`,
      path: '/result',
    });
  };

  const top = <Top title={<Top.TitleParagraph>진단 결과</Top.TitleParagraph>} />;

  if (view.kind === 'empty') {
    return (
      <ScreenScaffold top={top} bottom={<SubmitFooter label="진단하러 가기" onClick={goHome} />}>
        <EmptyState
          title="아직 진단 결과가 없어요"
          description="생년월일과 소득·재산을 넣으면 바로 확인할 수 있어요"
        />
      </ScreenScaffold>
    );
  }

  if (view.kind === 'error') {
    return (
      <ScreenScaffold top={top}>
        <Spacing size={24} />
        <Paragraph.Text typography="t5">계산 중 문제가 생겼어요</Paragraph.Text>
        <Spacing size={16} />
        <Button variant="fill" size="large" display="block" aria-label="다시 계산하기" onClick={recalc}>
          다시 계산하기
        </Button>
      </ScreenScaffold>
    );
  }

  const { result } = view;
  const { pension, schedule } = result;
  const reductionLabels =
    pension.reductions.length > 0 ? pension.reductions.map((r) => REDUCTION_TEXT[r]) : [NO_REDUCTION];
  const ratioText = (Math.round(result.ratio * 1000) / 10).toFixed(1);
  const applyText = schedule.canApplyNow
    ? '지금 신청할 수 있어요'
    : `${formatDate(schedule.applyFrom)}부터 신청할 수 있어요 (D-${formatNumber(schedule.dDay)})`;

  return (
    <ScreenScaffold top={top}>
      <Spacing size={16} />
      <SummaryHero
        testId="verdict-card"
        label="기초연금 수급 가능성"
        value={<Paragraph.Text typography="t2">{VERDICT_TEXT[result.verdict]}</Paragraph.Text>}
        caption={`선정기준액 대비 ${ratioText}%`}
      />
      <ListRow
        contents={<ListRow.Texts type="1RowTypeA" top="소득인정액" />}
        right={<Paragraph.Text typography="t5">{formatCurrency(result.recognizedIncome)}</Paragraph.Text>}
      />
      <ListRow
        contents={<ListRow.Texts type="1RowTypeA" top="선정기준액" />}
        right={<Paragraph.Text typography="t5">{formatCurrency(result.threshold)}</Paragraph.Text>}
      />
      <Spacing size={24} />
      <Paragraph.Text typography="t4">예상 월 수령액</Paragraph.Text>
      <Spacing size={12} />
      <SummaryHero
        testId="pension-card"
        label={`1인 기준 (수급자 ${formatNumber(pension.recipients)}명)`}
        value={<Paragraph.Text typography="t1">{formatCurrency(pension.perPerson)}</Paragraph.Text>}
        caption={`가구 합계 ${formatCurrency(pension.household)}`}
      />
      <Spacing size={12} />
      {pension.eligible ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {reductionLabels.map((l) => (
            <Badge key={l} size="small" variant="weak" color={REDUCTION_COLOR[l]}>
              {l}
            </Badge>
          ))}
        </div>
      ) : (
        <Paragraph.Text typography="t6" color="var(--adaptiveGrey600)">
          기준을 넘어 수령액이 없을 것으로 보여요
        </Paragraph.Text>
      )}
      <Spacing size={24} />
      <Paragraph.Text typography="t4">신청 가능 시기</Paragraph.Text>
      <Spacing size={12} />
      <ListRow
        contents={
          <ListRow.Texts
            type="2RowTypeA"
            top={applyText}
            bottom={`만 ${formatNumber(schedule.age)}세 · 만 65세 생일 ${formatDate(schedule.turns65On)}`}
          />
        }
        right={
          schedule.canApplyNow ? (
            <Badge size="small" variant="weak" color="green">
              신청 가능
            </Badge>
          ) : (
            <Badge size="small" variant="weak" color="blue">{`D-${formatNumber(schedule.dDay)}`}</Badge>
          )
        }
      />
      <Spacing size={24} />
      <BreakdownSection income={result.income} property={result.property} />
      <Spacing size={24} />
      <Paragraph.Text typography="t7" color="var(--adaptiveGrey600)">
        {`${result.policyYear}년 선정기준액으로 계산한 모의 추정이에요. 실제 수급 여부는 국민연금공단·주민센터 조사로 결정돼요.`}
      </Paragraph.Text>
      <Spacing size={16} />
      {adGroupId ? <AdSlot adGroupId={adGroupId} /> : null}
      <Spacing size={16} />
      <Button variant="fill" size="large" display="block" aria-label="다시 계산하기" onClick={recalc}>
        다시 계산하기
      </Button>
      <Spacing size={12} />
      <Button
        variant="weak"
        size="large"
        display="block"
        aria-label="결과 공유하기"
        onClick={() => shareResult(result.verdict)}
      >
        결과 공유하기
      </Button>
      <Spacing size={24} />
    </ScreenScaffold>
  );
}
