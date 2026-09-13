import type { CSSProperties, ReactNode } from "react";
import type { MeetEntriesReport, MeetEntriesReportEvent } from "../../types";

const ink = "#111111";
const muted = "#667085";
const rule = "#D0D5DD";
const paper = "#FFFFFF";
const pageBg = "#F4F5F7";

const pageStyle: CSSProperties = {
  background: paper,
  color: ink,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 13,
  lineHeight: 1.45,
  width: "100%",
  maxWidth: 816,
  margin: "0 auto",
  padding: "40px 48px 56px",
  boxSizing: "border-box",
};

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
        marginBottom: 8,
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

function EventSection({ event }: { event: MeetEntriesReportEvent }) {
  if (event.kind === "individual") {
    return (
      <section style={{ marginBottom: 22 }}>
        <EventHeading
          eventNumber={event.eventNumber}
          genderLabel={event.genderLabel}
          title={event.title}
        />
        {event.athletes.map((athlete) => (
          <div
            key={`${event.eventId}-${athlete.entryId}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "3px 0",
              gap: 16,
            }}
          >
            <span>{athlete.name}</span>
            <span
              style={{
                fontVariantNumeric: "tabular-nums",
                minWidth: 72,
                textAlign: "right",
              }}
            >
              {athlete.seedLabel}
            </span>
          </div>
        ))}
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: muted,
            textAlign: "right",
          }}
        >
          {event.athletes.length} athlete
          {event.athletes.length === 1 ? "" : "s"}
        </div>
      </section>
    );
  }

  return (
    <section style={{ marginBottom: 22 }}>
      {event.teams.map((team) => (
        <div
          key={`${event.eventId}-${team.letter}`}
          style={{ marginBottom: event.teams.length > 1 ? 16 : 0 }}
        >
          <EventHeading
            eventNumber={event.eventNumber}
            genderLabel={event.genderLabel}
            title={`${event.title} ${team.letter}`}
            trailing={team.seedLabel}
          />
          {team.legs.map((leg) => (
            <div
              key={`${event.eventId}-${team.letter}-${leg.legOrder}`}
              style={{ display: "flex", gap: 10, padding: "3px 0" }}
            >
              <span style={{ color: muted, width: 16 }}>{leg.legOrder}</span>
              <span>{leg.name}</span>
            </div>
          ))}
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              color: muted,
              textAlign: "right",
            }}
          >
            {team.legs.length} athlete{team.legs.length === 1 ? "" : "s"}
          </div>
        </div>
      ))}
    </section>
  );
}

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

export function MeetEntriesHtmlReport({
  report,
  frame = true,
}: {
  report: MeetEntriesReport;
  /** Wrap in a soft page frame for on-screen preview. */
  frame?: boolean;
}): ReactNode {
  const teamLine = report.teamCode
    ? `${report.teamName} [${report.teamCode}]`
    : report.teamName;

  const document = (
    <article style={pageStyle}>
      <header style={{ marginBottom: 24 }}>
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
                    key={`${line.eventId}-${line.kind}-${line.relayLetter ?? ""}-${line.isAlternate ? "alt" : "p"}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "3px 0",
                      gap: 16,
                    }}
                  >
                    <span>
                      {line.eventNumber != null ? `#${line.eventNumber} ` : ""}
                      {line.eventLabel}
                      {line.kind === "relay"
                        ? ` · ${line.relayLetter ?? "A"}${line.isAlternate ? " alt" : ""}`
                        : ""}
                      {line.exhibition ? " (ex)" : ""}
                    </span>
                    <span
                      style={{
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {line.seedLabel}
                    </span>
                  </div>
                ))}
              </section>
            ))
          : report.events.map((event) => (
              <EventSection key={event.eventId} event={event} />
            ))}
      </div>

      <footer
        style={{
          marginTop: 12,
          borderTop: `1px solid ${rule}`,
          paddingTop: 18,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: muted,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Summary
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 28 }}>
          <SummaryCell
            label="Female IE's"
            value={report.summary.femaleIndividualEntries}
          />
          <SummaryCell
            label="Male IE's"
            value={report.summary.maleIndividualEntries}
          />
          <SummaryCell
            label="Total IE's"
            value={report.summary.totalIndividualEntries}
          />
          <SummaryCell
            label="Total RE's"
            value={report.summary.totalRelayEntries}
          />
          <SummaryCell
            label="Total athletes"
            value={report.summary.totalAthletes}
          />
        </div>
      </footer>
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
