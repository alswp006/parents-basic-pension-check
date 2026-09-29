import { ListRow, Paragraph, Spacing } from "@toss/tds-mobile";
import type { IncomeBreakdown, PropertyBreakdown } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BreakdownSectionProps {
  income: IncomeBreakdown;
  property: PropertyBreakdown;
}

interface PropertyRow {
  key: keyof Pick<PropertyBreakdown, "general" | "financial" | "debt" | "basicDeduction" | "luxury">;
  label: string;
  minus: boolean;
}

const PROPERTY_ROWS: PropertyRow[] = [
  { key: "general", label: "일반재산", minus: false },
  { key: "financial", label: "금융재산(2천만 원 공제 후)", minus: false },
  { key: "debt", label: "부채", minus: true },
  { key: "basicDeduction", label: "기본재산 공제", minus: true },
  { key: "luxury", label: "고급자동차·회원권", minus: false },
];

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <ListRow
      contents={<ListRow.Texts type="1RowTypeA" top={label} />}
      right={<Paragraph.Text typography={strong ? "t5" : "t6"}>{value}</Paragraph.Text>}
    />
  );
}

export default function BreakdownSection({ income, property }: BreakdownSectionProps) {
  return (
    <>
      <Paragraph.Text typography="t4">소득 반영 내역</Paragraph.Text>
      <Spacing size={12} />
      <Row label="근로소득 반영액" value={formatCurrency(income.earnedReflected)} />
      <Row label="기타소득" value={formatCurrency(income.other)} />
      <Row label="소득평가액" value={formatCurrency(income.total)} strong />

      <Spacing size={24} />

      <Paragraph.Text typography="t4">재산 환산 내역 (월)</Paragraph.Text>
      <Spacing size={12} />
      {PROPERTY_ROWS.map((r) => {
        const v = property[r.key];
        return (
          <Row
            key={r.key}
            label={r.label}
            value={r.minus && v !== 0 ? `−${formatCurrency(Math.abs(v))}` : formatCurrency(v)}
          />
        );
      })}
      <Row label="재산소득환산액" value={formatCurrency(property.total)} strong />

      {property.clamped && (
        <>
          <Spacing size={8} />
          <Paragraph.Text typography="t7" color="var(--adaptiveGrey600)">
            공제액이 재산보다 커서 0원으로 계산했어요
          </Paragraph.Text>
        </>
      )}
    </>
  );
}
