/** Basic HY-TEK .HY3 entry file parser */
export function parseHy3(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const meet = {
    name: "HY-TEK Import",
    course: "SCY",
    events: [],
    entries: [],
    results: [],
  };
  for (const line of lines) {
    if (line.startsWith("B1")) {
      const courseCode = line.charAt(2);
      if (courseCode === "1") meet.course = "SCY";
      else if (courseCode === "2") meet.course = "SCM";
      else if (courseCode === "3") meet.course = "LCM";
    }
    if (line.startsWith("E1")) {
      const eventNumber = Number.parseInt(line.substring(2, 6).trim(), 10);
      const gender = line.charAt(6) === "F" ? "f" : "m";
      const distance = Number.parseInt(line.substring(7, 11).trim(), 10) || 0;
      const strokeCode = line.substring(11, 14).trim().toLowerCase();
      const stroke =
        strokeCode === "fr"
          ? "free"
          : strokeCode === "bk"
            ? "back"
            : strokeCode === "br"
              ? "breast"
              : strokeCode === "fl"
                ? "fly"
                : "im";
      meet.events.push({
        eventNumber,
        distance,
        stroke,
        gender,
        eventKey: `${distance}_${stroke}_${meet.course.toLowerCase()}_${gender}`,
      });
    }
    if (line.startsWith("D0") || line.startsWith("D1")) {
      const entry = {
        eventNumber:
          Number.parseInt(line.substring(2, 6).trim(), 10) || undefined,
        swimmerName: line.substring(20, 60).trim(),
        seedTime: line.substring(80, 90).trim() || undefined,
      };
      meet.entries.push(entry);
    }
  }
  return meet;
}
