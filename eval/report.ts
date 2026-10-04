import type { StudyReport } from "./analysis";

export function formatStudyReport(report: StudyReport): string {
  const lines = [
    `# Ranking study report`,
    ``,
    `Protocol: ${report.protocolVersion}`,
    `Graduation: **${report.graduation}**`,
    ``,
    `| Metric | Value |`,
    `|---|---|`,
    `| Enrolled groups | ${report.enrolledGroups} |`,
    `| Analyzed pairs | ${report.analyzedGroups} |`,
    `| Wins | ${report.wins} |`,
    `| Losses | ${report.losses} |`,
    `| Ties | ${report.ties} |`,
    `| Missing | ${report.missing} |`,
    `| Excluded | ${report.excluded} |`,
    `| Median paired Δ | ${report.medianPairedDelta ?? "n/a"} |`,
    ``,
    `## Groups`,
    ``,
  ];
  for (const g of report.groups) {
    lines.push(
      `- ${g.groupId}: ${g.outcome}` +
        (g.pairedDelta == null ? "" : ` (Δ=${g.pairedDelta})`),
    );
  }
  lines.push(``, `## Limitations`, ``);
  for (const lim of report.limitations) lines.push(`- ${lim}`);
  lines.push(``);
  return lines.join("\n");
}
