import { Text, View } from "react-native";
import { Icon } from "react-native-paper";


export default function Offline() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
            <Icon size={60} source='wifi-alert' />
            <Text style={{ fontSize: 20 }}>네트워크 연결 상태를 확인해주세요!</Text>
        </View>
    )
}