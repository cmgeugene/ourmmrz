# 협업 가이드 (Collaboration Guide)

## Git 흐름
1. `master` 브랜치는 항상 배포 가능한 상태를 유지합니다.
2. 새로운 기능 개발 시 별도의 브랜치를 생성하여 작업 후 PR(Pull Request)을 통해 합칩니다.

## 환경 설정 (Mac 기준)
1. 리포지토리 클론: `git clone <repo_url>`
2. 의존성 설치: `npm install`
3. 서버 실행: `npx expo start`
   - Windows에서 발생하던 `d:` 경로 에러는 Mac/Linux 환경에서 발생하지 않습니다.

## 주요 규칙
- **Kebab-case**: 파일 및 폴더 이름은 kebab-case를 사용합니다 (ex: `memory-card.tsx`).
- **PascalCase**: 컴포넌트 이름은 PascalCase를 사용합니다.
- **NativeWind**: 인라인 스타일 대신 Tailwind 클래스를 우선적으로 사용합니다.
