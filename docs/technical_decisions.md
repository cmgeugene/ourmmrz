# 기술 결정 사항 및 아키텍처 요약

이 문서는 데이트 타임라인 앱(`ourmmrz`) 개발을 위해 현재까지 합의된 기술적 결정 사항을 정리한 것입니다.

## 1. 개요
Stitch 디자인 `12309556307585584052`을 기반으로 하는 Android/iOS/Web 크로스 플랫폼 애플리케이션입니다.

## 2. 기술 스택 (Tech Stack)
- **프레임워크**: React Native (Expo SDK 54+)
- **언어**: TypeScript
- **네비게이션**: Expo Router (파일 기반 라우팅)
- **스타일링**: **NativeWind v4** (Tailwind CSS for React Native)
- **애니메이션**: React Native Reanimated

## 3. 백엔드 및 인프라 (Supabase)
서버리스 아키텍처를 채택하여 Supabase를 백엔드로 사용합니다.
- **Database**: PostgreSQL (타임라인, 유저 데이터 저장)
- **Auth**: **Google 로그인** 연동
- **Storage**: 사진 및 미디어 저장 서비스
  - *이미지 최적화*: 업로드 전 클라이언트(`expo-image-manipulator`)에서 압축 및 리사이징 수행.

## 4. 플랫폼 및 배포 전략
- **모바일**: Android, iOS 지원 (Expo Go 및 네이티브 빌드)
- **PC/Web**: React Native Web을 통해 반응형 웹 지원. 브라우저로 접속 가능.
- **배포**: 웹 버전은 Vercel/Netlify 등을 통해 정적 호스팅.

## 5. 프로젝트 초기화 이슈 모음 (Troubleshooting)
- **Windows 경로 이슈**: `ERR_UNSUPPORTED_ESM_URL_SCHEME` 에러 발생. `metro.config.js`의 경로 설정을 `path.resolve`로 수정하거나, 안정성을 위해 Mac 환경으로의 이전을 권장함.
- **의존성 충돌**: `react-native-reanimated`와 `worklets-core` 버전 충돌 발생 시 `--legacy-peer-deps` 옵션 사용 권장.

## 6. 디렉토리 구조
- `app/`: Expo Router 라우트 및 글로벌 스타일
- `components/`: 공통 UI 컴포넌트
- `constants/`: 색상(Blue/White), 테마 등 상수값
- `docs/`: 프로젝트 문서화 폴더
