import z from "zod";

type Latitude = number;
type Longitude = number;

export const Coords = z.tuple([z.number(), z.number()]);
export type Cords = [Latitude, Longitude];

export const NULL_CORDS: Cords = [0, 0] as const;

export const isValidCords = (cords: Cords): boolean => cords[0] !== 0 || cords[1] !== 0;

export const Polygon = z.array(Coords);
export type Polygon = Cords[];
