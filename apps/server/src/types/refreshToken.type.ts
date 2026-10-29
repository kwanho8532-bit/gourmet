import type { BaseRefreshToken } from "@repo/base-types";
import type { Types } from "mongoose";

export interface RefreshToken extends BaseRefreshToken<Types.ObjectId, Types.ObjectId> { };