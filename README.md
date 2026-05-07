# 벌레숲 마을 산책

픽셀 아트 마을을 돌아다니며 주민과 대화하고, 풀숲에서 야생 벌레를 잡는 정적 웹 게임입니다.

## 파일 위치 확인

아래처럼 파일이 있으면 구조는 맞습니다.

```text
.
├── index.html
├── package.json
└── src/
    ├── main.js
    └── styles.css
```

`src/main.js`와 `src/styles.css`를 `src` 폴더 밖으로 빼면 게임 로직이나 스타일이 로드되지 않습니다.

## 중요한 점: GitHub의 Files 화면은 게임 실행 화면이 아닙니다

GitHub 저장소에서 보이는 파일 목록 화면은 코드를 보는 곳입니다. 그 화면에서는 게임이 실행되지 않습니다.

게임을 보려면 아래 중 하나로 열어야 합니다.

## 로컬에서 실행하기

터미널에서 프로젝트 폴더로 이동한 뒤 실행합니다.

```bash
npm run dev
```

그다음 브라우저에서 아래 주소를 엽니다.

```text
http://localhost:5173
```

`npm run dev`가 안 되면 Python으로 직접 실행해도 됩니다.

```bash
python3 -m http.server 5173
```

## GitHub Pages로 배포해서 실행하기

1. GitHub 저장소의 **Settings**로 이동합니다.
2. 왼쪽 메뉴에서 **Pages**를 엽니다.
3. **Build and deployment**에서 Source를 **Deploy from a branch**로 둡니다.
4. Branch를 `main`, 폴더를 `/root`로 선택합니다.
5. Save를 누릅니다.
6. 잠시 후 표시되는 GitHub Pages 주소로 접속합니다.

주소 예시는 보통 아래 형태입니다.

```text
https://사용자이름.github.io/저장소이름/
```

## 게임 로직이 로드됐는지 확인하는 법

화면 안에 `게임 로직 로딩 중...` 안내가 계속 보이면 JavaScript가 실행되지 않은 상태입니다.

정상 로드되면 안내가 사라지고, 메시지 박스에 다음 문구가 보입니다.

```text
게임 로직이 정상적으로 로드됐어요! 방향키/WASD로 움직이고 Space로 상호작용하세요.
```

## 조작법

- `WASD` 또는 방향키: 이동
- `Space`: 주민과 대화 또는 벌레 잡기
- `R`: 잡은 벌레 기록 초기화
