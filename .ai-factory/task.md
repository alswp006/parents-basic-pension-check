# Parents Basic Pension Check (parents-basic-pension-check)
앱 이름: 부모님 기초연금 / Parents Basic Pension Check

> ⚠️ **확인이 필요한 수치**: 이 설계는 선정기준액, 기준연금액, 공제액, 기본재산액, 환산율 같은 정책 수치를 쓰지만 IDEA_BRIEF에는 이 값들이 없습니다. 그래서 설계 에이전트가 알고 있던 **2025년 보건복지부 고시값**을 임시로 넣었습니다. 이 값들은 `src/lib/policy.ts` 한 파일에만 모아 두었습니다. **출시 전에 올해(2026) 고시값으로 바꾸고 확인해야 합니다.** 아래 AC 예시는 모두 이 임시값으로 계산했습니다. 값을 바꾸면 예시 숫자도 다시 계산하세요.

> 🆕 **시뮬레이션 반영 요약**: 새로 추가한 AC는 5개입니다. 추가한 곳에는 🆕 표시를 붙였습니다.
>
> | 출처 | 제안 | 처리 | 이유 |
> |---|---|---|---|
> | 에러 경로 | AC-AD-ERROR (배너 로드 실패) | **반영(수정)** | `AdSlot`은 TDS가 아니라 템플릿이 제공하는 래퍼입니다. 그래서 `onError`/`onTimeout` prop이 있다고 가정하지 않습니다. 대신 "광고가 실패해도 본문이 정상 동작한다"를 통과 기준으로 정했습니다. |
> | 에러 경로 | AC-STORAGE-QUOTA (저장 공간 부족) | **반영(수정)** → AC-STORAGE-1 | 제안은 저장에 실패하면 결과로 이동하지 못하게 막는 방식이었습니다. 하지만 결과는 이미 계산되어 메모리에 있고, 저장은 다음 방문 때 폼을 미리 채우는 편의 기능일 뿐입니다. 그래서 막지 않고 결과로 이동하도록 바꿨습니다. "브라우저 저장소를 비우라"는 안내도 토스 앱 사용자가 실행할 수 없는 조치라서 넣지 않았습니다. |
> | 에러 경로 | AC-INPUT-3 (소수점·문자 입력) | **반영(수정)** | 숫자만 자동으로 뽑아내면 "12.5"가 "125"가 되어 금액이 10배로 바뀝니다. 그래서 금액 칸은 쉼표와 공백만 지우고, 나머지 문자가 있으면 검증 오류로 처리합니다. |
> | 검토 중 발견 | 손상된 `bpc:lastInput` | **추가** → AC-STORAGE-2 | 저장값이 깨졌거나 예전 형식이면 미리 채우기와 결과 복구 단계에서 화면이 멈출 수 있습니다. |
> | 검토 중 발견 | 배우자 "있음"에서 "없음"으로 바꿀 때 Switch 값이 남는 문제 | **추가** → AC-INPUT-4 | Switch 값이 남으면 `spouseEligible`이 잘못 저장되어 F3-AC-2 계산이 틀어집니다. |
> | 유저 여정 | 시나리오 3 "리워드 광고 → 더 깊은 층" | **반영하지 않음** | MicroPlanning에서 배너만 쓰기로 결정했습니다(AC-REWARD). 모든 결과를 무료로 보여 주는 설계를 그대로 유지합니다. |

## Mini-PRD
- **한줄 요약**: 우리 부모님이 기초연금을 받을 수 있을지, 소득과 재산을 넣으면 1분 안에 진단해 줍니다.
- **문제**: 기초연금은 소득인정액(소득평가액 + 재산의 소득환산액)으로 받을 수 있는지가 정해집니다. 기준이 복잡해서 자녀들은 대략적으로도 가늠하지 못하고, 복지로 모의계산을 직접 해 보는 사람도 드뭅니다. 신청 시기를 놓치는 경우도 있습니다.
- **목표**: 필수 3개 항목(생년월일, 배우자 유무, 거주 지역)과 금액 항목만 넣으면 한 번 탭해서 판정(가능/경계/어려움), 예상 월 수령액, 신청 가능 날짜를 한 화면에서 볼 수 있습니다.
- **타겟 유저**: 부모님이 만 65세 전후인 30~50대 자녀 중 기초연금을 받을 수 있는지와 언제 신청하면 되는지 궁금한 사람
- **핵심 기능** (최대 3개):
  1. 소득인정액을 계산하고 선정기준액과 비교해 가능성을 판정합니다(가능/경계/어려움). 재산 항목별로 소득 환산 내역을 보여 줍니다.
  2. 부부 감액과 소득역전방지 감액을 반영해 예상 월 수령액(1인, 가구 합계)을 계산합니다.
  3. 만 65세 생일을 기준으로 신청 가능 날짜와 D-day를 계산합니다.
- **비목표**:
  - 국민연금 연계 감액, 주거용 재산 한도, 부부 각자의 근로소득 공제(2회 공제) 같은 세부 규정은 계산하지 않습니다. 결과는 모의 추정이라고 안내합니다.
  - 실제 신청 접수나 복지로·정부24 연결(외부 링크)은 하지 않습니다.
  - 배우자의 신청 시기와 여러 부모님의 이력은 관리하지 않습니다. 저장하는 것은 마지막 입력 1건뿐입니다.
- **수익 모델**: 배너 광고만 씁니다. Home과 Result에 `AdSlot`을 1개씩 둡니다. 리워드 게이트는 없습니다(MicroPlanning 결정).
  - 예상 월 순수익 = DAU 15 × 하루 2회 조회 × 30 × (2,648 ÷ 1000) × 0.85 ≈ **2,026원/월**
  - DAU는 출시 직후 실측 기저선인 15명으로 잡았습니다. 이보다 큰 DAU를 쓸 근거(외부 채널, 기존 트래픽)는 브리프에 없습니다.

## SPEC

> 정책 상수(`src/lib/policy.ts`, 2025년 임시값)
> `POLICY_YEAR=2025` · `THRESHOLD_SINGLE=2,280,000` · `THRESHOLD_COUPLE=3,648,000` · `BASE_PENSION=342,510` · `EARNED_INCOME_DEDUCTION=1,120,000` · `EARNED_INCOME_RATE=0.7` · `FINANCIAL_DEDUCTION=20,000,000` · `BASIC_PROPERTY = { metro: 135,000,000, city: 85,000,000, rural: 72,500,000 }` · `PROPERTY_CONVERSION_RATE=0.04`(연) · `COUPLE_REDUCTION=0.2` · `MIN_PENSION_RATE=0.1`
> 모든 원 단위 계산은 마지막에 `Math.floor`로 내립니다.
>
> **공통 예시 입력 A**: 배우자 없음, 대도시, 근로소득 0, 기타소득 500,000, 일반재산 200,000,000, 금융재산 30,000,000, 부채 0, 고급자동차·회원권 0

### F1: 소득인정액 계산과 가능성 판정
- F1-AC-1: [U] 소득평가액 = `max(0, 월 근로소득 − 1,120,000) × 0.7 + 월 기타소득`입니다. 근로소득 2,000,000원, 기타소득 0원이면 **616,000원**이어야 합니다. 근로소득이 1,120,000원 이하면 근로소득 반영액은 0원이어야 합니다.
- F1-AC-2: [U] 소득인정액 = 소득평가액 + 재산소득환산액(F2-AC-2)입니다. 입력 A면 500,000 + 250,000 = **750,000원**이어야 합니다.
- F1-AC-3: [U] 배우자가 없으면 선정기준액은 `THRESHOLD_SINGLE`(2,280,000)입니다. 배우자가 있으면 배우자 나이와 상관없이 `THRESHOLD_COUPLE`(3,648,000)입니다.
- F1-AC-4: [U] `ratio = 소득인정액 ÷ 선정기준액`으로 판정합니다. `ratio ≤ 0.9`면 가능(`likely`), `0.9 < ratio ≤ 1.1`이면 경계(`borderline`), `ratio > 1.1`이면 어려움(`unlikely`)입니다. 단독 가구 기준 소득인정액이 750,000이면 가능, 2,100,000이면 경계(92.1%), 2,600,000이면 어려움(114.0%)이어야 합니다.
- F1-AC-5: [E] 입력 검증을 통과한 상태에서 사용자가 "진단하기"를 탭하면, 시스템은 계산 후 `/result`로 이동합니다. 첫 화면 위쪽에 판정 문구 1줄(가능: "받을 가능성이 높아요" / 경계: "기준선 근처예요" / 어려움: "받기 어려워 보여요"), 소득인정액, 선정기준액, 비율(%, 소수 첫째 자리)을 보여 줍니다.
- F1-AC-6: [U] Result 하단에는 항상 "{POLICY_YEAR}년 기준 모의 추정이에요. 실제 수급 여부는 국민연금공단·주민센터 조사로 결정돼요." 문구가 보여야 합니다. 이 문구에 링크(`<a href>`)는 0개여야 합니다.

### F2: 재산 항목별 소득 환산 내역
- F2-AC-1: [U] 기본재산액은 거주 지역에 따라 대도시 135,000,000 / 중소도시 85,000,000 / 농어촌 72,500,000을 씁니다.
- F2-AC-2: [U] 재산소득환산액 = `max(0, 일반재산 + max(0, 금융재산 − 20,000,000) − 부채 − 기본재산액) × 0.04 ÷ 12 + 고급자동차·회원권 가액`입니다. 입력 A면 (200,000,000 + 10,000,000 − 0 − 135,000,000) × 0.04 ÷ 12 = **250,000원**이어야 합니다.
- F2-AC-3: [U] Result의 "재산 환산 내역"에는 ListRow 5개(일반재산, 금융재산(2천만 원 공제 후), 부채(−), 기본재산 공제(−), 고급자동차·회원권)와 합계 1개를 보여 줍니다. 각 행은 월 환산액을 표시합니다. 괄호 안 값이 0 미만이라 0으로 처리한 경우 "공제액이 재산보다 커서 0원으로 계산했어요" 문구를 1줄 표시합니다.
- F2-AC-4: [U] Result의 "소득 반영 내역"에는 ListRow 2개(근로소득 반영액, 기타소득)와 소득평가액 합계를 표시합니다.

### F3: 예상 월 수령액 (부부 감액과 소득역전 감액 반영)
- F3-AC-1: [U] 단독 수급자의 기본 금액은 `BASE_PENSION`(342,510원)입니다. 입력 A면 1인 금액과 가구 합계가 모두 342,510원이어야 합니다.
- F3-AC-2: [U] 배우자가 있고 "배우자도 만 65세 이상"이 체크되어 있으면 수급자는 2명이고, 각각 20%를 감액합니다(1인 274,008원). 감액 사유에 `couple`이 들어가야 합니다. 체크가 없으면 수급자는 1명이고 부부 감액을 하지 않습니다.
- F3-AC-3: [U] `소득인정액 + 가구 수령액 합 > 선정기준액`이면 가구 합 = `선정기준액 − 소득인정액`으로 줄입니다. 하한은 `floor(BASE_PENSION × 0.1) × 수급자 수`이고, 감액 사유에 `incomeReversal`을 넣습니다.
  - 단독 가구, 소득인정액 2,100,000이면 **179,999원이 아니라 180,000원**이어야 합니다.
  - 부부 2인, 소득인정액 3,400,000이면 가구 248,000원, 1인 124,000원이어야 합니다.
- F3-AC-4: [U] 소득인정액이 선정기준액보다 크면 1인 금액과 가구 금액이 모두 0원이어야 합니다. 이때 `eligible=false`이고, Result에 "기준을 넘어 수령액이 없을 것으로 보여요"를 표시합니다.
- F3-AC-5: [U] Result의 "예상 월 수령액"에는 1인 금액, 가구 합계, 감액 사유를 보여 줍니다. 감액 사유는 "부부 감액 20%", "소득역전 방지 감액", "감액 없음" 중 해당하는 것을 모두 표시합니다.

### F4: 만 65세 기준 신청 가능 시기
- F4-AC-1: [U] 만 65세 생일은 생년월일에 65년을 더한 날입니다. 2월 29일생인데 해당 연도가 평년이면 3월 1일로 합니다(`Date.setFullYear` 동작).
- F4-AC-2: [U] 신청 시작일은 만 65세 생일이 속한 달의 **전달 1일**입니다. 1961-11-10생이면 2026-10-01, 1961-04-15생이면 2026-03-01이어야 합니다.
- F4-AC-3: [U] 오늘(기기 날짜, 테스트에서는 `today` 인자)을 기준으로 판단합니다.
  - 오늘이 신청 시작일보다 이르면 "{YYYY}년 {M}월 1일부터 신청할 수 있어요 (D-{N})"을 표시합니다. today=2026-09-30, 1961-11-10생이면 D-1이어야 합니다.
  - 오늘이 신청 시작일과 같거나 늦으면 "지금 신청할 수 있어요"를 표시합니다.
- F4-AC-4: [U] Result에 부모님의 만 나이를 표시합니다. today=2026-09-30, 1961-11-10생이면 64세, 1961-04-15생이면 65세여야 합니다.

### 필수 AC (모든 QuickApp에 포함)
- AC-INPUT-1: [W] 필수 항목(생년월일 8자리, 배우자 유무 Chip, 거주 지역 Chip) 중 하나라도 비어 있으면 "진단하기"를 `disabled`로 두고, SubmitFooter hint에 "생년월일·배우자 유무·거주 지역을 입력해 주세요"를 표시합니다. 금액 칸은 비어 있으면 0으로 처리합니다. TextField `hasError`는 해당 필드에 blur가 1회 이상 일어난 뒤에만 true가 될 수 있습니다(첫 화면에는 빨간 칸 0개).
- AC-INPUT-2: [W] 값이 범위를 벗어나면 해당 TextField의 help에 오류를 표시하고 CTA를 비활성으로 둡니다.
  - 생년월일이 존재하지 않는 날짜이거나 1900-01-01 이전이거나 오늘 이후면 "올바른 생년월일을 입력해 주세요"를 표시합니다.
  - 금액이 음수이거나 상한을 넘으면 "0 ~ {상한}만 원 사이로 입력해 주세요"를 표시합니다. 상한은 소득 10,000만 원/월, 재산·부채·자동차 1,000,000만 원입니다.
- 🆕 AC-INPUT-3: [W] 금액과 생년월일 칸에 숫자가 아닌 문자가 들어오면 다음과 같이 처리합니다.
  - **금액 TextField 6개**(근로소득, 기타소득, 일반재산, 금융재산, 부채, 고급자동차·회원권)
    - onChange에서 쉼표(`,`)와 공백만 지우고 상태에 저장합니다. 예를 들어 "1,500"을 붙여 넣으면 칸에 "1500"이 보이고 1,500만 원으로 계산합니다.
    - 정제한 값을 다음 순서로 검사합니다.
      - `/^\d+$/`에 맞으면 숫자로 보고 AC-INPUT-2의 범위를 검사합니다. 앞자리 0은 무시합니다("0050"은 50).
      - `/^-\d+$/`에 맞으면 AC-INPUT-2의 범위 오류 문구 "0 ~ {상한}만 원 사이로 입력해 주세요"를 표시합니다.
      - 그 밖의 값(예: "12.5", "abc", "1500원")이면 help에 "만 원 단위 정수로 입력해 주세요"를 표시합니다.
    - 숫자만 자동으로 뽑아내는 처리는 0건이어야 합니다. "12.5"가 "125"로 바뀌면 실패입니다.
  - **생년월일 TextField**
    - onChange에서 숫자가 아닌 문자를 모두 지우고 앞 8자리만 남깁니다. "1961-11-10"이나 "1961.11.10"을 붙여 넣으면 "19611110"이 되어야 합니다.
    - 하이픈이 들어간 10자를 붙여 넣어도 잘리지 않도록 TextField의 `maxLength`는 10으로 둡니다. 상태에 저장되는 값은 최대 8자리입니다. Screen Definitions의 "maxLength 8"은 정제한 뒤의 자릿수로 읽습니다.
    - 1~7자리인 상태에서 blur하면 "올바른 생년월일을 입력해 주세요"를 표시합니다. 이때 CTA는 AC-INPUT-1에 따라 disabled입니다.
  - **공통**
    - 오류가 있는 동안 CTA는 즉시 `disabled`입니다.
    - `hasError`와 help 문구는 AC-INPUT-1처럼 해당 필드에서 blur가 1회 이상 일어난 뒤에만 표시합니다.
- 🆕 AC-INPUT-4: [E] 사용자가 배우자 Chip을 "있음"에서 "없음"으로 바꾸면 다음과 같이 동작해야 합니다.
  - "배우자도 만 65세 이상이에요" Switch 렌더가 0개가 됩니다.
  - `spouseEligible`을 `false`로 초기화합니다.
  - 다시 "있음"을 고르면 Switch는 꺼진 상태로 나타납니다.
  - `toAppInput`은 `hasSpouse=false`일 때 항상 `spouseEligible=false`를 반환합니다.
  - 통과 예시: "있음"을 고르고 Switch를 켠 뒤 "없음"으로 바꾸고 진단하면 `recipients=1`이고 `reductions`에 `couple`이 0건이어야 합니다.
- AC-EMPTY: [S] `/result`에 route state가 없고 localStorage에 `bpc:lastInput`도 없으면 Empty State를 보여 줍니다. 안내 문구는 "아직 진단 결과가 없어요"이고, 버튼 "진단하러 가기"를 누르면 `/`로 이동합니다.
- AC-LOADING: [S] "진단하기"를 탭한 뒤 navigate하기 전까지 Button은 `loading=true` 상태입니다. 그동안 탭을 반복해도 계산은 1회만 실행됩니다.
- AC-ERROR: [W] 계산 결과에 `NaN`/`Infinity`가 있거나 예외가 나면 AlertDialog로 "계산 중 문제가 생겼어요"와 [다시 시도] 버튼을 보여 줍니다. Result에서 state 구조가 올바르지 않으면 에러 문구와 "다시 계산하기" 버튼을 보여 줍니다.
- 🆕 AC-AD-ERROR: [S] Home이나 Result의 배너 `AdSlot`이 로드에 실패해도 본문은 정상 동작해야 합니다. 로드 실패에는 네트워크 오류, 광고 없음(no-fill), `VITE_TOSS_AD_GROUP_ID`가 없는 빌드가 포함됩니다.
  - **본문 동작**
    - Home에서는 입력 폼, Chip, Switch, "진단하기" 버튼이 모두 렌더되고 조작할 수 있어야 합니다.
    - Result에서는 판정, 수령액, 신청 시기, 두 내역, 면책 문구, "다시 계산하기" 버튼이 모두 렌더되어야 합니다.
  - **광고 실패 때 앱이 하지 않는 것**
    - 앱 코드는 광고 실패 안내 문구, placeholder, 재시도 버튼을 렌더하지 않습니다(0건).
    - 광고 실패 때문에 AlertDialog나 에러 화면(AC-ERROR)이 뜨면 실패입니다.
  - **AdSlot을 쓰는 방식**
    - `AdSlot`은 템플릿 컴포넌트를 그대로 씁니다. 내부 수정은 0건입니다.
    - 존재하는지 확인되지 않은 `onError`/`onTimeout` prop은 쓰지 않습니다. 광고 영역을 접는 등의 처리는 `AdSlot` 자체 동작을 따릅니다.
    - `AdSlot`은 SubmitFooter 밖의 콘텐츠 영역에 둡니다. 광고 영역 크기가 바뀌어도 "진단하기" CTA 위치는 변하지 않아야 합니다.
  - **검증 방법**: 광고 env를 빼고 `npm run build`로 빌드한 뒤 입력 → 결과 → 다시 계산 흐름을 끝까지 수행할 수 있어야 합니다.
- 🆕 AC-STORAGE-1: [W] "진단하기"를 제출할 때 `bpc:lastInput` 저장이 예외(`QuotaExceededError`, `SecurityError` 등)로 실패해도 결과를 보여 줘야 합니다. 저장은 다음 방문 때 폼을 미리 채우는 편의 기능이고, 결과는 이미 메모리에 있기 때문입니다.
  - 계산한 `RouteState`로 `/result`에 이동해 정상 결과를 표시해야 합니다.
  - 저장 실패 때문에 AlertDialog를 띄우거나 네비게이션을 막는 경우는 0건이어야 합니다.
  - 저장은 `saveLastInput(input): boolean`으로 try/catch 안에서 호출합니다. 실패하면 `false`를 반환하고 예외를 다시 던지지 않습니다. 앱 코드의 `console.error` 호출은 0회입니다.
  - 저장에 실패한 뒤 다음에 Home을 열면 빈 폼이나 이전에 저장된 값으로 시작해도 통과입니다.
- 🆕 AC-STORAGE-2: [W] `bpc:lastInput`을 읽을 때 저장값이 손상되었으면 저장값이 없는 것으로 처리합니다.
  - **손상으로 보는 경우**
    - `JSON.parse`가 실패하는 경우
    - `AppInput` 필드가 없거나 타입이 맞지 않는 경우. 예: `region`이 `'metro' | 'city' | 'rural'`이 아님, 금액이 유한한 숫자가 아님, 금액이 음수이거나 AC-INPUT-2 상한을 넘음, `birthDate`가 AC-INPUT-2 기준으로 유효하지 않음
    - localStorage 읽기 자체에서 예외가 나는 경우
  - **처리**
    - `loadLastInput()`은 `null`을 반환하고 해당 키를 삭제합니다. 삭제에 실패하면 무시합니다.
    - Home은 빈 폼으로 시작하고, 첫 화면에 빨간 칸이 0개여야 합니다.
    - Result는 route state가 없을 때 AC-EMPTY의 Empty State를 표시합니다.
    - 화면이 하얗게 멈추거나 처리되지 않은 예외가 나면 실패입니다.
  - **AC-ERROR와의 구분**: AC-ERROR의 "state 구조 오류" 에러 화면은 **route state**가 잘못된 경우에만 적용합니다.
  - **테스트 케이스**: `'{bad json'`, `'{"region":"seoul"}'`, 금액 필드가 `-1`인 경우 모두 `null`이어야 합니다.
- AC-A11Y-1: [U] 모든 Button과 TextField에 `aria-label`이 있어야 합니다.
- AC-A11Y-2: [U] 모든 터치 타겟은 44×44px 이상입니다(TDS 기본값을 쓰고 커스텀 크기 지정은 0건).
- AC-A11Y-3: [U] 색상은 `vars.color` 토큰만 씁니다. 소스에 HEX, `rgb(` 하드코딩은 0건이어야 합니다.
- AC-REWARD: [E] **이 앱에는 해당하지 않습니다.** MicroPlanning에서 수익 모델을 배너로 정했으므로 `TossRewardAd` 렌더는 0건이고, 판정·수령액·환산 내역·신청 시기는 모두 무료로 공개합니다. 배너 `AdSlot`은 Home과 Result에 1개씩 둡니다.
- AC-FORMAT: [U] 금액은 모두 `formatCurrency`로 표시합니다(예: 342,510원). 비율, D-day, 나이는 `formatNumber`로 표시합니다.
- AC-REVIEW-1: [W] 외부 도메인으로 나가는 링크(`<a href="http…">`, `window.open`, `location.href =` 외부 URL)는 0건이어야 합니다.
- AC-REVIEW-2: [U] 정상 흐름(입력 → 결과 → 다시 계산)에서 `console.error`는 0회 발생해야 합니다.
- AC-REVIEW-3: [W] GA, Amplitude 등 외부 로깅 SDK import와 네트워크 호출은 0건이어야 합니다.
- AC-KEYBOARD: [E] TextField에 포커스가 가면 `scrollIntoView({ block: 'center' })`로 해당 필드를 화면 중앙으로 옮겨, 키보드가 입력칸과 하단 CTA를 가리지 않게 합니다.

### Screen Definitions

#### Home (/)
- Top 제목: "부모님 기초연금"
- 소개 문구: `Paragraph.Text` 1줄, "소득과 재산을 넣으면 받을 수 있을지 알려드려요"
- 입력 블록(섹션 사이는 `Spacing`으로 구분)
  1. 부모님 생년월일: TextField, `inputMode="numeric"`, maxLength 8, placeholder "예: 19611110"
  2. 배우자: Chip(ChipItem "없음" / "있음"). "있음"을 고르면 Switch "배우자도 만 65세 이상이에요"가 나타납니다.
  3. 거주 지역: Chip(ChipItem "대도시" / "중소도시" / "농어촌")
  4. 월 소득(만 원): TextField 2개, "근로소득(부부 합산)"과 "기타소득(연금·사업·임대 등)"
  5. 재산(만 원): TextField 4개, "주택·토지 등 일반재산(공시가격)", "예금·주식 등 금융재산", "부채", "고급자동차·회원권"
- `AdSlot` 배너 1개
- SubmitFooter: 버튼 "진단하기"와 hint
- 상태
  - 초기: `bpc:lastInput`이 없으면 빈 폼입니다. 있으면 그 값으로 미리 채웁니다.
  - 입력 중
  - 검증 오류
  - 계산 중: 버튼이 loading 상태입니다.
- 네비게이션: 계산을 마치면 `bpc:lastInput`을 저장하고 `navigate('/result', { state: RouteState })`로 이동합니다.
- 🆕 보완 사항
  - 생년월일 칸의 입력 정제와 `maxLength`는 AC-INPUT-3을 따릅니다.
  - 저장값이 손상되었으면 빈 폼으로 시작합니다(AC-STORAGE-2).
  - 저장에 실패해도 결과로 이동합니다(AC-STORAGE-1).

#### Result (/result)
- Top 제목: "진단 결과"
- 핵심 답(모두 무료)
  1. 판정 문구(F1-AC-5), 소득인정액, 선정기준액, 비율
  2. 예상 월 수령액: 1인 금액, 가구 합계, 감액 사유
  3. 신청 가능 시기: 만 나이, 만 65세 생일, 신청 시작일, D-day 또는 "지금 신청할 수 있어요"
- 상세 내역: 소득 반영 내역(F2-AC-4), 재산 환산 내역(F2-AC-3)
- 면책 문구(F1-AC-6), `AdSlot` 배너 1개, Button "다시 계산하기"(`/`로 이동)
- 상태
  - 결과 표시
  - state가 없으면 `bpc:lastInput`으로 다시 계산
  - Empty(AC-EMPTY)
  - 에러(AC-ERROR)
- 🆕 보완 사항
  - `bpc:lastInput`이 손상되었으면 Empty로 처리합니다(AC-STORAGE-2).
  - 광고가 실패해도 모든 섹션을 렌더합니다(AC-AD-ERROR).

### Data Model
```typescript
// src/lib/types.ts
export type Region = 'metro' | 'city' | 'rural';
export type Verdict = 'likely' | 'borderline' | 'unlikely';
export type Reduction = 'couple' | 'incomeReversal';

export interface AppInput {
  birthDate: string;          // 'YYYY-MM-DD'
  hasSpouse: boolean;
  spouseEligible: boolean;    // 배우자도 만 65세 이상 (hasSpouse=false면 항상 false)
  region: Region;
  monthlyEarnedIncome: number; // 원, 부부 합산
  monthlyOtherIncome: number;  // 원
  generalProperty: number;     // 원
  financialProperty: number;   // 원
  debt: number;                // 원
  luxuryAssets: number;        // 원 (고급자동차·회원권 가액, 월 소득으로 100% 반영)
}

export interface IncomeBreakdown { earnedReflected: number; other: number; total: number; }
export interface PropertyBreakdown {
  general: number; financial: number; debt: number; basicDeduction: number; // 모두 월 환산액(부호 포함)
  luxury: number; clamped: boolean; total: number;
}
export interface PensionResult {
  eligible: boolean; recipients: 1 | 2; perPerson: number; household: number; reductions: Reduction[];
}
export interface ScheduleResult {
  age: number; turns65On: string; applyFrom: string; canApplyNow: boolean; dDay: number; // canApplyNow면 dDay=0
}
export interface AppResult {
  income: IncomeBreakdown; property: PropertyBreakdown;
  recognizedIncome: number; threshold: number; ratio: number; verdict: Verdict;
  pension: PensionResult; schedule: ScheduleResult; policyYear: number;
}

// Home 폼 상태 (문자열 입력, 금액은 만 원 단위)
export interface FormState {
  birthDate: string; hasSpouse: boolean | null; spouseEligible: boolean; region: Region | null;
  earned: string; other: string; general: string; financial: string; debt: string; luxury: string;
}

// Route state (react-router useNavigate)
export interface RouteState { input: AppInput; result: AppResult; }
```

## TASK

### Epic 1: Data Layer (타입, 정책 상수, 계산 로직)

- **Task 1: src/lib/types.ts, 타입 정의**
  - Covers: (F1~F4 전체의 기반 타입)
  - Files: `src/lib/types.ts`
  - DoD: 위 Data Model을 그대로 export합니다. `any`는 0건이고 `tsc --noEmit`이 통과해야 합니다.

- **Task 2: src/lib/policy.ts, 정책 상수 한 곳에 모으기**
  - Covers: F1-AC-3, F2-AC-1, F3-AC-1
  - Files: `src/lib/policy.ts`
  - DoD: SPEC 상단의 상수를 `as const`로 export합니다. 파일 맨 위에 `// ⚠️ 2025년 고시값(임시). 출시 전 해당 연도 보건복지부 고시로 교체·검증 필수` 주석을 붙입니다. 다른 파일에 정책 숫자 리터럴은 0건이어야 합니다(grep으로 확인).

- **Task 3: src/lib/calculator.ts, 소득평가액·재산환산액·소득인정액·판정 (F1, F2)**
  - Covers: F1-AC-1, F1-AC-2, F1-AC-3, F1-AC-4, F2-AC-2
  - Files: `src/lib/calculator.ts`, `src/lib/calculator.test.ts`
  - DoD
    - 순수 함수 `calcIncome`, `calcProperty`, `getThreshold`, `judge`를 export합니다.
    - vitest로 테스트합니다. 템플릿에 없으면 devDependency로 추가합니다.
    - 테스트 케이스: 616,000 / 입력 A 250,000·750,000 / 비율 3케이스(가능·경계·어려움) / 공제 초과 시 `clamped=true`·`total=0`
    - 모두 통과해야 합니다.

- **Task 4: src/lib/pension.ts, 예상 월 수령액 (F3)**
  - Covers: F3-AC-1, F3-AC-2, F3-AC-3, F3-AC-4
  - Files: `src/lib/pension.ts`, `src/lib/pension.test.ts`
  - DoD
    - `calcPension(input, recognizedIncome, threshold)`를 export합니다.
    - 테스트 케이스: 단독 342,510 / 부부 1인 274,008 / 단독 역전 180,000 / 부부 역전 248,000·124,000 / 하한 적용 / 기준 초과 0원·`eligible=false`
    - 모두 통과해야 합니다.

- **Task 5: src/lib/schedule.ts, src/lib/validation.ts, 신청 시기와 입력 검증**
  - Covers: F4-AC-1, F4-AC-2, F4-AC-3, F4-AC-4, AC-INPUT-2, 🆕 AC-INPUT-3(검증 부분), 🆕 AC-INPUT-4(`toAppInput` 부분)
  - Files: `src/lib/schedule.ts`, `src/lib/validation.ts`, `src/lib/schedule.test.ts`, 🆕 `src/lib/validation.test.ts`
  - DoD
    - `calcSchedule(birthDate, today)`: today=2026-09-30 기준으로 1961-11-10생 → applyFrom 2026-10-01, D-1, 64세 / 1961-04-15생 → 2026-03-01, canApplyNow, 65세 / 1960-02-29생 → 65세 생일 2025-03-01. 모두 통과해야 합니다.
    - `validateForm(form, today)`: 필드별 오류 메시지 맵과 `toAppInput`(만 원 × 10,000)을 반환합니다.
    - `runDiagnosis(input, today)`: calculator, pension, schedule 결과를 모아 `AppResult`를 반환합니다. 결과에 NaN이 있으면 throw합니다.
    - 🆕 `validateForm`은 금액 칸에 AC-INPUT-3의 우선순위를 적용합니다.
      - "12.5"와 "abc"는 "만 원 단위 정수로 입력해 주세요"
      - "-5"는 "0 ~ {상한}만 원 사이로 입력해 주세요"
      - "0050"은 오류 없이 500,000원
      - 생년월일 "1961111"(7자리)은 "올바른 생년월일을 입력해 주세요"
    - 🆕 `toAppInput`: `hasSpouse=false`면 `spouseEligible=false`를 반환합니다(폼 값이 true여도 마찬가지).
    - 🆕 위 케이스를 `validation.test.ts`에 넣고 모두 통과해야 합니다.

- 🆕 **Task 5b: src/lib/sanitize.ts, src/lib/storedInput.ts, 입력 정제와 저장 안전장치**
  - Covers: AC-INPUT-3(정제 부분), AC-STORAGE-1(lib 부분), AC-STORAGE-2
  - Files: `src/lib/sanitize.ts`, `src/lib/storedInput.ts`, `src/lib/sanitize.test.ts`, `src/lib/storedInput.test.ts`
  - DoD
    - `sanitizeAmount(raw)`: 쉼표와 공백만 지웁니다. "1,500" → "1500", "12.5" → "12.5"(그대로 둠)이어야 합니다.
    - `sanitizeBirthDate(raw)`: 숫자만 남기고 앞 8자리로 자릅니다. "1961-11-10" → "19611110", "1961.11.10" → "19611110"이어야 합니다.
    - `saveLastInput(input): boolean`: 템플릿 storage helper의 `set`을 try/catch로 감쌉니다. mock이 throw해도 `false`를 반환하고 예외를 전파하지 않아야 합니다.
    - `loadLastInput(): AppInput | null`: 파싱과 구조 검증에 실패하거나 읽기에서 예외가 나면 `null`을 반환하고 키를 삭제합니다(삭제 예외는 무시). 테스트 케이스는 `'{bad json'`, `'{"region":"seoul"}'`, 금액 `-1`, 정상 입력 A의 왕복(저장 후 다시 읽기)이며 모두 통과해야 합니다.
    - 금액 상한과 날짜 검증은 Task 5 `validation.ts`의 함수를 재사용합니다. 숫자 리터럴을 중복해서 쓴 곳은 0건이어야 합니다.

### Epic 2: Pages

- **Task 6: src/pages/Home.tsx, 입력 폼·검증·네비게이션**
  - Covers: F1-AC-5, AC-INPUT-1, AC-INPUT-2, AC-LOADING, AC-ERROR, AC-KEYBOARD, AC-A11Y-1, AC-A11Y-2, AC-A11Y-3, AC-REVIEW-2, 🆕 AC-INPUT-3, 🆕 AC-INPUT-4, 🆕 AC-AD-ERROR, 🆕 AC-STORAGE-1, 🆕 AC-STORAGE-2
  - Files: `src/pages/Home.tsx`
  - DoD
    - Screen Definitions대로 Top, TextField, Chip/ChipItem, Switch, Spacing, SubmitFooter, AdSlot을 조립합니다. 인라인 margin·padding 스타일은 0건입니다.
    - 비율 검증은 blur 뒤에만 표시합니다. CTA의 disabled 상태와 hint가 AC-INPUT-1 조건과 일치해야 합니다.
    - 모든 TextField의 onFocus에서 `scrollIntoView`를 호출합니다.
    - 제출하면 `loading` 상태로 `runDiagnosis`를 실행하고, 저장(`storage.set('bpc:lastInput')`) 후 navigate합니다. 예외가 나면 AlertDialog와 [다시 시도]를 보여 줍니다.
    - `bpc:lastInput`이 있으면 폼을 미리 채웁니다.
    - 🆕 입력 정제
      - 금액 TextField 6개의 onChange는 `sanitizeAmount`를 거칩니다.
      - 생년월일 onChange는 `sanitizeBirthDate`를 거치고, 생년월일 TextField의 `maxLength`는 10입니다.
      - 수동 확인: "1961-11-10"을 붙여 넣으면 "19611110"이 되어야 합니다.
    - 🆕 배우자 Chip: "없음"을 고르면 `spouseEligible=false`로 바꾸고 Switch를 숨깁니다.
    - 🆕 저장과 미리 채우기
      - 저장은 `saveLastInput`으로 합니다(내부에서 `storage.set('bpc:lastInput')`를 호출). 반환값과 상관없이 navigate합니다.
      - 미리 채우기는 `loadLastInput()`으로 합니다. 반환값이 `null`이면 빈 폼입니다.
    - 🆕 광고 실패 확인
      - `AdSlot`은 SubmitFooter 밖에 둡니다.
      - 광고 env가 없는 상태로 실행해도 폼 조작과 제출을 할 수 있어야 합니다(수동 확인).

- **Task 7: src/pages/Result.tsx, 판정·수령액·신청 시기 (핵심 답)**
  - Covers: F1-AC-5, F1-AC-6, F3-AC-4, F3-AC-5, F4-AC-3, F4-AC-4, AC-EMPTY, AC-ERROR, AC-FORMAT, AC-REWARD, AC-A11Y-1, AC-A11Y-3, 🆕 AC-AD-ERROR, 🆕 AC-STORAGE-2
  - Files: `src/pages/Result.tsx`
  - DoD
    - state 처리: 없으면 lastInput으로 다시 계산하고, 그것도 없으면 Empty를, 구조가 올바르지 않으면 에러 화면을 보여 줍니다. 세 분기 모두 수동으로 확인합니다.
    - 판정 문구 3종, 감액 사유 문구 3종, D-day 문구 2종이 SPEC 문구와 정확히 같아야 합니다.
    - 금액은 모두 `formatCurrency`로 표시합니다. `TossRewardAd` import는 0건입니다.
    - 면책 문구와 AdSlot, "다시 계산하기" 버튼을 둡니다.
    - 🆕 state가 없을 때는 `loadLastInput()`으로 복구합니다. 수동 확인: localStorage에 `'{bad json'`을 넣고 `/result`에 직접 들어가면 Empty State가 보여야 합니다.
    - 🆕 광고 env가 없는 상태로 실행해도 모든 섹션이 렌더되어야 합니다(수동 확인).

- **Task 8: src/components/BreakdownSection.tsx, 소득·재산 환산 내역**
  - Covers: F2-AC-3, F2-AC-4, AC-FORMAT
  - Files: `src/components/BreakdownSection.tsx`, `src/pages/Result.tsx`(삽입만)
  - DoD
    - 소득 행 2개와 합계, 재산 행 5개와 합계를 ListRow로 보여 줍니다. 차감 항목에는 "−"를 붙입니다.
    - `clamped=true`일 때만 안내 문구 1줄을 렌더합니다.
    - 입력 A로 합계 250,000원이 표시되는지 확인합니다.

### Epic 3: Integration

- **Task 9: src/App.tsx, 라우트 연결과 심사 체크**
  - Covers: AC-REVIEW-1, AC-REVIEW-2, AC-REVIEW-3, 🆕 AC-AD-ERROR(통합 확인)
  - Files: `src/App.tsx`
  - DoD
    - `/`(Home)과 `/result`(Result) 라우트를 등록합니다. 정의되지 않은 경로는 `/`로 redirect합니다.
    - grep 결과: `href="http`, `window.open`, `gtag`, `amplitude`가 모두 0건이어야 합니다.
    - 입력 → 결과 → 다시 계산 흐름을 돌려서 콘솔 error가 0건이어야 합니다.
    - `npm run build`와 전체 테스트가 통과해야 합니다.
    - 🆕 `VITE_TOSS_AD_GROUP_ID`를 비운 채로 `npm run build`와 preview를 실행해, 입력 → 결과 → 다시 계산 흐름을 끝까지 수행할 수 있어야 합니다. 앱 코드가 렌더한 광고 오류 문구는 0건이어야 합니다. `VITE_*` 값은 빌드할 때 주입되므로 검증이 끝나면 정상 env로 다시 빌드합니다.
    - 🆕 grep 결과: `src/components/AdSlot*`의 diff가 0줄이어야 합니다(템플릿 원본 유지).

## AC Coverage
- Total: **38개** (F1 6 + F2 4 + F3 5 + F4 4 + 필수 19) (🆕 +5: AC-INPUT-3, AC-INPUT-4, AC-AD-ERROR, AC-STORAGE-1, AC-STORAGE-2)
- Covered: 38개 (100%)
  - F1-AC-1·2·4 → T3 / F1-AC-3 → T2·T3 / F1-AC-5 → T6·T7 / F1-AC-6 → T7
  - F2-AC-1 → T2 / F2-AC-2 → T3 / F2-AC-3·4 → T8
  - F3-AC-1 → T2·T4 / F3-AC-2·3 → T4 / F3-AC-4 → T4·T7 / F3-AC-5 → T7
  - F4-AC-1·2 → T5 / F4-AC-3·4 → T5·T7
  - INPUT-1 → T6 / INPUT-2 → T5·T6 / EMPTY → T7 / LOADING → T6 / ERROR → T6·T7 / KEYBOARD → T6
  - A11Y-1·3 → T6·T7 / A11Y-2 → T6 / REWARD → T7 / FORMAT → T7·T8 / REVIEW-1·3 → T9 / REVIEW-2 → T6·T9
  - 🆕 INPUT-3 → T5·T5b·T6 / INPUT-4 → T5·T6 / AD-ERROR → T6·T7·T9 / STORAGE-1 → T5b·T6 / STORAGE-2 → T5b·T6·T7
- Uncovered: 0개