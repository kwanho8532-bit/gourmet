import type { TokenPayload } from '@repo/domains'
import jwt from 'jsonwebtoken';
import crypto from 'crypto'

const getJwtSecrets = () => {
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    // 서버 구동 즉시 환경변수 검증
    if (!accessTokenSecret || !refreshTokenSecret) {
        console.error('❌ FATAL ERROR: JWT 환경변수가 설정되지 않았습니다.');
        // 프로세스를 즉시 종료시켜 치명적 보안 사고를 원천 차단
        process.exit(1);
    }

    return { accessTokenSecret, refreshTokenSecret }
}


// 토큰 원본을 SHA-256으로 단방향 해싱 (DB 저장 및 대조용)
export const hashToken = (token: string) => {
    return crypto.createHash('sha256').update(token).digest('hex')
}

// Access Token 발급 (15분)
export const generateAccessToken = (payload: TokenPayload) => {
    const { accessTokenSecret } = getJwtSecrets()

    return jwt.sign(payload, accessTokenSecret, { expiresIn: '15m' })
}

// Refresh Token 발급 (7일)
export const generateRefreshToken = (payload: TokenPayload) => {
    const { refreshTokenSecret } = getJwtSecrets()

    return jwt.sign(payload, refreshTokenSecret, { expiresIn: '7d' })
}

// Access Token 검증
export const verifyAccessToken = (token: string) => {
    const { accessTokenSecret } = getJwtSecrets()

    return jwt.verify(token, accessTokenSecret) as TokenPayload;
}

// Refresh Token 검증
export const verifyRefreshToken = (token: string) => {
    const { refreshTokenSecret } = getJwtSecrets()

    return jwt.verify(token, refreshTokenSecret) as TokenPayload;
}