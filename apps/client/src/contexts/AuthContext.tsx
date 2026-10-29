import React, { createContext, useContext } from 'react';
// 스토어에서 인증이 완료되었을 때의 타입(Non-null)만 추출
import { AuthenticatedAuthStatus } from '@/stores/useAuthStore';


// Context 생성 (초기값은 null)
// null을 넘기는 이유는 useContext(AuthContext)를 provider외부에서 사용할 경우 null일 수 있는 가능성을 열어둬야함
// 즉, useContext(AuthContext)를 호출하면 호출한 지점에서 상위로 올라가면서 가장 가까운 AuthContext.Provider를 찾는다. 
// 이때 만약 외부에서 이를 호출하게 되면 상위 트리 끝까지 올라가도 찾을 수 없다. -> 이때는 createContext()에 넘겼던 초기값을 반환하는데 
// 이에 null값을 넘겨주게 된다. 즉, 외부에서 호출했을 때 넘겨줄 비상용 기본값으로 null타입을 허용하는것이다.
// +) null인 경우 즉, 외부에서 호출한 경우 null이 들어오는 점을 활용해 개발자용 에러를 던질 수 있게 되는것이다.
export const AuthContext = createContext<AuthenticatedAuthStatus | null>(null);

interface AuthProviderProps {
    children: React.ReactNode;
    value: AuthenticatedAuthStatus;
}

// 인증된 데이터만 하위에 전달해 주는 Provider
export const AuthProvider = ({ children, value }: AuthProviderProps) => {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 안전하고 타입이 보장된 커스텀 훅
export const useAuthenticatedUser = (): AuthenticatedAuthStatus => {
    const context = useContext(AuthContext);

    // 이 throw는 Zustand 언마운트 틱 때문이 아니라,
    // 진짜로 가드 밖(예: (auth) 라우트 내부)에서 개발자가 실수로 불렀을 때만 작동합니다.
    if (!context) {
        throw new Error('useAuthenticatedUser는 GlobalAuthGuard 내부에서만 사용해야 합니다.');
    }

    return context; // TypeScript가 자동으로 AuthenticatedAuthStatus 타입으로 내로잉!
};