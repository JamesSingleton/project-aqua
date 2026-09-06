import { Text, View } from "@react-pdf/renderer";
import type { MeetEntriesReport } from "../../../types";

const colors = {
  ink: "#111111",
  muted: "#667085",
  rule: "#D0D5DD",
  accent: "#0B4F6C",
};

export function ReportHeader({ report }: { report: MeetEntriesReport }) {
  const teamLine = report.teamCode
    ? `${report.teamName} [${report.teamCode}]`
    : report.teamName;

  return (
    <View style={{ marginBottom: 16 }} fixed={false}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            style={{
              fontSize: 8,
              color: colors.muted,
              fontWeight: 500,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Project Aqua
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 600, color: colors.ink }}>
            {report.reportTitle}
          </Text>
        </View>
        <Text style={{ fontSize: 8, color: colors.muted }}>
          {report.generatedAtLabel}
        </Text>
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.rule,
          paddingTop: 10,
          gap: 3,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: 600, color: colors.ink }}>
          {report.meetName} · {report.meetDateLabel} · {report.courseLabel}
        </Text>
        {report.location ? (
          <Text style={{ fontSize: 9, color: colors.muted }}>
            Location: {report.location}
          </Text>
        ) : null}
        {report.opponents ? (
          <Text style={{ fontSize: 9, color: colors.muted }}>
            Opponents: {report.opponents}
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 2,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: 500, color: colors.ink }}>
              {teamLine}
            </Text>
            {report.coachName ? (
              <Text style={{ fontSize: 9, color: colors.muted }}>
                Coach: {report.coachName}
              </Text>
            ) : null}
            {report.teamAddress ? (
              <Text style={{ fontSize: 8, color: colors.muted }}>
                {report.teamAddress}
              </Text>
            ) : null}
          </View>
          {report.coachEmail ? (
            <Text style={{ fontSize: 8, color: colors.muted }}>
              {report.coachEmail}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function ReportFooter({ report }: { report: MeetEntriesReport }) {
  return (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 28,
        left: 40,
        right: 40,
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 0.5,
        borderTopColor: colors.rule,
        paddingTop: 6,
      }}
    >
      <Text style={{ fontSize: 7, color: colors.muted }}>
        {report.meetName} · {report.teamName}
      </Text>
      <Text
        style={{ fontSize: 7, color: colors.muted }}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

export { colors as reportColors };
