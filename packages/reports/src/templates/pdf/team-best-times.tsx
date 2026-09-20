import { formatTime } from "@project-aqua/swim-core/times";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { TeamBestTimesReport } from "../../types";
import {
  reportColors as colors,
  ReportFooter,
  ReportHeader,
} from "./components/chrome";
import { ensureReportFonts } from "./fonts";

const pagePad = {
  paddingTop: 36,
  paddingBottom: 48,
  paddingHorizontal: 28,
};

function MatrixSection({
  section,
}: {
  section: TeamBestTimesReport["sections"][number];
}) {
  const colWidth = Math.max(
    42,
    Math.min(64, Math.floor(620 / Math.max(1, section.columns.length + 1))),
  );

  return (
    <View style={{ marginBottom: 16 }} wrap={false}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: colors.accent,
          marginBottom: 6,
        }}
      >
        {section.genderLabel}
      </Text>
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: colors.rule,
          paddingBottom: 3,
          marginBottom: 2,
        }}
      >
        <Text
          style={{
            width: 110,
            fontSize: 7,
            fontWeight: 600,
            color: colors.muted,
          }}
        >
          Swimmer
        </Text>
        {section.columns.map((col) => (
          <Text
            key={col.eventKey}
            style={{
              width: colWidth,
              fontSize: 6.5,
              fontWeight: 600,
              color: colors.muted,
              textAlign: "right",
            }}
          >
            {col.label}
          </Text>
        ))}
      </View>
      {section.rows.map((row) => (
        <View
          key={row.swimmerId}
          style={{
            flexDirection: "row",
            paddingVertical: 2.5,
            borderBottomWidth: 0.5,
            borderBottomColor: colors.rule,
          }}
        >
          <Text
            style={{
              width: 110,
              fontSize: 8,
              color: colors.ink,
            }}
          >
            {row.swimmerName}
          </Text>
          {section.columns.map((col) => {
            const ms = row.timesByEventKey[col.eventKey];
            return (
              <Text
                key={col.eventKey}
                style={{
                  width: colWidth,
                  fontSize: 7.5,
                  color: colors.ink,
                  textAlign: "right",
                }}
              >
                {ms != null && ms > 0 ? formatTime(ms) : "—"}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function RelaySection({ report }: { report: TeamBestTimesReport }) {
  if (report.relaySuggestions.length === 0) return null;

  const byGender = (["female", "male"] as const).map((gender) => ({
    gender,
    label: gender === "female" ? "Female" : "Male",
    relays: report.relaySuggestions.filter((r) => r.gender === gender),
  }));

  return (
    <View>
      <Text
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: colors.ink,
          marginBottom: 8,
          marginTop: 4,
        }}
      >
        Relay suggestions
      </Text>
      <Text style={{ fontSize: 8, color: colors.muted, marginBottom: 10 }}>
        Built from individual SCY bests (A/B when enough swimmers). Not locked
        meet lineups.
      </Text>
      {byGender.map((group) =>
        group.relays.length === 0 ? null : (
          <View key={group.gender} style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: colors.accent,
                marginBottom: 6,
              }}
            >
              {group.label}
            </Text>
            {group.relays.map((relay) => (
              <View
                key={`${relay.eventKey}-${relay.letter}`}
                style={{
                  marginBottom: 8,
                  paddingBottom: 6,
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.rule,
                }}
                wrap={false}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 3,
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: 600 }}>
                    {relay.title} · {relay.letter}
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: 600 }}>
                    {relay.seedLabel}
                  </Text>
                </View>
                <Text style={{ fontSize: 8, color: colors.ink }}>
                  {relay.legs
                    .map(
                      (leg) =>
                        `${leg.roleLabel}: ${leg.swimmerName} (${leg.splitLabel})`,
                    )
                    .join("  ·  ")}
                </Text>
              </View>
            ))}
          </View>
        ),
      )}
    </View>
  );
}

export function TeamBestTimesPdfDocument({
  report,
}: {
  report: TeamBestTimesReport;
}) {
  ensureReportFonts();

  return (
    <Document
      title={`${report.teamName} — Best Times`}
      author={report.teamName}
      subject={report.reportTitle}
    >
      <Page
        size="LETTER"
        orientation="landscape"
        wrap
        style={{
          fontFamily: "Helvetica",
          fontSize: 9,
          ...pagePad,
          color: colors.ink,
        }}
      >
        <ReportHeader report={report} />
        {report.sections.length === 0 ? (
          <Text style={{ fontSize: 10, color: colors.muted }}>
            No SCY individual best times for active swimmers.
          </Text>
        ) : (
          report.sections.map((section) => (
            <MatrixSection key={section.gender} section={section} />
          ))
        )}
        <ReportFooter report={report} />
      </Page>

      {report.relaySuggestions.length > 0 ? (
        <Page
          size="LETTER"
          orientation="portrait"
          wrap
          style={{
            fontFamily: "Helvetica",
            fontSize: 9,
            paddingTop: 40,
            paddingBottom: 52,
            paddingHorizontal: 40,
            color: colors.ink,
          }}
        >
          <ReportHeader
            report={{
              ...report,
              reportTitle: "Relay suggestions",
            }}
          />
          <RelaySection report={report} />
          <ReportFooter
            report={{
              ...report,
              reportTitle: "Relay suggestions",
            }}
          />
        </Page>
      ) : null}
    </Document>
  );
}
