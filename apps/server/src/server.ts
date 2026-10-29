import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app';

// 포트 및 DB URL 환경변수 설정
const PORT = process.env.PORT || 4000;
const DB_URL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/starter-pack';

// 비동기 부트스트랩 함수
async function bootstrap() {
    try {
        // DB 연결 완료까지 대기 (연결 실패 시 아래 catch로 이동)
        await mongoose.connect(DB_URL);
        console.log('🍃 MongoDB 연결 성공!');

        // DB 연결 확인 후 포트 오픈 (대문 열기)
        const server = app.listen(PORT, () => {
            console.log(`🚀 서버가 ${PORT} 포트에서 정상 실행 중입니다.`);
        });

        // 안전한 프로세스 종료 (Graceful Shutdown) 함수
        const handleShutdown = async (signal: string) => {
            console.log(`\n${signal} 수신: 진행 중인 작업을 정리하고 안전하게 종료합니다...`);

            // 새로운 HTTP 요청 차단 및 기존 요청 완료 대기
            server.close(async () => {
                try {
                    // DB 연결 해제
                    await mongoose.connection.close();
                    console.log('🛑 MongoDB 연결 해제 완료.');
                    console.log('👋 서버가 안전하게 종료되었습니다.');
                    process.exit(0); // 0: "아무 문제 없이 깔끔하게 정리하고 종료함"을 OS에 알림
                } catch (dbError) {
                    console.error('❌ DB 연결 해제 중 에러 발생:', dbError);
                    process.exit(1); // 1: "에러가 발생해서 어쩔 수 없이 강제 종료함"을 OS에 알림
                }
            });
        };

        // OS/배포 플랫폼 종료 신호 감지(이벤트 리스너)
        process.on('SIGINT', () => handleShutdown('SIGINT'));   // SIGINT: 터미널에서 Ctrl + C 입력 시
        process.on('SIGTERM', () => handleShutdown('SIGTERM')); // SIGTERM: Docker/AWS/Render 재배포 시

    } catch (error) {
        console.error('💥 서버 스타트업 실패:', error);
        process.exit(1);
    }
}

// 서버 시동
bootstrap();

// 예기치 못한 전역 비동기 에러 잡기 (서버 다운 방지)
process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection (처리되지 않은 Promise 에러):', reason);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception (처리되지 않은 예외):', error);
    process.exit(1);
});