import mongoose from "mongoose";
import type { RefreshToken } from "../types/refreshToken.type"

const Schema = mongoose.Schema

const refreshTokenSchema = new Schema<RefreshToken>({
    // 1. 토큰 원본 대신 SHA-256 해시값 저장 (조회 속도를 위해 unique 인덱스 적용)
    tokenHash: { type: String, required: true, unique: true },

    // 2. User 모델과의 연관 관계 설정
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // 3. 토큰 강제 무효화 플래그 (로그아웃, 보안 탈취 감지 시 true로 변경)
    isRevoked: { type: Boolean, default: false },

    // 4. 만료 시각 (TTL 인덱스의 기준점이 됨)
    expiresAt: { type: Date, required: true },

    // 5. 보안 감사 및 기기 식별용 정보
    userAgent: { type: String },
    ipAddress: { type: String },
}, { timestamps: true })


// --------------------------------------------------------------------------
// [핵심] MongoDB TTL Index 설정
// expiresAt 필드 시각이 지나면 MongoDB Background Process가 해당 문서를 자동 삭제함
// (RDBMS처럼 별도의 Cron 배치 삭제 작업이 필요 없음)
// --------------------------------------------------------------------------
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const refreshTokenModel = mongoose.model<RefreshToken>('RefreshToken', refreshTokenSchema)   