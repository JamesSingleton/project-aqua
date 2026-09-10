import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { SplitSheetMark, SplitSheetReport } from "../../types";
import {
  reportColors as colors,
  ReportFooter,
  ReportHeader,
} from "./components/chrome";
import { ensureReportFonts } from "./fonts";

function relayLineupLabel(marks: SplitSheetMark[]): string | null {
  const names = marks.flatMap((mark) =>
    mark.athleteName?.trim() ? [mark.athleteName.trim()] : [],
  );
  if (names.length === 0) return null;
  return `Lineup: ${names.join(" · ")}`;
}

function SplitBoxes({
  marks,
  named = false,
  blankNames = false,
}: {
  marks: SplitSheetMark[];
  named?: boolean;
  blankNames?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: named ? "nowrap" : "wrap",
        gap: named ? 6 : 7,
        flexGrow: 1,
        width: named ? "100%" : undefined,
      }}
    >
      {marks.map((mark, index) => (
        <View
          key={`${mark.label}-${index}`}
          style={{
            flexGrow: 1,
            flexShrink: named ? 1 : 1,
            flexBasis: named ? 0 : mark.isFinal ? 72 : 58,
            gap: named ? 2 : 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontSize: named ? 8 : 7,
                fontWeight: mark.isFinal ? 600 : 400,
                color: mark.isFinal ? colors.ink : colors.muted,
              }}
            >
              {mark.label}
            </Text>
          </View>
          {named && blankNames ? (
            <View
              style={{
                height: 12,
                borderBottomWidth: mark.isFinal ? 0 : 0.8,
                borderBottomColor: colors.ink,
              }}
            />
          ) : named ? (
            <Text
              wrap={false}
              style={{
                fontSize: 9,
                fontWeight: 500,
                color: colors.ink,
                height: 12,
              }}
            >
              {mark.athleteName ?? " "}
            </Text>
          ) : !named && mark.athleteName ? (
            <Text
              style={{
                fontSize: 6.5,
                color: colors.ink,
              }}
            >
              {mark.athleteName}
            </Text>
          ) : null}
          <View
            style={{
              height: named ? 32 : 40,
              borderWidth: mark.isFinal ? 1.1 : 0.8,
              borderColor: mark.isFinal ? colors.ink : colors.rule,
              borderRadius: 2,
            }}
          />
        </View>
      ))}
    </View>
  );
}

function EventHeading({
  eventNumber,
  genderLabel,
  title,
  trailing,
}: {
  eventNumber: number | null;
  genderLabel: string;
  title: string;
  trailing?: string;
}) {
  const num = eventNumber != null ? `# ${eventNumber}` : "# —";
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        borderBottomWidth: 0.5,
        borderBottomColor: colors.rule,
        paddingBottom: 4,
        marginBottom: 6,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: 600, color: colors.ink }}>
        {num} {genderLabel} {title}
      </Text>
      {trailing ? (
        <Text style={{ fontSize: 9, fontWeight: 500, color: colors.ink }}>
          {trailing}
        </Text>
      ) : null}
    </View>
  );
}

export function SplitSheetPdfDocument({
  report,
}: {
  report: SplitSheetReport;
}) {
  ensureReportFonts();
  const landscape = report.pageOrientation === "landscape";

  return (
    <Document
      title={`${report.meetName} — Split sheet`}
      author={report.teamName}
      subject={report.reportTitle}
    >
      <Page
        size="LETTER"
        orientation={landscape ? "landscape" : "portrait"}
        wrap
        style={{
          fontFamily: "Helvetica",
          fontSize: 9,
          paddingTop: 36,
          paddingBottom: 48,
          paddingHorizontal: landscape ? 32 : 40,
          color: "#111111",
        }}
      >
        <ReportHeader report={report} />
        <View>
          {report.groupBy === "swimmer"
            ? report.swimmers.map((swimmer) => (
                <View
                  key={swimmer.membershipId}
                  wrap={false}
                  style={{ marginBottom: 12 }}
                >
                  <View
                    style={{
                      borderBottomWidth: 0.5,
                      borderBottomColor: colors.rule,
                      paddingBottom: 4,
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: colors.ink,
                      }}
                    >
                      {swimmer.name}
                    </Text>
                  </View>
                  {swimmer.lines.map((line) => (
                    <View
                      key={`${line.eventId}-${line.kind}-${line.relayLetter ?? ""}-${line.isAlternate ? "a" : "p"}-${line.marks[0]?.label ?? ""}`}
                      style={{ marginBottom: 8 }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 4,
                          gap: 8,
                        }}
                      >
                        <Text
                          style={{ fontSize: 9, color: colors.ink, flex: 1 }}
                        >
                          {line.eventNumber != null
                            ? `#${line.eventNumber} `
                            : ""}
                          {line.eventLabel}
                          {line.kind === "relay"
                            ? ` · ${line.relayLetter ?? "A"}${line.isAlternate ? " alt" : ""}`
                            : ""}
                          {line.exhibition ? " (ex)" : ""}
                        </Text>
                        <Text style={{ fontSize: 8, color: colors.muted }}>
                          {line.seedLabel}
                        </Text>
                      </View>
                      <SplitBoxes marks={line.marks} />
                    </View>
                  ))}
                </View>
              ))
            : report.events.map((event) =>
                event.kind === "individual" ? (
                  <View key={event.eventId} style={{ marginBottom: 14 }}>
                    <EventHeading
                      eventNumber={event.eventNumber}
                      genderLabel={event.genderLabel}
                      title={event.title}
                    />
                    {event.rows.map((row) => (
                      <View
                        key={`${event.eventId}-${row.entryId}`}
                        wrap={false}
                        style={{
                          flexDirection: "row",
                          gap: 10,
                          paddingVertical: 6,
                          borderBottomWidth: 0.4,
                          borderBottomColor: colors.rule,
                        }}
                      >
                        <View style={{ width: 120 }}>
                          <Text style={{ fontSize: 9, color: colors.ink }}>
                            {row.name}
                          </Text>
                          <Text style={{ fontSize: 8, color: colors.muted }}>
                            {row.seedLabel}
                          </Text>
                        </View>
                        <SplitBoxes marks={row.marks} />
                      </View>
                    ))}
                  </View>
                ) : (
                  <View key={event.eventId} style={{ marginBottom: 14 }}>
                    {event.teams.map((team) => (
                      <View
                        key={`${event.eventId}-${team.letter}`}
                        wrap={false}
                        style={{
                          marginBottom: event.teams.length > 1 ? 10 : 0,
                        }}
                      >
                        <EventHeading
                          eventNumber={event.eventNumber}
                          genderLabel={event.genderLabel}
                          title={`${event.title} ${team.letter}`}
                          trailing={team.seedLabel}
                        />
                        {report.blankRelayLines ? (
                          <Text
                            style={{
                              fontSize: 8,
                              color: colors.muted,
                              marginBottom: 4,
                            }}
                          >
                            {relayLineupLabel(team.marks) ?? ""}
                          </Text>
                        ) : null}
                        <SplitBoxes
                          marks={team.marks}
                          named
                          blankNames={report.blankRelayLines}
                        />
                      </View>
                    ))}
                  </View>
                ),
              )}
        </View>
        <ReportFooter report={report} />
      </Page>
    </Document>
  );
}
