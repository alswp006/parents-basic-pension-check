import { ListRow, Paragraph } from "@toss/tds-mobile";
import type { IncomeBreakdown, PropertyBreakdown } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BreakdownSectionProps {
  income: IncomeBreakdown;
  property: PropertyBreakdown;
}

export default function BreakdownSection({ income, property }: BreakdownSectionProps) {
  return (
    <>
      <ul>
        {/* Income section */}
        <ListRow
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="근로소득 반영액"
              bottom={formatCurrency(income.earnedReflected)}
            />
          }
        />
        <ListRow
          contents={
            <ListRow.Texts type="2RowTypeA" top="기타소득" bottom={formatCurrency(income.other)} />
          }
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="소득평가액"
              bottom={formatCurrency(income.total)}
            />
          }
        />

        {/* Property section */}
        <ListRow
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="일반재산"
              bottom={formatCurrency(property.general)}
            />
          }
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="금융재산(2천만 원 공제 후)"
              bottom={formatCurrency(property.financial)}
            />
          }
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="부채"
              bottom={`−${formatCurrency(Math.abs(property.debt))}`}
            />
          }
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="기본재산 공제"
              bottom={`−${formatCurrency(Math.abs(property.basicDeduction))}`}
            />
          }
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="고급자동차·회원권"
              bottom={formatCurrency(property.luxury)}
            />
          }
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="2RowTypeA"
              top="재산소득환산액"
              bottom={formatCurrency(property.total)}
            />
          }
        />
      </ul>

      {property.clamped && (
        <Paragraph.Text typography="st13" color="var(--adaptiveGrey600)">
          공제액이 재산보다 커서 0원으로 계산했어요
        </Paragraph.Text>
      )}
    </>
  );
}
