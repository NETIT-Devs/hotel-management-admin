/**
 * Luxury Hotel Child Age, Bedding & Occupancy Policy (Frontend & Admin Shared Utility)
 * Pure room & bedding policy (no meal plans):
 *  - Infants (Under 1 – 2 yrs): Free ($0), excluded from bed-capacity warning, Complimentary Baby Cot
 *  - Young Children (3 – 5 yrs): Free ($0), sharing existing bedding with parents
 *  - Older Children (6 – 11 yrs): Extra Rollaway Bed Supplement ($25/night Non-Resident, $15/night Resident)
 */

export const CHILD_AGE_OPTIONS = [
  'Under 1',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
];

export const EXTRA_BED_RATE_NON_RESIDENT = 25;
export const EXTRA_BED_RATE_RESIDENT = 15;

/**
 * Parses a raw child age label ("Under 1", "0", "4", 9) into an integer 0..11.
 *
 * @param {string|number} rawAge
 * @returns {number}
 */
export function parseChildAge(rawAge) {
  if (String(rawAge || '').toLowerCase() === 'under 1') return 0;
  const num = Number(String(rawAge ?? '').replace(/[^0-9]/g, ''));
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(11, Math.floor(num)));
}

/**
 * Formats an age value for clean display ("Under 1" or "N yrs").
 *
 * @param {string|number} rawAge
 * @returns {string}
 */
export function formatChildAgeLabel(rawAge) {
  const age = parseChildAge(rawAge);
  return age === 0 ? 'Under 1' : `${age} ${age === 1 ? 'yr' : 'yrs'}`;
}

/**
 * Normalizes any stored or router-passed child ages (JSON string, array, or BookingBar roomsDetails)
 * into a flat array of clean age strings aligned with the selected child count.
 *
 * @param {any} rawAges
 * @param {number} [expectedCount]
 * @returns {string[]}
 */
export function normalizeChildAges(rawAges, expectedCount) {
  let list = [];
  if (Array.isArray(rawAges)) {
    list = rawAges;
  } else if (typeof rawAges === 'string' && rawAges.trim()) {
    try {
      const parsed = JSON.parse(rawAges);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      list = rawAges.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  const cleaned = list
    .filter((v) => v !== '' && v !== null && v !== undefined)
    .map((v) => (parseChildAge(v) === 0 ? 'Under 1' : String(parseChildAge(v))));

  if (typeof expectedCount === 'number' && expectedCount >= 0) {
    if (cleaned.length > expectedCount) return cleaned.slice(0, expectedCount);
    while (cleaned.length < expectedCount) {
      cleaned.push('5'); // Default sensible child age when user increments children directly
    }
  }
  return cleaned;
}

/**
 * Extracts a flat childAges array from BookingBar's `roomsDetails` payload.
 *
 * @param {Array<{ childAges?: string[] }>} roomsDetails
 * @returns {string[]}
 */
export function extractChildAgesFromRoomsDetails(roomsDetails) {
  if (!Array.isArray(roomsDetails)) return [];
  return roomsDetails.flatMap((room) =>
    Array.isArray(room?.childAges) ? room.childAges : []
  );
}

/**
 * Computes age brackets, extra rollaway bed supplement, and housekeeping notes.
 * Supports room-specific extra bed pricing from the database (including $0 for Family Suites).
 *
 * @param {object} params
 * @param {Array<string|number>} [params.childAges=[]]
 * @param {number} [params.nights=1]
 * @param {string} [params.residency='Non-Resident']
 * @param {number|string|null} [params.childExtraBedPrice=null] - Per-room Non-Resident extra bed rate (0 allowed)
 * @param {number|string|null} [params.residentChildExtraBedPrice=null] - Per-room Resident extra bed rate (0 allowed)
 * @returns {{
 *   normalizedAges: string[],
 *   infantCount: number,
 *   youngChildCount: number,
 *   olderChildCount: number,
 *   ratePerExtraBedNight: number,
 *   childSupplementTotal: number,
 *   housekeepingSummary: string,
 *   agesDisplay: string
 * }}
 */
export function evaluateChildPolicy({
  childAges = [],
  nights = 1,
  residency = 'Non-Resident',
  childExtraBedPrice = null,
  residentChildExtraBedPrice = null,
}) {
  const normalizedAges = normalizeChildAges(childAges);
  const safeNights = Math.max(1, Number(nights) || 1);
  const isResident = residency === 'Resident';

  const hasValidNonResRate =
    childExtraBedPrice !== null &&
    childExtraBedPrice !== undefined &&
    childExtraBedPrice !== '' &&
    Number.isFinite(Number(childExtraBedPrice)) &&
    Number(childExtraBedPrice) >= 0;

  const hasValidResRate =
    residentChildExtraBedPrice !== null &&
    residentChildExtraBedPrice !== undefined &&
    residentChildExtraBedPrice !== '' &&
    Number.isFinite(Number(residentChildExtraBedPrice)) &&
    Number(residentChildExtraBedPrice) >= 0;

  const nonResRate = hasValidNonResRate
    ? Number(childExtraBedPrice)
    : EXTRA_BED_RATE_NON_RESIDENT;
  const resRate = hasValidResRate
    ? Number(residentChildExtraBedPrice)
    : EXTRA_BED_RATE_RESIDENT;

  const ratePerExtraBedNight = isResident ? resRate : nonResRate;

  let infantCount = 0;
  let youngChildCount = 0;
  let olderChildCount = 0;

  normalizedAges.forEach((raw) => {
    const age = parseChildAge(raw);
    if (age <= 2) infantCount += 1;
    else if (age <= 5) youngChildCount += 1;
    else olderChildCount += 1;
  });

  const childSupplementTotal =
    Math.round(olderChildCount * ratePerExtraBedNight * safeNights * 100) / 100;

  const notes = [];
  if (infantCount > 0) {
    notes.push(`${infantCount} Baby Cot${infantCount > 1 ? 's' : ''} (Free)`);
  }
  if (youngChildCount > 0) {
    notes.push(`${youngChildCount} Sharing Bedding (Free)`);
  }
  if (olderChildCount > 0) {
    notes.push(
      ratePerExtraBedNight === 0
        ? `${olderChildCount} Extra Rollaway Bed${olderChildCount > 1 ? 's' : ''} (Complimentary)`
        : `${olderChildCount} Extra Rollaway Bed${olderChildCount > 1 ? 's' : ''}`
    );
  }

  return {
    normalizedAges,
    infantCount,
    youngChildCount,
    olderChildCount,
    ratePerExtraBedNight,
    childSupplementTotal,
    housekeepingSummary: notes.join(' · '),
    agesDisplay: normalizedAges.map(formatChildAgeLabel).join(', '),
  };
}
