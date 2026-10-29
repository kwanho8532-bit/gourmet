import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError";
import mongoose from "mongoose";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // 1. 기본값 세팅 (타입 안전성 확보)
    let status = typeof err.status === 'number' ? err.status : 500;
    let code = typeof err.code === 'string' ? err.code : 'INTERNAL_SERVER_ERROR';
    let message = err.message || '서버 내부 오류가 발생했습니다.';
    let details: any = err.details || null;

    // 2. 에러 유형별 분류 작업

    // A. 💡 [우선순위 1] 우리가 직접 던진 커스텀 에러 (AppError)
    if (err instanceof AppError) {
        // AppError는 생성자(ex - new NotFoundError(~~))에서 이미 status, code, message, details가 
        // 완벽하게 세팅되어 들어오므로, 기본값 세팅(1번 단계)에서 이미 걸러져서 통과합니다.
        // 여기서는 아무것도 안 하고 통과시켜도 안전합니다.
    }
    // B. Mongoose ValidationError (스키마 검증 실패)
    else if (err instanceof mongoose.Error.ValidationError) {
        status = 400;
        code = 'VALIDATION_ERROR';
        message = '입력하신 데이터 형식이 올바르지 않습니다.';
        details = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message
        }));
    }
    // C. MongoDB Unique Key 중복 에러 (E11000)
    else if (err.code === 11000) {
        status = 409; // Conflict
        code = 'DUPLICATE_RESOURCE';
        message = '이미 존재하거나 중복된 데이터입니다.';
        details = err.keyValue ? err.keyValue : null;
    }
    // D. MongoDB Bulk Write 에러
    else if (err.name === 'MongoBulkWriteError') {
        status = 400;
        code = 'DATABASE_BULK_WRITE_ERROR';
        message = '데이터 일괄 저장 작업에 실패했습니다.';
        if (err.writeErrors) {
            details = err.writeErrors.map((e: any) => ({
                index: e.index,
                errmsg: e.errmsg
            }));
        }
    }
    // E. 💥 시스템의 예상치 못한 내부 에러 (500)
    else {
        // 운영 환경(Production) 보안을 위해 에러 메시지 은폐
        if (!isDevelopment) {
            status = 500;
            code = 'INTERNAL_SERVER_ERROR';
            message = '시스템 오류가 발생했습니다. 관리자에게 문의하세요.';
            details = null;
        }
    }

    // 3. 서버 콘솔 에러 로깅
    console.error(`🔥 [${req.method}] ${req.url} - Status: ${status}, Code: ${code}`);
    console.log(message)

    if (err.stack && (isDevelopment || status === 500)) {
        console.error(err.stack);
    }

    // 4. 통일된 JSON 포맷 응답
    res.status(status).json({
        success: false,
        code,
        message,
        ...(details && { details }),
        ...(isDevelopment && { stack: err.stack })
    });
}