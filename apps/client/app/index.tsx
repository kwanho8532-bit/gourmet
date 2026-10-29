import { Redirect } from "expo-router";


export default function RootIndex() {
    // 이건 파일에 맞춰서 바인딩하기 
    // 기본적으로 앱이 시자되면 루트의 _layout.tsx가 먼저 실행/평가되고,
    // 이후 루트의 index.tsx가 실행되어 <Redirect/>로 이동이 발생한다.
    // 이때 루트의 _layout.tsx에 정의된 경로로 이동된다. (ex - /home)

    // 어차피 _layout.tsx가 먼저 평가됨 => 그렇다면 그냥 가드가 필요한 경우 _layout.tsx 내부에서 권한 체크를 하면됨.
    // 즉, _layout.tsx가 평가되고 나서 내부에서 Redirect등의 라우팅 개입이 발생하지 않는다면 Expo Router는 현재 URL 주소에 해당하는 파일인 index.tsx를 찾아 자동으로 렌더링한다.
    // 따라서 _layout.tsx가 평가되고 자동으로 index.tsx가 평가되는것이다. 굳이 이렇게 2단계를 거치기 보다는 _layout.tsx에서 권한 체크하는 것이 효율적일 것이다.

    // 정리하자면 두 방식 모두 장단점이 존재한다. 
    // 1. _layout.tsx에서 권한 체크하는 방식 - 장: 불필요한 랜더링 차단, 깜빡임 방지, 중앙화된 보안 / 단: 권한 체크 로직이 방대해질 경우 코드가 지저분해질 수 있음
    // 2. index.tsx에서 권한 체크하는 방식 - 장: 단일 책임 원칙(_layout이 권한 체크, 네비게이션 가드 등 여러 책임을 갖는 것을 방지), 독립성 / 단: 불필요한 랜더링 발생 가능, 깜빡임 발생 가능, 보안의 파편화

    // 따라서 간단한 로그인 여부 정도의 권한 체크는 _layout.tsx에서 권한체크(index.tsx 생성 X)하도록 하고,
    // 복잡한 권한 체크 로직이 존재한다면 index.tsx를 생성하여 따로 분리하도록 만드는 방식이 좋다.

    // 만약 권한 관련 체크가 존재하지 않는 간단한 프로젝트의 경우는 그냥 index.tsx를 만들어서 Redirect를 실행하는게 좋다.
    // 그냥 root layout만 존재하면 Redirect시키기 까다롭다. (index.tsx는 expo router가 자동으로 찾게됨)
    return <Redirect href='/home' />
}