// AppError.ts
export class AppError extends Error {
    // public (접근 제한자): 이 클래스 내부뿐만 아니라, 클래스 외부(예: 전역 에러 미들웨어)에서도
    // 이 속성을 자유롭게 읽을 수 있다는 뜻입니다.

    // readonly (읽기 전용 제어자): 이 값이 생성자(constructor)를 통해 한 번 초기화되고 나면,
    // 이후에는 절대 값을 수정할 수 없도록 딱딱하게 잠그는 역할을 합니다.
    // 에러 객체는 '발생한 시점의 팩트'를 담고 있어야 합니다. 흘러가는 도중에 값이 오염되면 디버깅이 불가능해지기 때문에
    // 불변성(Immutability)을 보장하기 위해 무조건 readonly를 붙입니다.
    public readonly status: number;
    public readonly code: string;
    public readonly details: any;

    constructor(
        status: number,
        code: string,
        message: string,
        details: any = null
    ) {
        super(message); // 원조 Error객체는 message만 인수로 받음
        // super를 호출하지 않고 this.message만 할 순 없음
        // 왜냐하면 super를 통해 부모 클래스의 생성자함수를 호출하여
        // 부모의 속성과 메서드를 자식(AppError / this)에게 그대로 주입하여야
        // this.status 등이 가능함.
        // 일반 클래스(new class)의 경우는 this를 바로 바인딩할 수 있지만 
        // 상속 클래스(class extends 부모클래스)는 super()를 호출해야만 this를 바인딩할 수 있다.

        // 이때 super()만 호출하고 super(message)를 하지 않으면 기본 Error객체가 가진 무기들을 잃어버리게 된다.


        this.status = status;
        this.code = code;
        this.details = details;

        // 에러 이름 지정 (디버깅/로그용)
        this.name = this.constructor.name;

        // 지정하지 않으면 Error: ~~ 이렇게 나옴
        // 나중에 class BadRequestError extends AppError를 만들어서 에러를 던지면,
        // 로그에 Error가 아니라 BadRequestError라고 명확하게 찍히게 되므로 모니터링 가독성이 극대화됩니다.

        // V8 엔진에서 제공하는 스택 트레이스 최적화 (현재 생성자 지점 제외)
        // Error.captureStackTrace(targetObject, constructorOpt);

        // targetObject(this): 스택 트레이스 정보를 생성하여 저장할 대상 객체(현재 에러 인스턴스)입니다.
        // constructorOpt(this.constructor): "스택 트레이스를 수집할 때, 이 생성자 함수(지점)까지는 숨기고 제외해라"라고 지시하는 역할을 합니다.

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

// BadGateway, Unauthorized 등 상황에 맞게 미리 선언해둡니다.

// 400 Bad Request
export class BadRequestError extends AppError {
    //  = ~~ 이건 기본값 / 호출 시 message, code, details를 넘겨야함
    constructor(message = '잘못된 요청입니다.', code = 'BAD_REQUEST', details = null) {
        super(400, code, message, details);
    }
}

// 401 Unauthorized (너 로그인 했어?)
export class UnauthorizedError extends AppError {
    constructor(message = '인증이 필요합니다.', code = 'UNAUTHORIZED', details = null) {
        super(401, code, message, details);
    }
}

// 403 Forbidden (인증은 되었으나, 해당 리소스에 접근할 권한이 없음) (너 'company' 권한 가진 애 맞아?)
export class ForbiddenError extends AppError {
    constructor(message = '접근 권한이 없습니다.', code = 'FORBIDDEN', details = null) {
        super(403, code, message, details);
    }
}

// 404 Not Found
export class NotFoundError extends AppError {
    constructor(message = '요청한 리소스를 찾을 수 없습니다.', code = 'NOT_FOUND', details = null) {
        super(404, code, message, details);
    }
}

// 409 Conflict (주로 중복 데이터 가입 시 사용)
export class ConflictError extends AppError {
    constructor(message = '이미 존재하는 데이터입니다.', code = 'CONFLICT', details = null) {
        super(409, code, message, details);
    }
}


// +++++
// 상속 체인 상 가장 아래에 위치한 BadRequestError, ForbiddenError 등의 커스텀 에러 클래스들은 super()를 통해 status, code, message, details를 받아
// 부모 클래스인 AppError클래스로 해당 속성의 값을 올려보내면서 AppError를 생성한다. 이때 AppError 또한 super()를 통해 message를 자신의 부모 클래스인
// Error 클래스에 전달하면서 Error클래스를 생성한다.

// 이때 중요한것은 클래스마다 하나의 인스턴스를 생성하는 것이 아니라 상속 체인 상의 클래스에서 new 키워드를 통해 생성을 하게 되면 상속으로 묶여 있는
// 체인의 클래스들이 하나의 인스턴스를 생성하기 위해 동작한다. 즉, message 바인딩을 담당하는 Error 클래스, status, code, details 바인딩을 담당하는 AppError 클래스,
// 이 값들을 주입받아 상속체인 상위로 넘기는 BadRequestError ... 등이 하나의 인스턴스 객체를 만들기 위해 위아래로 움직이며 this바인딩 등을 수행한다는 것이다.

// 그럼 가장 최상단 클래스인 Error에 message를 전달하는 이유는 뭘까? -> 그것은 스택 트레이스(Stack Trace)텍스트를 만들 때 message를 합성해야하기 때문이다. 