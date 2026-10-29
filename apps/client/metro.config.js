const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// 모노레포 루트 경로 확보
const projectRoot = __dirname;
const workspaceRoot = path.join(projectRoot, '..', '..'); // 프로젝트 위치에 맞게 조절

const config = getDefaultConfig(projectRoot);

// 1. 모든 node_modules 폴더를 Metro가 감시하도록 설정
config.watchFolders = [workspaceRoot];

// 2. 패키지 탐색 시 모노레포 루트의 node_modules를 우선 순위에 포함
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// 3. 심볼릭 링크 허용 (최신 Metro 버전에서는 필수)
config.resolver.unstable_enableSymlinks = true;  // pnpm의 심볼릭 링크(Symbolic Link)를 Metro가 추적할 수 있게 허용한다
// config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs']; // zod v4 번들 확장자 추가

module.exports = config;