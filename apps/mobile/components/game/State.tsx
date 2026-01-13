import { T } from "~/components/ui/text";

type Props = {
    state: "planned" | "hiding_phase" | "main_phase" | "paused" | "finished";
};

const getStateName = (state: string): string => {
    switch (state) {
        case "planned":
            return "Naplánovaná";
        case "hiding_phase":
            return "Schovávací fáze";
        case "main_phase":
            return "Hlavní fáze";
        case "paused":
            return "Pozastavená";
        case "finished":
            return "Dohraná";
        default:
            return "Neznámý stav";
    }
};

const State = ({ state }: Props) => {
    return <T>{getStateName(state)}</T>;
};

export default State;
