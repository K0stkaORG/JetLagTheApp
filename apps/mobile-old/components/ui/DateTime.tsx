import { Either } from "~/types/utilityTypes";
import { T } from "~/components/ui/text";

type Props = Either<
    {
        date: Date;
    },
    {
        timestamp: number;
    }
> & {
    onlyDate?: boolean;
    onlyTime?: boolean;
};

const DateTime = ({ date, timestamp, onlyDate, onlyTime }: Props) => {
    const displayDate: Date = date ?? new Date(timestamp);
    return (
        <T>
            {onlyDate
                ? displayDate.toLocaleDateString("cs-CZ")
                : onlyTime
                  ? displayDate.toLocaleTimeString("cs-CZ")
                  : displayDate.toLocaleString("cs-CZ")}
        </T>
    );
};

export default DateTime;
