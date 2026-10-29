## ⚠️ Troubleshooting: Starter Pack 기반 빌드 에러 해결 안내

`git clone`으로 스타터팩(템플릿)을 내려받아 새 프로젝트를 시작할 때, EAS 클라우드 빌드 과정에서 의존성 관련 에러(`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` 또는 Native Module 버전 충돌)가 발생할 수 있습니다.

### 1. 원인 분석
* **서브 의존성(Sub-dependency)의 버전 미스매치**
  * `package.json`에 명시된 최상위 라이브러리(예: `react-native-reanimated@4.5.1`) 버전이 동일하더라도, 해당 라이브러리가 내부적으로 사용하는 서브 의존성(예: `react-native-worklets`)은 패키지 설치 시점에 따라 더 높은 최신 버전(예: `0.13.0`)으로 자동 업데이트되어 설치될 수 있습니다.
* **Lockfile 동기화 이탈**
  * 템플릿 작성 시점의 `pnpm-lock.yaml` 기록과 로컬/EAS 환경에서 계산된 최신 서브 의존성 그래프가 달라지면, Expo EAS 서버의 엄격한 `--frozen-lockfile` 검사를 통과하지 못하고 빌드가 중단됩니다.

---

### 2. 해결 방법

#### 방법 A. pnpm Lockfile 재동기화 (가장 기본적이고 권장되는 방식)
템플릿의 과거 Lockfile 기록을 현재 설치 환경에 맞게 갱신해 줍니다.

```bash
# 1. 로컬 환경에서 Lockfile 강제 재작성
pnpm install --no-frozen-lockfile

# 2. 갱신된 Lockfile Git 커밋 및 푸시
git add pnpm-lock.yaml package.json
git commit -m "chore: sync pnpm lockfile for workspace build"
git push origin main
```

#### 방법 B. Specific Sub-dependency Version Override (특정 서브 의존성 버전 강제 고정)
특정 라이브러리의 하위 패키지 버전이 상향되어 명백한 호환성 에러를 일으키는 경우(예: react-native-worklets 버전을 0.10.0으로 고정해야 할 때), 최상위 루트의 package.json에서 버전을 강제로 고정(Override)합니다.

1. Expo 빌드 로그를 확인하여 요구되는 정확한 서브 의존성 패키지명과 버전을 파악합니다.

2. 루트 디렉토리의 package.json에 pnpm.overrides 설정을 추가합니다.

```json
// 루트 package.json
{
  "name": "my-monorepo-root",
  "private": true,
  "pnpm": {
    "overrides": {
      "react-native-worklets": "0.10.0"
    }
  }
}
```

# 🚀 프로젝트 시작하기 (Quick Start)

템플릿 저장소(Template Repository)를 기반으로 새 프로젝트를 생성한 직후, 아래 **4단계 초기화 작업**을 거쳐 독립된 프로젝트로 설정해야 합니다.

---

### 1️⃣ GitHub 템플릿으로 새 레포지토리 생성 및 클론

#### 옵션 A: GitHub 웹 UI 이용
1. 템플릿 저장소 페이지 우측 상단의 **[Use this template]** ➔ **[Create a new repository]** 클릭
2. 새 프로젝트 이름 입력 후 레포지토리 생성
3. 로컬 환경으로 클론:
```
git clone [https://github.com/YOUR_GITHUB_ID/YOUR_NEW_REPO.git](https://github.com/YOUR_GITHUB_ID/YOUR_NEW_REPO.git)
cd YOUR_NEW_REPO
```

#### 옵션 B: GitHub CLI 이용 (터미널 단독 실행)
    gh repo create my-new-app --template YOUR_GITHUB_ID/mern-expo-ts-template --public --clone
    cd my-new-app


### 2️⃣ 패키지 이름 수정 (`package.json`)

프로젝트의 독립성을 위해 루트 및 각 서비스의 `package.json` 내 `"name"` 필드를 새 프로젝트에 맞게 변경합니다.

* **루트 `package.json`**: `"name": "my-new-app-monorepo"`
* **`apps/server/package.json`**: `"name": "@my-new-app/server"`
* **`apps/native/package.json`**: `"name": "@my-new-app/native"`

### 3️⃣ 의존성 패키지 새로 설치

독립된 `node_modules` 및 `pnpm-lock.yaml`을 재구성하기 위해 루트 디렉토리에서 패키지를 설치합니다.

    pnpm install

### 4️⃣ 로컬 환경변수 파일 (`.env`) 설정

템플릿의 `.env.example` 파일을 복사하여 실제 개발에 사용할 `.env` 파일들을 생성하고 필요한 정보(DB 주소, JWT Secret 등)를 입력합니다.

```bash
# 백엔드 서버 환경변수 설정
cp apps/server/.env.example apps/server/.env

# (필요 시) 앱/클라이언트 환경변수 설정
cp apps/native/.env.example apps/native/.env
```

---

# 📱 Expo Router 인증 가드 및 라우팅 구조 가이드

이 프로젝트는 **Expo Router의 Group Routing (`(public)`, `(app)`)** 패턴을 활용하여 로그인 인증 가드(Auth Guard)의 적용 여부를 폴더 구조 수준에서 격리하고 관리합니다.

---

## 📂 폴더 구조 설계 Overview

```text
apps/native/app/
├── _layout.tsx           # 🌐 [최상위 전역 Layout] (Toast, QueryClient, Theme 등 기본 Provider만 배치)
├── index.tsx             # 🔀 [진입점] 접속 시 로그인 여부에 따라 (public) 또는 (app)으로 라우팅
│
├── (public)/             # 🔓 [비보호 영역] 누구나 접근 가능한 화면 그룹
│   ├── _layout.tsx       # (public) 전역 레이아웃
│   ├── index.tsx         # 랜딩 페이지 또는 홈 화면
│   ├── login.tsx         # 로그인 화면
│   └── about.tsx         # 소개 페이지 등
│
└── (app)/                # 🔒 [보호 영역] 인증(GlobalAuthGuard)이 필요한 화면 그룹
    ├── _layout.tsx       # 👈 GlobalAuthGuard가 적용된 레이아웃
    ├── dashboard.tsx     # 대시보드 (로그인 필수)
    └── profile.tsx       # 마이페이지 (로그인 필수)
```

---

## 🚀 프로젝트 유형별 활용 가이드

### 1. 인증(로그인) 기능이 필요한 프로젝트를 만들 때

* **로그인 필요 화면:** `app/(app)/` 폴더 하위에 페이지를 생성합니다.
  * `(app)/_layout.tsx`에 `GlobalAuthGuard`가 감싸져 있어, 미인증 사용자가 접근 시 자동으로 `/login`으로 리다이렉트됩니다.
* **로그인 불필요 화면:** `app/(public)/` 폴더 하위에 페이지를 생성합니다 (예: 로그인, 회원가입, 이용약관 등).

---

### 2. 인증(로그인) 기능이 없는 서비스/앱을 만들 때

* **모든 화면 작성:** `app/(public)/` 폴더 하위에 모든 페이지 파일(`.tsx`)을 생성하여 개발합니다.
* **불필요한 가드 정리 (선택 사항):**
  * `app/(app)/` 폴더와 `src/components/GlobalAuthGuard.tsx` 파일은 사용하지 않으므로 삭제하거나 방치하셔도 서비스 실행에 전혀 영향을 주지 않습니다.