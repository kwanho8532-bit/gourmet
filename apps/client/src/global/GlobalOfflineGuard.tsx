import Offline from "@/components/Offline"
import { colors } from "@/constant/color"
import { useNetWorkStore } from "@/stores/useNetworkStore"
import { useSnackbarStore } from "@/stores/useSnackbarStore"
import React, { useEffect, useRef } from "react"
import { StyleSheet, View } from "react-native"

interface GlobalOffilneGuardProps {
    children: React.ReactNode
}

export default function GlobalOfflineGuard({ children }: GlobalOffilneGuardProps) {
    const isOnline = useNetWorkStore(state => state.isOnline)
    const initNetworkListener = useNetWorkStore(state => state.initNetworkListener)
    const showSnackbar = useSnackbarStore(state => state.showSnackbar)

    const isInitialMount = useRef(true)

    // 💡 1. 네트워크 리스너 바인딩 (컴포넌트 마운트/언마운트 시 단 1회만 실행)
    useEffect(() => {
        const unsubscribe = initNetworkListener()

        return () => unsubscribe()
    }, [initNetworkListener])

    // 💡 2. 온라인 재연결 감지 및 스낵바 트리거
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            return;
        }

        if (isOnline === true) {
            showSnackbar({
                message: '인터넷에 다시 연결됨',
                type: 'success'
            })
        }
    }, [isOnline, showSnackbar])

    return (
        <View style={{ flex: 1 }}>

            {children}

            {!isOnline &&
                <View style={[{ flex: 1, backgroundColor: colors.white }, StyleSheet.absoluteFill]}>
                    <Offline />
                </View>
            }

        </View>
    )
}