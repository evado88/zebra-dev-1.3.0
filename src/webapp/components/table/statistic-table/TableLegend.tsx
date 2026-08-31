import React, { useMemo } from "react";
import styled from "styled-components";
import i18n from "../../../../utils/i18n";
import { cellStatusColor } from "./ColoredCell";
import { CellStatus, CellStatusValues } from "./useTableCell";
import { TableColumn } from "./StatisticTable";
import { Maybe } from "../../../../utils/ts-utils";

export type TableLegendProps = {
    columns: TableColumn[];
    columnRules: { [key: string]: number };
    editRiskAssessmentColumns: string[];
};

type LegendItem = {
    status: Maybe<CellStatusValues>;
    label: string;
    description: string;
};

function getDaysLabel(days: number): string {
    return days === 1 ? i18n.t("1 day") : i18n.t("{{days}} days", { days: days });
}

function getColumnsLabel(columns: TableColumn[], asRange: boolean): string {
    const labels = columns.map(column => column.label);
    const firstLabel = labels[0];
    const lastLabel = labels[labels.length - 1];

    return asRange && labels.length > 2 && firstLabel && lastLabel
        ? `${firstLabel}-${lastLabel}`
        : labels.join(", ");
}

// The colors explained here are applied by getCellColor in useTableCell.
export const TableLegend: React.FC<TableLegendProps> = React.memo(
    ({ columns, columnRules, editRiskAssessmentColumns }) => {
        const targetColumns = useMemo(
            () => columns.filter(column => columnRules[column.value] !== undefined),
            [columns, columnRules]
        );

        const riskAssessmentColumns = useMemo(
            () => columns.filter(column => editRiskAssessmentColumns.includes(column.value)),
            [columns, editRiskAssessmentColumns]
        );

        const items: LegendItem[] = useMemo(() => {
            const targetsLabel = targetColumns
                .map(column => `${column.label} ≤ ${getDaysLabel(columnRules[column.value] ?? 0)}`)
                .join(", ");
            const targetColumnsLabel = getColumnsLabel(targetColumns, false);

            // Risk assessment columns are colored against the respond target, see getCellColor.
            const riskAssessmentRule = columnRules.respond7d;
            const riskAssessmentLabel = getColumnsLabel(riskAssessmentColumns, true);
            const hasRiskAssessmentRule =
                riskAssessmentColumns.length > 0 && riskAssessmentRule !== undefined;

            const alertDescriptions = [
                targetColumns.length > 0
                    ? i18n.t("{{columns}}: more days than the target", {
                          columns: targetColumnsLabel,
                      })
                    : undefined,
                hasRiskAssessmentRule
                    ? i18n.t("{{columns}}: completed in more than {{days}}", {
                          columns: riskAssessmentLabel,
                          days: getDaysLabel(riskAssessmentRule),
                      })
                    : undefined,
            ].filter((description): description is string => !!description);

            const noColorDescriptions = [
                hasRiskAssessmentRule
                    ? i18n.t("{{columns}}: completed within {{days}}", {
                          columns: riskAssessmentLabel,
                          days: getDaysLabel(riskAssessmentRule),
                      })
                    : undefined,
                targetColumns.length > 0
                    ? i18n.t("{{columns}}: no value recorded", { columns: targetColumnsLabel })
                    : undefined,
            ].filter((description): description is string => !!description);

            const allItems: Maybe<LegendItem>[] = [
                targetColumns.length > 0
                    ? {
                          status: CellStatus.Valid,
                          label: i18n.t("Target met"),
                          description: targetsLabel,
                      }
                    : undefined,
                alertDescriptions.length > 0
                    ? {
                          status: CellStatus.Alert,
                          label: i18n.t("Target missed"),
                          description: alertDescriptions.join("; "),
                      }
                    : undefined,
                riskAssessmentColumns.length > 0
                    ? {
                          status: CellStatus.Warning,
                          label: i18n.t("Not completed"),
                          description: i18n.t("{{columns}}: no date recorded yet", {
                              columns: riskAssessmentLabel,
                          }),
                      }
                    : undefined,
                noColorDescriptions.length > 0
                    ? {
                          status: undefined,
                          label: i18n.t("No color"),
                          description: noColorDescriptions.join("; "),
                      }
                    : undefined,
            ];

            return allItems.filter((item): item is LegendItem => !!item);
        }, [columnRules, riskAssessmentColumns, targetColumns]);

        if (items.length === 0) return null;

        return (
            <LegendContainer aria-label={i18n.t("Color legend")}>
                <LegendTitle>{i18n.t("Color legend")}</LegendTitle>
                {items.map(({ status, label, description }) => (
                    <LegendItemContainer key={label}>
                        <ColorSwatch
                            aria-hidden="true"
                            color={status ? cellStatusColor[status] : undefined}
                        />
                        <LegendLabel>{label}</LegendLabel>
                        <LegendDescription>{description}</LegendDescription>
                    </LegendItemContainer>
                ))}
            </LegendContainer>
        );
    }
);

const LegendContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1rem;
    font-size: 0.75rem;
    color: ${props => props.theme.palette.text.secondary};
`;

const LegendTitle = styled.span`
    font-weight: 600;
    color: ${props => props.theme.palette.text.primary};
`;

const LegendItemContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 0.375rem;
`;

const ColorSwatch = styled.span<{ color?: string }>`
    width: 0.75rem;
    height: 0.75rem;
    flex-shrink: 0;
    border-radius: 2px;
    background-color: ${props =>
        props.color ? props.theme.palette.common[props.color] : props.theme.palette.common.white};
    border: 1px solid
        ${props =>
            props.color ? props.theme.palette.common[props.color] : props.theme.palette.common.grey};
`;

const LegendLabel = styled.span`
    font-weight: 600;
    color: ${props => props.theme.palette.text.primary};
`;

const LegendDescription = styled.span`
    color: ${props => props.theme.palette.text.secondary};
`;
