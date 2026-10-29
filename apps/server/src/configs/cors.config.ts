import { CorsOptions } from "cors";

// .env에서 쉼표(,)로 구분된 문자열을 받아 정확한 도메인 배열로 변환
// 서버 시작 시 최초 1회만 배열로 파싱
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [];

export const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        // 1. !origin (Origin 헤더가 없는 경우)
        // -> Expo/React Native 앱, Postman, 서버 간 통신(cURL)은 CORS 제약이 없으므로 "통과(!origin)"
        if (!origin) {
            return callback(null, true);
        }

        // 2. origin이 있는 경우 (웹 브라우저에서 들어온 요청)
        // -> 내가 허용한 웹사이트 주소(whitelist)인지 확인해서 통과
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // 3. 허용되지 않은 브라우저 요청 차단
        return callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    },
    credentials: true, // 쿠키 및 인증 헤더 전달 허용
}   