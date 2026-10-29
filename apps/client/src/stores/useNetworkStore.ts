import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { create } from 'zustand'

interface NetworkData {
    isConnected: boolean;
    isInternetReachable: boolean;
    isOnline: boolean;
    type: NetInfoStateType
}

interface NetworkAction {
    initNetworkListener: () => () => void; // void를 반환하는 함수를 반환함
}

type NetWorkState = NetworkData & NetworkAction

export const useNetWorkStore = create<NetWorkState>((set) => ({
    // 기본값을 true로 설정하는 것이 ui/ux상 좋음 -> 찰나의 순간만 null/undefined의 값을 갖고 그 이후에는 boolean값을 가짐 => 낙관적으로 true로 설정하여, 불필요한 깜빡임을 방지
    isConnected: true,
    isInternetReachable: true,
    isOnline: true,
    type: NetInfoStateType.unknown,
    initNetworkListener: () => {
        // NetInfo.addEventListener는 리턴 값으로 해당 리스너 구독을 해제하는 unsubscribe 함수를 줌 => 이걸 useEffect()로 cleanUp함수로 사용하면 됨
        // initNetworkListener를 루트의 _layout.tsx에 useEffect()로 호출하면서 네트워크 상태를 구독한다.
        // 네트워크 관련 이벤트 발생 시 NetInfo.addEventListener에 넘긴 함수가 실행되면서 해당 store의 데이터 값이 변경된다(set)
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            // 이벤트 감지 확인용 코드
            // if (!state.isConnected) {
            //     Alert.alert("네트워크 연결이 끊겼습니다. 디바이스 연결 상태를 확인해주세요.");
            // } else {
            //     console.log("최초 네트워크가 연결되었습니다.")
            // }

            // null 값이 들어올 수도 있는데 이건 os에 현재 network 상태를 물어보려고 갔다오는 찰나의 순간에 들어오는 값임 
            // null이 들어오는 것을 방지하기 위해 boolean 값으로 변경을 하는데 true는 낙관적으로 설정하는것이고, false는 비관적으로 설정하는 것이다. 
            const nextIsConnected = state.isConnected ?? true
            const nextInternetReachable = state.isInternetReachable ?? true
            const nextIsOnline = nextIsConnected && nextInternetReachable

            // useQuery에 넘긴 networkMode: 'online'은 offline일때 실행했다가 일시정지된 요청을 online이 되면 재요청해라는 규칙이고,
            // 아래는 off -> on으로 변경되는 것을 감지하는 트리거의 역할을 수행함 => 이를 통해 재요청이 트리거됨
            // 즉, networkMode는 onlineManager의 isOnline의 값을 바라보고, true면 재요청하고 false면 대기시키는 규칙이다.
            onlineManager.setOnline(nextIsOnline)

            set({
                isConnected: nextIsConnected,
                isInternetReachable: nextInternetReachable,
                isOnline: nextIsOnline,
                type: state.type
            })
        })

        return unsubscribe
    }
}))