// TODO:Není domyšlené

export type Question = {
    id: number;
    name: string;
    description: string;
    type: QuestionType;
    price_draw: number;
    price_keep: number;
};

export type QuestionType = "radar" | "thermometer" | "photo" | "matching" | "error";
