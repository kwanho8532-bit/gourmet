import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Stack } from "expo-router"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { MD3LightTheme, PaperProvider } from "react-native-paper"
import GlobalOfflineGuard from "@/global/GlobalOfflineGuard"
import { GlobalSnackbar } from "@/global/GlobalSnackbar"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // 💡 1. 전역적으로는 포커스 시 자동 새로고침을 꺼둡니다. (서버 보호)
            refetchOnWindowFocus: false,

            // 💡 2. 혹은 켠다면 반드시 staleTime을 넉넉하게 지정합니다.
            // refetchOnWindowFocus: true,
            staleTime: 1000 * 60 * 3, // 3분 동안은 fresh 상태 유지

            // 💡 3. 컴포넌트가 새로 마운트될 때, 데이터가 'stale(상함)' 상태일 때만 리페치합니다.
            // true가 기본값이므로 생략해도 무방하지만, 명시하려면 'always'가 아닌 true를 주어야 합니다.
            refetchOnMount: true,
        }
    },
})

export default function RootLayout() {
    return (
        <GestureHandlerRootView>
            <QueryClientProvider client={queryClient}>
                <KeyboardProvider>
                    <PaperProvider theme={MD3LightTheme}>
                        <SafeAreaProvider>
                            <GlobalOfflineGuard>
                                <Stack screenOptions={{ headerShown: false }}>
                                    {/* 프로젝트에 맞춰서 Stack.Screen 생성하기 */}
                                    <Stack.Screen name="(app)" />
                                </Stack>
                                <GlobalSnackbar />
                            </GlobalOfflineGuard>
                        </SafeAreaProvider>
                    </PaperProvider>
                </KeyboardProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    )
}