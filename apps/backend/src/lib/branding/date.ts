import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

export const localize = {
	/**
	 * Formats a date into a dot-separated string without leading zeros.
	 *
	 * @param date - The Date object to format.
	 * @returns The formatted date string.
	 *
	 * @example
	 * // Returns "3. 4. 2035"
	 * localize.date(new Date(2035, 3, 3));
	 */
	date: (date: Date): string => format(date, "d. M. yyyy", { locale: enUS, weekStartsOn: 1 }),

	/**
	 * Returns the relative distance between the given date and now in words.
	 *
	 * @param date - The Date object to compare.
	 * @returns The relative distance string with a suffix.
	 *
	 * @example
	 * // Returns "about 2 hours ago" or "in 5 minutes"
	 * localize.dateRelative(new Date());
	 */
	dateRelative: (date: Date): string => formatDistanceToNow(date, { addSuffix: true, locale: enUS }),

	/**
	 * Formats a date into a 24-hour time string.
	 *
	 * @param date - The Date object to format.
	 * @returns The 24-hour time string.
	 *
	 * @example
	 * // Returns "13:30"
	 * localize.time(new Date(2035, 3, 3, 13, 30));
	 */
	time: (date: Date): string => format(date, "HH:mm", { locale: enUS }),

	/**
	 * Returns the relative distance for time values.
	 * Functions identically to dateRelative but semantic for time-only fields.
	 *
	 * @param date - The Date object to compare.
	 * @returns The relative distance string with a suffix.
	 *
	 * @example
	 * // Returns "less than a minute ago"
	 * localize.timeRelative(new Date());
	 */
	timeRelative: (date: Date): string => formatDistanceToNow(date, { addSuffix: true, locale: enUS }),

	/**
	 * Combines the custom date format and 24-hour time into a single string.
	 *
	 * @param date - The Date object to format.
	 * @returns The combined date and time string.
	 *
	 * @example
	 * // Returns "3. 4. 2035 13:30"
	 * localize.dateTime(new Date(2035, 3, 3, 13, 30));
	 */
	dateTime: (date: Date): string => format(date, "d. M. yyyy HH:mm", { locale: enUS, weekStartsOn: 1 }),

	/**
	 * Formats a date into a high-precision, standard database timestamp format.
	 *
	 * @param date - The Date object to format.
	 * @returns The precise timestamp string.
	 *
	 * @example
	 * // Returns "2035-04-03 13:30:45.123"
	 * localize.timestamp(new Date(2035, 3, 3, 13, 30, 45, 123));
	 */
	timestamp: (date: Date): string => format(date, "yyyy-MM-dd HH:mm:ss.SSS", { locale: enUS }),
};
