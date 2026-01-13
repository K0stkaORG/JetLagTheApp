import { Dispatch, SetStateAction } from "react";

export type Only<T, U> = {
    [P in keyof T]: T[P];
} & {
    [P in keyof U]?: never;
};

export type Either<T, U> = Only<T, U> | Only<U, T>;

export type SetState<T> = Dispatch<SetStateAction<T>>;

export type Without<T, K> = Pick<T, Exclude<keyof T, K>>;
