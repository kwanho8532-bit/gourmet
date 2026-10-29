// 내일 controller를 class로 묶어서 export하는 문법 공부하고,
// controller, service 만들어서 필요한 라우터(googlePlaceApi 관련 라우터 등)도 route, controller, service로 분리해서 정리하기
// 이렇게 서버 코드까지 정리가 되고 나면 my-code-snippet에 코드들 정리하기

import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/AppError";
import { AuthService } from "../services/authService";

// class는 instance를 찍어내는 틀이라고 이해하면 됨. 
// 이때 static은 class가 생성하는 instance에 속한 값(프로퍼티, 메서드)이 아니라 클래스 자체에 속한 값(프로퍼티, 메서드)으로 정의하는 키워드다.
// 즉, instance에 속한 값이라면 new 키워드로 instance를 생성해서 해당 instance.값 이렇게 사용해야하는데
// static으로 정의하면 new 키워드 없이 class.값 이렇게 사용할 수 있다. 
// 또한 instance에 속하면 instance가 생성될 때마다 내부의 값이 생성되지만 static으로 class에 속하면 메모리에 하나만 올라가서 공유된다.
// 주로 instance에 속하는 값은 개별 객체 고유의 상태/동작을 다룰때 사용하고,
// static으로 class에 속하는 값은 개별 데이터와는 상관없는 공통 규칙이나 기능을 다룰 때 사용한다. 
export class AuthController {

    static async refresh(req: Request, res: Response, next: NextFunction) {
        const { refreshToken } = req.body

        try {
            const { newAccessToken, newRefreshToken } = await AuthService.refreshTokens(refreshToken)

            return res.status(201).json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            })
        } catch (err) {
            next(err)
        }
    }


}