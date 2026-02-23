import { format, formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";

export const localize = {
	date: (date: Date): string => format(date, "PPP", { locale: cs }),
	dateRelative: (date: Date): string => formatDistanceToNow(date, { addSuffix: true, locale: cs }),
	time: (date: Date): string => format(date, "p", { locale: cs }),
	timeRelative: (date: Date): string => formatDistanceToNow(date, { addSuffix: true, locale: cs }),
	dateTime: (date: Date): string => format(date, "PP p", { locale: cs }),
	timestamp: (date: Date): string => format(date, "yyyy-MM-dd HH:mm:ss.SSS", { locale: cs }),
};
