import { Types } from "mongoose";
import { UnauthorizedError } from "../errors/AppError";
import { refreshTokenModel } from "../models/refreshToken.model";
import { generateAccessToken, generateRefreshToken, hashToken, verifyRefreshToken } from "../utils/jwt";

export class AuthService {
    static async refreshTokens(refreshToken: string) {
        // service는 다른 곳에서도 사용할 수 있도록 router, controller, service를 분리하는 것이다. 
        // 따라서 service에서의 매개변수는 service안에서 자체적으로 검증해야한다.
        if (!refreshToken) {
            throw new UnauthorizedError('rt가 존재하지 않습니다.')
        }

        const payload = verifyRefreshToken(refreshToken)
        const userId = payload.userId;

        const savedToken = await refreshTokenModel.findOne({ tokenHash: hashToken(refreshToken) })

        if (!savedToken) {
            throw new UnauthorizedError('유효하지 않은 토큰입니다.')
        }

        // 만료기한과 지금을 비교하여 지금이 더 미래인 경우(만료기한이 지난경우) 에러를 냄 
        // 이건 mongoDB가 1분정도의 텀으로 index를 돌면서 ttl이 걸려있는 문서를 제거하는데 이때 1분의 텀 안에 요청이 들어오는경우를 방지하기 위함
        if (savedToken.expiresAt < new Date()) {
            throw new UnauthorizedError('만료되었거나 유효하지 않은 토큰입니다.')
        }

        if (savedToken.isRevoked) {
            await refreshTokenModel.updateMany(
                { user: savedToken.user },
                { $set: { isRevoked: true } }
            )

            throw new UnauthorizedError('만료되었거나 유효하지 않은 토큰입니다. 다시 로그인해주세요.')
        }

        savedToken.isRevoked = true;
        await savedToken.save();

        // jwt.verify()하고 나면 iat, exp 등의 jwt관리용 속성이 들어있음 따라서 순수하게 내가 넣은 값만 추출해서 넣음
        const newAccessToken = generateAccessToken({ userId })
        const newRefreshToken = generateRefreshToken({ userId })

        // 새로 발급한 rt를 db에 저장
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 14)
        const hashedToken = hashToken(newRefreshToken)

        await refreshTokenModel.create({
            user: new Types.ObjectId(userId),
            tokenHash: hashedToken,
            expiresAt,
            isRevoked: false,
            // 추후 userAgent와 ipAddress값을 가져오기 위한 로직을 공부(ip값은 서버에 직접 접근하면 req.ip로 얻으면 되지만 배포 환경에서는 'x-forwarded-for'헤더를 살펴봐야함)
        })

        return { newAccessToken, newRefreshToken };
    }
}