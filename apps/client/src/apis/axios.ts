// ==================================================================================================================================================================================================================
// [Notice]
// 1. IS_AUTH_ENABLED: 프로젝트에 JWT 로그인 기능이 있다면 true, 없다면 false로 설정하세요.
// 2. false 설정 시 토큰 검증, 401 RTR(Refresh Token Rotation) 재발급 로직이 자동으로 비활성화됩니다.
// ==================================================================================================================================================================================================================

import { useAuthStore } from '@/stores/useAuthStore'
import { useNetWorkStore } from '@/stores/useNetworkStore'
import { useSnackbarStore } from '@/stores/useSnackbarStore'
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// 💡 인증 기능 사용 여부 (로그인 미사용 앱인 경우 false로 변경)
const IS_AUTH_ENABLED = true;

const api = axios.create({
    // baseURL에는 ngrok서버의 주소를 기입하면됨 (ex - https://a1b2-123.ngrok-free.app/api)
    // 백엔드 서버는 localhost(자기자신)주소로 개발하는데 앱에서 localhost로 접근하면 백엔드 서버의 localhost가 아니라
    // 앱 자기자신의 localhost로 접근한다. 따라서 백엔드 서버의 localhost가 아니라 앱 자기자신의 localhost로 접근하기 때문에 서버를 인식을 못한다.
    // => 이를 해결하기 위해 ngrok이 앱과 서버 사이에서 중계를 수행해준다.
    baseURL: '',
    headers: {
        "Content-Type": 'application/json',
        // 💡 ngrok 무료 버전의 보안 경고 페이지를 패스하는 헤더 주입
        'ngrok-skip-browser-warning': 'true',
    }
})

export const PUBLIC_ENDPOINTS = [
    '/register',
    '/login',
    '/refresh'
]

// ==============================================================================================================================
// Request Interceptor (요청 인터셉터)
// ==============================================================================================================================
api.interceptors.request.use(
    (config) => {
        // [공통] 오프라인 상태 감지
        const isOnline = useNetWorkStore.getState().isOnline
        if (!isOnline) {
            useSnackbarStore.getState().showSnackbar({
                message: '네트워크 연결이 필요합니다. 연결 상태를 확인해주세요.',
                type: 'error',
                duration: 5000
            })

            // 요청 인터셉터에서 reject하면 응답 인터셉터의 (err) => {...} 여기로 바로 들어감(서버 안거치고)
            // 응답 인터셉터에서 code로 분기하기 때문에 new Error() 형식이 아닌 AxiosError()의 형태로 에러 던짐
            return Promise.reject(new AxiosError('OFFLINE_BLOCKED', 'ERR_OFFLINE'))
        }

        // [인증 모드 전용] 토큰 주입 로직
        if (IS_AUTH_ENABLED) {
            // 요청이 로그인이 필요없는 곳으로 향한다면 그대로 들어가도록 함 (로그인 기능이 없다면 주석 처리)
            const isPublic = PUBLIC_ENDPOINTS.some((endPoint) => config.url?.includes(endPoint))
            if (isPublic) return config;

            // 토큰이 존재하면 headers에 실어서 보냄 (없으면 rtr 서버로직으로 재발급)
            // 이것도 로그인 기능 없다면 주석 처리
            const token = useAuthStore.getState().accessToken;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (err) => Promise.reject(err)
)

// ==============================================================================================================================
// 2. Response Interceptor (응답 인터셉터)
// ==============================================================================================================================
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry: boolean;
}

let isRefreshing: boolean = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
}> = []

const processQueue = (err: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (err) {
            return prom.reject(err);
        } else if (token) {
            return prom.resolve(token);
        }
    })
    failedQueue = []
}

api.interceptors.response.use(
    (response) => response,
    async (err: AxiosError) => {
        // [공통] 오프라인 에러의 경우 토큰 재발급 시도 X -> 즉시 reject
        if (err.code === 'ERR_OFFLINE') return Promise.reject(err)

        // [공통] 2. 서버 에러(500번대) 공통 알림 처리
        if (err.response?.status && err.response.status >= 500) {
            useSnackbarStore.getState().showSnackbar({
                message: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
                type: 'error',
                duration: 3000
            })
            return Promise.reject(err)
        }

        // 인증 기능을 사용하지 않는 환경이라면 추가 재발급 로직을 타지 않음
        if (!IS_AUTH_ENABLED) {
            return Promise.reject(err)
        }

        // ==============================================================================================================================
        // [인증 모드 전용] 401 RTR 토큰 재발급 로직
        // ==============================================================================================================================

        const originalRequest = err.config as CustomAxiosRequestConfig;

        if (!originalRequest) {
            return Promise.reject(err)
        }

        // status가 401(Unauthorized)이면서 _retry가 false인 경우(재시도 된 적 없음)
        // 즉, 토큰이 없으면서 토큰 재발급을 위해 재시도 된 적 없는 경우 토큰 재발급 시도
        if (err.response?.status === 401 && !originalRequest._retry) {
            // 기존 요청이 로그인이 필요없는 요청에서 발생한 에러라면 그대로 reject
            if (PUBLIC_ENDPOINTS.some((endPoint) => originalRequest.url?.includes(endPoint))) {
                return Promise.reject(err)
            }

            // 이미 다른 요청으로 토큰 재발급 중이라면 이후에 들어오는 요청에 대한 응답은 failedQueue(대기열)에 담아둠
            // 이때 failedQueue는 pending상태의 Promise의 제어권(resolve, reject)을 갖는 객체의 배열임
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    // 나중에 processQueue에서 resolve(token)가 호출되면 실행되는 후속처리
                    // 새로 발급받은 token으로 다시 기존의 요청을 재요청
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`
                        return api(originalRequest)
                    })
                    // processQueue에서 reject(err)가 호출된 경우 에럴르 반환(reject)
                    .catch(err => Promise.reject(err))
            }

            // 여기까지 왔다면 이 요청이 토큰 재발급을 대표로 수행할 "최초의 401 요청"입니다.
            // 무한 루프에 빠지지 않도록 재시도 플래그를 true로 설정합니다.
            originalRequest._retry = true;

            // 현재 토큰 재발급 작업이 시작되었음을 시스템 전체에 알립니다.
            isRefreshing = true;

            try {
                const refreshToken = useAuthStore.getState().refreshToken;

                if (!refreshToken) {
                    throw new Error('No Refresh Token Available')
                }

                // at를 재발급 받기 위해 rt를 실어서 요청
                const { data } = await api.post('/refresh', { refreshToken })

                // 새로 발급된 at/rt를 추출
                const newAccessToken = data.accessToken;
                const newRefreshToken = data.refreshToken;

                // zustand에 at/rt 저장
                useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

                // 대기 중인 작업들에 새로 발급받은 token을 넘겨 대기 해제(요청 시작)
                processQueue(null, newAccessToken)

                // 최초로 401 에러가 났던 이 원본 요청의 Authorization 헤더에도 새 엑세스 토큰을 주입합니다.
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                // 원본 요청을 재시도하고 최종 결과를 반환합니다.
                return api(originalRequest)
            } catch (err) {
                // 토큰 재발급(try 블록) 과정에서 에러가 발생한 경우 (리프레시 토큰도 만료된 경우 등)
                // 대기열(failedQueue)에 남아있던 모든 요청들에게 에러를 전달합니다.
                processQueue(err, null)

                // 사용자의 로그아웃 처리(스토어 비우기, 로그인 페이지 이동 등)를 수행합니다.
                useAuthStore.getState().logout()

                // 발생한 에러를 reject 하여 호출부로 전달합니다.
                return Promise.reject(err)
            } finally {
                // 성공이든 실패든 재발급 작업이 모두 끝났으므로 isRefreshing 플래그를 false로 원상복구합니다.
                isRefreshing = false
            }
        }
        // 401 에러가 아니거나 이미 재시도했던 요청인 경우 에러를 그대로 reject 합니다.
        return Promise.reject(err)
    }
)