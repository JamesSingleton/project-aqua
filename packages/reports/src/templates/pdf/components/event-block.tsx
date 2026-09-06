import { Text, View } from "@react-pdf/renderer";
import type {
  MeetEntriesReportEvent,
  MeetEntriesReportSwimmer,
} from "../../../types";
import { reportColors as colors } from "./chrome";

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

function AthleteCount({ count }: { count: number }) {
  return (
    <Text
      style={{
        fontSize: 8,
        color: colors.muted,
        marginTop: 4,
        textAlign: "right",
      }}
    >
      {count} athlete{count === 1 ? "" : "s"}
    </Text>
  );
}

export function EventBlock({ event }: { event: MeetEntriesReportEvent }) {
  if (event.kind === "individual") {
    return (
      <View wrap={false} style={{ marginBottom: 14 }}>
        <EventHeading
          eventNumber={event.eventNumber}
          genderLabel={event.genderLabel}
          title={event.title}
        />
        {event.athletes.map((athlete) => (
          <View
            key={`${event.eventId}-${athlete.membershipId}`}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: 9, color: colors.ink, flex: 1 }}>
              {athlete.name}
            </Text>
            <Text
              style={{
                fontSize: 9,
                color: colors.ink,
                fontFamily: "Helvetica",
                textAlign: "right",
                minWidth: 64,
              }}
            >
              {athlete.seedLabel}
            </Text>
          </View>
        ))}
        <AthleteCount count={event.athletes.length} />
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 14 }}>
      {event.teams.map((team) => (
        <View
          key={`${event.eventId}-${team.letter}`}
          wrap={false}
          style={{ marginBottom: event.teams.length > 1 ? 10 : 0 }}
        >
          <EventHeading
            eventNumber={event.eventNumber}
            genderLabel={event.genderLabel}
            title={`${event.title} ${team.letter}`}
            trailing={team.seedLabel}
          />
          {team.legs.map((leg) => (
            <View
              key={`${event.eventId}-${team.letter}-${leg.legOrder}`}
              style={{
                flexDirection: "row",
                gap: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 9, color: colors.muted, width: 12 }}>
                {leg.legOrder}
              </Text>
              <Text style={{ fontSize: 9, color: colors.ink }}>{leg.name}</Text>
            </View>
          ))}
          <AthleteCount count={team.legs.length} />
        </View>
      ))}
    </View>
  );
}

export function SwimmerBlock({
  swimmer,
}: {
  swimmer: MeetEntriesReportSwimmer;
}) {
  return (
    <View wrap={false} style={{ marginBottom: 12 }}>
      <View
        style={{
          borderBottomWidth: 0.5,
          borderBottomColor: colors.rule,
          paddingBottom: 4,
          marginBottom: 6,
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: 600, color: colors.ink }}>
          {swimmer.name}
        </Text>
      </View>
      {swimmer.lines.map((line) => (
        <View
          key={`${line.eventId}-${line.kind}-${line.relayLetter ?? ""}-${line.isAlternate ? "a" : "p"}`}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 2,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 9, color: colors.ink, flex: 1 }}>
            {line.eventNumber != null ? `#${line.eventNumber} ` : ""}
            {line.eventLabel}
            {line.kind === "relay"
              ? ` · ${line.relayLetter ?? "A"}${line.isAlternate ? " alt" : ""}`
              : ""}
            {line.exhibition ? " (ex)" : ""}
          </Text>
          <Text style={{ fontSize: 9, color: colors.ink }}>
            {line.seedLabel}
          </Text>
        </View>
      ))}
    </View>
  );
}
