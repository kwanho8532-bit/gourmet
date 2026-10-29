export interface BaseRefreshToken<TId = string, TUser = string> {
    _id: TId;
    user: TUser;
    tokenHash: string;
    expiresAt: Date;
    isRevoked: boolean;
    userAgent?: string;
    ipAddress?: string;
    createdAt: Date;
}