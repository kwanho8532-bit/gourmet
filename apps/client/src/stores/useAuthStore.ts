import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'

// base-types
export type AuthProvider = 'local' | 'google' | 'apple' | 'kakao';

export interface BaseUser<TId = string> {
    _id: TId;

    // 1. 인증 및 계정 식별자
    email: string;
    passwordHash?: string; // 소셜 가입자는 비밀번호가 없을 수 있음 (Optional)
    provider: AuthProvider; // 로그인 수단
    socialId?: string;     // 소셜 로그인 시 고유 식별자

    // 2. 피드/프로필용 정보 (앱 내 노출)
    username: string;       // 서비스 내 표시되는 이름 (Nickname)
    handle: string;         // 고유 아이디 (예: @snap_traveler, 검색 및 멘션용)
    profileImg: {
        url: string;
        publicId: string;
    }; // 프로필 이미지 URL
    bio: string;           // 한 줄 소개

    // 3. 사용자 정보
    birthDate: string;       // 나이 추산 및 연령 제한 확인용 (age 대체)

    // 4. 앱 특화 설정 (선택사항)
    // SnapMap 특성상 '내 위치/기록 공개 범위' 등이 유저 설정에 들어가는 경우가 많음
    isPrivate?: boolean;    // 비공개 계정 여부

    // 5. 메타데이터
    createdAt: Date;
    updatedAt: Date;
}

// dtos
export interface ResponseUserSummaryDto extends Pick<BaseUser, 'email' | 'handle' | 'profileImg' | 'username' | 'bio'> {
    id: string;
}

// expo-secure-store를 Zustand 저장소 규격에 맞게 어댑터로 감싸기
const SecureStoreAdaptor: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await SecureStore.getItemAsync(name)) ?? null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await SecureStore.setItemAsync(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await SecureStore.deleteItemAsync(name);
    },
}

type AuthStatus =
    | { status: 'INITIALIZING'; authData: null } // 앱 켜지는 중 (Rehydrating/Check me)
    | { status: 'AUTHENTICATED'; authData: ResponseUserSummaryDto } // 로그인 확정 (null 절대 불가)
    | { status: 'UNAUTHENTICATED'; authData: null }; // 미인증 (로그인 페이지)

// 인증이 완료된 상태만 추출한 타입 (status: 'AUTHENTICATED', authData: ResponseUserSummaryDto)
export type AuthenticatedAuthStatus = Extract<AuthStatus, { status: 'AUTHENTICATED' }>;

interface AuthData {
    auth: AuthStatus;
    accessToken: string | null;
    refreshToken: string | null;
    isLoggedIn: boolean;
    _hasHydrated: boolean;
}

interface AuthAction {
    setAuth: (auth: AuthStatus) => void;
    login: (auth: AuthStatus, accessToken: string, refreshToken: string) => void;
    logout: () => void;
    setHasHydrated: (state: boolean) => void;
    setTokens: (at: string, rt: string) => void;
}

type AuthState = AuthData & AuthAction

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            auth: { status: 'INITIALIZING', authData: null },
            accessToken: null,
            refreshToken: null,
            isLoggedIn: false,
            _hasHydrated: false,
            setAuth: (auth) => set({ auth }),
            login: (auth, accessToken, refreshToken) => set({ auth, accessToken, refreshToken, isLoggedIn: true }),
            logout: () => set({ auth: { status: 'UNAUTHENTICATED', authData: null }, accessToken: null, refreshToken: null, isLoggedIn: false }),
            setHasHydrated: (state) => set({ _hasHydrated: state }),
            setTokens: (at, rt) => set({ accessToken: at, refreshToken: rt })
        }),
        {
            name: 'auth-secure-storage',
            storage: createJSONStorage(() => SecureStoreAdaptor),
            // 💡 [핵심] partialize: SecureStore에 저장할 상태만 선택합니다.
            // accessToken은 제외하고 refreshToken만 디스크에 저장되게 합니다.
            partialize: (state) => ({
                refreshToken: state.refreshToken,
            }),
            onRehydrateStorage: () => (state) => {
                // 복원(저장소 -> zustand)이 완료되면 zustand의 최신 state를 콜백함수의 인자로 넣어줌
                state?.setHasHydrated(true) // 즉, 복원이 완료되면 _hasHydrated의 값을 변경하는 setHasHydrated를 호출해서 true로 변경한다.
            }
        }
    )
)