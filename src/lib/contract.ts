/**
 * 패킷 간 인터페이스 계약 — 자동 생성. **수정하지 마라.**
 *
 * 기반 패킷은 여기 선언된 모양 그대로 구현하고, 화면 패킷은 여기 적힌 이름·인자·반환
 * 타입을 그대로 가정해도 된다. 추측이 어긋나 병합에서 무너지는 것을 막기 위한 파일이다.
 */

/** 지역 구분 (구현: 패킷 0001) */
export type Region = '서울'|'경기'|'인천'|'강원'|'충청'|'전라'|'경상'|'제주';

/** 기초연금 판정 결과 (구현: 패킷 0001) */
export type Verdict = '받을 가능성이 높아요'|'받을 수 있어요'|'어려울 수 있어요';

/** 감액 정보 (배우자, 소득역전) (구현: 패킷 0001) */
export type Reduction = { spouse: number; reversal: number };

/** 앱 진단 입력값 (YYYYMMDD 생년월일, 월 단위 금액) (구현: 패킷 0001) */
export type AppInput = { birthDate: string; hasSpouse: boolean; region: Region; monthlyEarnedIncome: number; monthlyOtherIncome: number; businessIncome: number; rentalIncome: number; generalAsset: number; financialAsset: number; debt: number };

/** 소득 환산 내역 (소득평가액) (구현: 패킷 0001) */
export type IncomeBreakdown = { earnedIncome: number; earnedReduction: number; otherIncome: number; total: number };

/** 재산 환산 내역 (월 단위, clamped=기본재산 적용됨) (구현: 패킷 0001) */
export type PropertyBreakdown = { generalAsset: number; financialAsset: number; assetDeduction: number; debt: number; basicAsset: number; environmentalIncome: number; clamped: boolean };

/** 판정 결과 (원 단위, ratio=백분율) (구현: 패킷 0001) */
export type PensionResult = { verdict: Verdict; recognizedIncome: number; baseAmount: number; ratio: number; monthlyAmount: number; reductionAmount: number; appliedReduction: Reduction };

/** 신청 일정 (YYYY-MM-DD 형식) (구현: 패킷 0001) */
export type ScheduleResult = { turns65On: string; applyFrom: string; daysUntilApply: number; age: number };

/** 진단 최종 결과 (구현: 패킷 0001) */
export type AppResult = { schedule: ScheduleResult; income: IncomeBreakdown; property: PropertyBreakdown; pension: PensionResult };

/** 폼 입력 상태 (금액=문자열, errors 맵) (구현: 패킷 0001) */
export type FormState = { birthDate: string; hasSpouse: boolean; region: Region; monthlyEarnedIncome: string; monthlyOtherIncome: string; businessIncome: string; rentalIncome: string; generalAsset: string; financialAsset: string; debt: string; errors: {[key: string]: string} };

/** Result 페이지 라우트 상태 (구현: 패킷 0001) */
export type RouteState = { result: AppResult };

/** 소득평가액 계산 (근로소득, 기타소득 포함) (구현: 패킷 0002) */
export type calcIncomeFn = (input: AppInput) => IncomeBreakdown;

/** 재산환산액 계산 (월 단위) (구현: 패킷 0002) */
export type calcPropertyFn = (input: AppInput) => PropertyBreakdown;

/** 선정기준액 계산 (소득인정액) (구현: 패킷 0002) */
export type getThresholdFn = (income: IncomeBreakdown, property: PropertyBreakdown) => number;

/** 판정 및 수령액 계산 (비율, 감액 적용) (구현: 패킷 0002) */
export type judgeFn = (input: AppInput, threshold: number, schedule: ScheduleResult) => PensionResult;

/** 통합 연금 계산 함수 (calcIncome+calcProperty+getThreshold+judge) (구현: 패킷 0002) */
export type calcPensionFn = (input: AppInput, schedule: ScheduleResult) => PensionResult;

/** 신청 일정 계산 (YYYYMMDD 형식, 만 65세 생일 기준) (구현: 패킷 0003) */
export type calcScheduleFn = (birthDate: string, today: string) => ScheduleResult;

/** 폼 검증 (에러 메시지 배열, null=유효) (구현: 패킷 0003) */
export type validateFormFn = (form: FormState) => string[]|null;

/** FormState → AppInput 변환 (금액 정수 변환, null=실패) (구현: 패킷 0003) */
export type toAppInputFn = (form: FormState) => AppInput|null;

/** 전체 진단 실행 (today 생략 시 현재일자) (구현: 패킷 0003) */
export type runDiagnosisFn = (input: AppInput, today?: string) => AppResult;
