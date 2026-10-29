# 🔄 모노레포 의존성 유지보수 및 버전 관리 가이드 (`MAINTENANCE.md`)

이 문서는 `mern-expo-ts-template` 모노레포 환경에서 의존성(Dependencies) 버전이 오래되었거나, 업데이트 시 발생할 수 있는 문제를 안전하게 대처하기 위한 표준 절차를 다룹니다.

---

## 💡 기본 원칙: `pnpm-lock.yaml`의 역할

본 템플릿에는 **`pnpm-lock.yaml`** 파일이 포함되어 있습니다.
* 새로운 프로젝트를 생성하거나 `pnpm install`을 실행할 때, 시간이 지나 최신 패키지 버전이 올라갔더라도 **템플릿이 작성된 당시 검증된 동일한 버전**을 복원합니다.
* 따라서 의존성이 최신 버전이 아니라고 해서 앱이 갑자기 동작하지 않거나 터지지 않으므로 안심하고 사용하셔도 됩니다.

---

## 🛠️ 의존성 업데이트 및 대처 절차

### 1. 현재 패키지 상태 확인

모노레포 전체 워크스페이스(`apps/server`, `apps/client`)에서 업데이트가 필요한 패키지 목록을 확인합니다.

```bash
# 전체 워크스페이스의 버전 상태 비교
pnpm outdated -r
```

---

### 2. 백엔드 및 공통 패키지 안전 업데이트

Express, Mongoose, TypeScript 등의 서버 및 공통 라이브러리를 최신 버전으로 올릴 때는 pnpm의 대화형 CLI를 사용합니다.

```bash
# 루트 디렉토리에서 대화형 인터페이스 실행
pnpm update -r -i --latest
```

* 터미널에 출력되는 패키지 목록에서 **방향키**로 이동하고 **스페이스바**로 원하는 패키지만 선택한 후 **Enter**를 눌러 업데이트합니다.
* 마이너(Minor) 및 패치(Patch) 버전은 즉시 올리는 것을 권장하며, 메이저(Major) 버전 업데이트 시에는 Breaking Changes를 확인 후 진행합니다.

---

### 3. Expo 프론트엔드 호환 버전 관리 (주의)

Expo 클라이언트(`apps/client`)의 경우, 일반 `pnpm update`를 사용할 경우 React Native 및 Native 모듈 간 버전 불일치로 컴파일 에러가 발생할 수 있습니다. 

Expo 환경에서는 **Expo 공식 CLI**를 통해 호환 버전을 맞추어야 합니다.

```bash
# apps/client 디렉토리로 이동
cd apps/client

# Expo SDK 기준 공식 호환 패키지 버전으로 일괄 정렬
npx expo install --fix
```

#### Expo SDK 메이저 업그레이드 (예: SDK 50 ➔ 51)
Expo SDK 자체를 상위 버전으로 올릴 경우 아래 명령어를 실행합니다.

```bash
cd apps/client
npx expo upgrade
```

---

### 4. Node.js ESM 모듈 호환 문제 대처 (`apps/server`)

백엔드 패키지 업데이트 후 `Cannot find module` 에러가 발생하면 다음을 확인합니다.

1. `package.json`에 `"type": "module"`이 유지되고 있는지 확인합니다.
2. 상대 경로 `import` 작성 시 `.js` 확장자가 누락되지 않았는지 점검합니다.
   ```typescript
   // ❌ 확장자 누락 시 런타임 에러 발생
   import { myUtil } from './utils/myUtil';

   // ✅ ESM 표준 명시
   import { myUtil } from './utils/myUtil.js';
   ```

---

### 5. `node_modules` 및 Lock 파일 강제 초기화 (최후의 대처)

패키지 버전 꼬임, 심볼릭 링크 에러, 캐시 충돌 등으로 인해 빌드가 불가능할 경우 전체 의존성을 재설치합니다.

#### macOS / Linux
```bash
# 1. 모든 node_modules 및 lock 파일 삭제
rm -rf node_modules apps/*/node_modules pnpm-lock.yaml

# 2. 의존성 재설치 및 잠금 파일 재생성
pnpm install
```

#### Windows (PowerShell)
```powershell
# 1. 모든 node_modules 및 lock 파일 삭제
Get-ChildItem -Path . -Include "node_modules" -Recurse -Directory | Remove-Item -Recurse -Force
Remove-Item -Path "pnpm-lock.yaml" -Force

# 2. 의존성 재설치 및 잠금 파일 재생성
pnpm install
```

---

## 🚨 버전 업데이트 후 검증 체크리스트

업데이트를 완료한 후 반드시 아래 명령어를 통해 정상 작동 여부를 검증하고 Git에 커밋합니다.

- [ ] 백엔드 서버 구동 확인: `pnpm dev:server`
- [ ] Expo 번들러 및 앱 구동 확인: `pnpm dev:client`
- [ ] 변경된 `package.json` 및 `pnpm-lock.yaml` 파일 Git 커밋

```bash
git add package.json apps/*/package.json pnpm-lock.yaml
git commit -m "chore: update dependencies to latest stable versions"
```