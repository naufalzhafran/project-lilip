/**
 * Computes whether a recruitment report was sent on time relative to the interview.
 *
 * Returns:
 *   true  → on time ("Yes")
 *   false → not on time ("No")
 *   null  → either datetime is missing/invalid; result is indeterminate
 *
 * Rules (all in local browser timezone via dayjs):
 *   Same day:
 *     Pagi  → Pagi  (interview 08:30–12:00, report 08:30–12:00)
 *     Siang → Siang (interview 12:01–17:30, report 12:01–17:30)
 *     Pagi  → Siang (interview 08:30–12:00, report 12:01–17:30)
 *   Next day (+1):
 *     Siang → Pagi  (interview 12:01–17:30, report 08:30–12:00 next day)
 *   Everything else → false
 */

import dayjs from "dayjs";

function toMin(h: number, m: number) {
  return h * 60 + m;
}

function isPagi(h: number, m: number) {
  const t = toMin(h, m);
  return t >= toMin(8, 30) && t <= toMin(12, 0);
}

function isSiang(h: number, m: number) {
  const t = toMin(h, m);
  return t >= toMin(12, 1) && t <= toMin(17, 30);
}

export function computeIsOntime(
  interviewIso: string | null | undefined,
  reportIso: string | null | undefined,
): boolean | null {
  if (!interviewIso || !reportIso) return null;

  const iDt = dayjs(interviewIso);
  const rDt = dayjs(reportIso);

  if (!iDt.isValid() || !rDt.isValid()) return null;

  const iH = iDt.hour();
  const iM = iDt.minute();
  const rH = rDt.hour();
  const rM = rDt.minute();

  const diffDays = rDt.startOf("day").diff(iDt.startOf("day"), "day");

  if (diffDays === 0) {
    return (
      (isPagi(iH, iM) && isPagi(rH, rM)) ||
      (isSiang(iH, iM) && isSiang(rH, rM)) ||
      (isPagi(iH, iM) && isSiang(rH, rM))
    );
  }

  if (diffDays === 1) {
    return isSiang(iH, iM) && isPagi(rH, rM);
  }

  return false;
}
