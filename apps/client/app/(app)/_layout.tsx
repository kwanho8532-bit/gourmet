import GlobalAuthGuard from "@/global/GlobalAuthGuard";
import { Stack } from "expo-router";


export default function AppLayout() {
    return (
        <GlobalAuthGuard>
            {/* 여기 Stack / Tab으로 프로젝트에 알맞게 진행하면 됨 */}
            <Stack>
                <Stack.Screen name="main" />
            </Stack>
        </GlobalAuthGuard>
    )
}