import type { CSSProperties, ReactNode } from "react";
import type {
  SplitSheetEvent,
  SplitSheetMark,
  SplitSheetReport,
} from "../../types";

const ink = "#111111";
const muted = "#667085";
const rule = "#D0D5DD";
const paper = "#FFFFFF";
const pageBg = "#F4F5F7";

function pageStyle(landscape: boolean): CSSProperties {
  return {
    background: paper,
    color: ink,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 13,
    lineHeight: 1.35,
    width: "100%",
    maxWidth: landscape ? 1056 : 816,
    margin: "0 auto",
    padding: landscape ? "32px 36px 48px" : "40px 48px 56px",
    boxSizing: "border-box",
  };
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
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        borderBottom: `1px solid ${rule}`,
        paddingBottom: 6,
        marginBottom: 10,
        gap: 12,
      }}
    >
      <strong style={{ fontSize: 14, fontWeight: 600 }}>
        {num} {genderLabel} {title}
      </strong>
      {trailing ? (
        <span style={{ fontSize: 13, fontWeight: 500 }}>{trailing}</span>
      ) : null}
    </div>
  );
}

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
  /** Relay legs: share the row and set names at reading size. */
  named?: boolean;
  /** Write-in underline instead of the planned name. */
  blankNames?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: named ? "nowrap" : "wrap",
        gap: named ? 8 : 8,
        flex: 1,
        minWidth: 0,
        width: named ? "100%" : undefined,
        alignItems: named ? "stretch" : undefined,
      }}
    >
      {marks.map((mark, index) => (
        <div
          key={`${mark.label}-${index}`}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: named ? "1 1 0" : mark.isFinal ? "1 1 96px" : "1 1 72px",
            minWidth: named ? 0 : mark.isFinal ? 92 : 68,
            maxWidth: named ? undefined : mark.isFinal ? 140 : 112,
            gap: named ? 4 : 4,
          }}
        >
          <div
            style={{
              fontSize: named ? 11 : 10,
              color: muted,
              display: "flex",
              justifyContent: "space-between",
              gap: 4,
            }}
          >
            <span
              style={{
                fontWeight: mark.isFinal ? 600 : 400,
                color: mark.isFinal ? ink : muted,
              }}
            >
              {mark.label}
            </span>
          </div>
          {named && blankNames ? (
            <div
              style={{
                height: 18,
                borderBottom: mark.isFinal ? "none" : `1px solid ${ink}`,
              }}
            />
          ) : named ? (
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                lineHeight: "18px",
                height: 18,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {mark.athleteName ?? "\u00a0"}
            </div>
          ) : !named && mark.athleteName ? (
            <div style={{ fontSize: 10, lineHeight: 1.25 }}>
              {mark.athleteName}
            </div>
          ) : null}
          <div
            style={{
              height: named ? 40 : 52,
              border: `1.5px solid ${mark.isFinal ? ink : rule}`,
              borderRadius: 3,
              background: paper,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function EventSection({
  event,
  blankRelayLines,
}: {
  event: SplitSheetEvent;
  blankRelayLines: boolean;
}) {
  if (event.kind === "individual") {
    return (
      <section style={{ marginBottom: 22 }}>
        <EventHeading
          eventNumber={event.eventNumber}
          genderLabel={event.genderLabel}
          title={event.title}
        />
        {event.rows.map((row) => (
          <div
            key={`${event.eventId}-${row.membershipId}`}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              padding: "8px 0",
              borderBottom: `1px solid ${rule}`,
            }}
          >
            <div style={{ width: 168, flexShrink: 0 }}>
              <div style={{ fontWeight: 500 }}>{row.name}</div>
              <div
                style={{
                  fontSize: 12,
                  color: muted,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {row.seedLabel}
              </div>
            </div>
            <SplitBoxes marks={row.marks} />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section style={{ marginBottom: 22 }}>
      {event.teams.map((team) => (
        <div
          key={`${event.eventId}-${team.letter}`}
          style={{ marginBottom: event.teams.length > 1 ? 18 : 0 }}
        >
          <EventHeading
            eventNumber={event.eventNumber}
            genderLabel={event.genderLabel}
            title={`${event.title} ${team.letter}`}
            trailing={team.seedLabel}
          />
          {blankRelayLines ? (
            <div
              style={{
                fontSize: 12,
                color: muted,
                marginBottom: 8,
                marginTop: -4,
              }}
            >
              {relayLineupLabel(team.marks)}
            </div>
          ) : null}
          <SplitBoxes marks={team.marks} named blankNames={blankRelayLines} />
        </div>
      ))}
    </section>
  );
}

export function SplitSheetHtmlReport({
  report,
  frame = true,
}: {
  report: SplitSheetReport;
  frame?: boolean;
}): ReactNode {
  const teamLine = report.teamCode
    ? `${report.teamName} [${report.teamCode}]`
    : report.teamName;
  const landscape = report.pageOrientation === "landscape";

  const document = (
    <article style={pageStyle(landscape)}>
      <header style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 14,
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: muted,
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Project Aqua
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              {report.reportTitle}
            </h1>
          </div>
          <div style={{ fontSize: 12, color: muted }}>
            {report.generatedAtLabel}
          </div>
        </div>
        <div
          style={{
            borderTop: `1px solid ${rule}`,
            paddingTop: 14,
            display: "grid",
            gap: 4,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {report.meetName} · {report.meetDateLabel} · {report.courseLabel}
          </div>
          {report.location ? (
            <div style={{ fontSize: 13, color: muted }}>
              Location: {report.location}
            </div>
          ) : null}
          {report.opponents ? (
            <div style={{ fontSize: 13, color: muted }}>
              Opponents: {report.opponents}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              marginTop: 4,
            }}
          >
            <div>
              <div style={{ fontWeight: 500 }}>{teamLine}</div>
              {report.coachName ? (
                <div style={{ fontSize: 13, color: muted }}>
                  Coach: {report.coachName}
                </div>
              ) : null}
              {report.teamAddress ? (
                <div style={{ fontSize: 12, color: muted }}>
                  {report.teamAddress}
                </div>
              ) : null}
            </div>
            {report.coachEmail ? (
              <div style={{ fontSize: 12, color: muted }}>
                {report.coachEmail}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div>
        {report.groupBy === "swimmer"
          ? report.swimmers.map((swimmer) => (
              <section key={swimmer.membershipId} style={{ marginBottom: 22 }}>
                <div
                  style={{
                    borderBottom: `1px solid ${rule}`,
                    paddingBottom: 6,
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {swimmer.name}
                </div>
                {swimmer.lines.map((line) => (
                  <div
                    key={`${line.eventId}-${line.kind}-${line.relayLetter ?? ""}-${line.isAlternate ? "alt" : "p"}-${line.marks[0]?.label ?? ""}`}
                    style={{
                      padding: "8px 0",
                      borderBottom: `1px solid ${rule}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 6,
                      }}
                    >
                      <span>
                        {line.eventNumber != null
                          ? `#${line.eventNumber} `
                          : ""}
                        {line.eventLabel}
                        {line.kind === "relay"
                          ? ` · ${line.relayLetter ?? "A"}${line.isAlternate ? " alt" : ""}`
                          : ""}
                        {line.exhibition ? " (ex)" : ""}
                      </span>
                      <span
                        style={{
                          fontVariantNumeric: "tabular-nums",
                          color: muted,
                        }}
                      >
                        {line.seedLabel}
                      </span>
                    </div>
                    <SplitBoxes marks={line.marks} />
                  </div>
                ))}
              </section>
            ))
          : report.events.map((event) => (
              <EventSection
                key={event.eventId}
                event={event}
                blankRelayLines={report.blankRelayLines}
              />
            ))}
      </div>
    </article>
  );

  if (!frame) return document;

  return (
    <div
      style={{
        background: pageBg,
        padding: "24px 16px",
        borderRadius: 12,
        border: `1px solid ${rule}`,
      }}
    >
      <div
        style={{
          border: `1px solid ${rule}`,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {document}
      </div>
    </div>
  );
}
