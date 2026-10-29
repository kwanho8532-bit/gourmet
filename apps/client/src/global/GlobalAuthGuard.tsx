import { AuthProvider } from "@/contexts/AuthContext";
import { useAuthStore } from "@/stores/useAuthStore";
import { Redirect } from "expo-router";
import React from "react"
import { ActivityIndicator, View } from "react-native"

interface GlobalAuthGuardProps {
    children: React.ReactNode
}

export default function GlobalAuthGuard({ children }: GlobalAuthGuardProps) {
    // 스토어에서 인증 상태와 유저 정보 가져오기
    const { auth, _hasHydrated } = useAuthStore();

    console.log(auth, 'GlobalAuthGuard 내부 auth')

    // 1. 스토어 복원(Hydration) 중이거나 me 쿼리 요청 중일 때 -> 로딩 화면
    if (!_hasHydrated) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    // 2. 인증 실패 (auth가 null) -> 로그인 화면으로 리다이렉트
    if (auth.status !== 'AUTHENTICATED') {
        return <Redirect href="/login" />;
    }

    // 3. 인증 완료 -> 자식(보호된 화면) 렌더링
    return (
        <AuthProvider value={auth}>
            <View style={{ flex: 1 }}>{children}</View>
        </AuthProvider>
    )
}
