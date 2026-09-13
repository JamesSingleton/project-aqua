import { Text, View } from "@react-pdf/renderer";
import type { MeetEntriesReportSummary } from "../../../types";
import { reportColors as colors } from "./chrome";

export function ReportSummary({
  summary,
}: {
  summary: MeetEntriesReportSummary;
}) {
  const cells = [
    { label: "Female IE's", value: summary.femaleIndividualEntries },
    { label: "Male IE's", value: summary.maleIndividualEntries },
    { label: "Total IE's", value: summary.totalIndividualEntries },
    { label: "Total RE's", value: summary.totalRelayEntries },
    { label: "Total athletes", value: summary.totalAthletes },
  ];

  return (
    <View
      wrap={false}
      style={{
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.rule,
        paddingTop: 12,
      }}
    >
      <Text
        style={{
          fontSize: 8,
          fontWeight: 600,
          color: colors.muted,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Summary
      </Text>
      <View style={{ flexDirection: "row", gap: 18 }}>
        {cells.map((cell) => (
          <View key={cell.label}>
            <Text style={{ fontSize: 8, color: colors.muted, marginBottom: 2 }}>
              {cell.label}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: 600, color: colors.ink }}>
              {cell.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
