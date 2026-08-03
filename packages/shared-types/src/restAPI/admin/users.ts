import { User } from "../../models/user";

export type AdminUsersListResponse = {
	id: User["id"];
	nickname: User["nickname"];
	colors: User["colors"];
}[];
