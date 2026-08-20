# ⚓ Three.js Procedural Ships Project - AI 에이전트 코딩 가이드라인

본 문서는 Three.js를 활용하여 외부 모델 없이 코딩만으로 다양한 배(바이킹선, 거북선, 증기선 등)를 절차적으로 생성하는 프로젝트의 절대 규칙입니다. AI는 코드를 작성하거나 수정할 때 반드시 아래의 모든 규칙을 100% 준수해야 합니다.

## 1. 3D 모델링 핵심 원칙 (절차적 생성)
- **[절대 금지]** `.gltf`, `.glb`, `.obj` 등 외부 3D 모델 파일은 어떠한 경우에도 로드하지 않습니다.
- 모든 객체는 Three.js의 기본 도형(`BoxGeometry`, `CylinderGeometry`, `SphereGeometry`, `ExtrudeGeometry`, `LatheGeometry` 등)과 정점(Vertex) 조작만을 조합하여 생성합니다.
- **[형태 무결성]** 부품들이 허공에 뜨거나 분리되어 겉돌지 않도록 3D 공간상의 좌표(position)와 회전(rotation)을 수학적으로 완벽하게 일치시켜야 합니다.
- **[불필요한 메시 금지]** 명시적인 지시가 없는 한, 배 밑바닥을 받치는 임의의 판자(Base/BoxGeometry)나 시각적으로 의미 없는 더미(Dummy) 메시는 생성하지 않습니다.

## 2. 재질(Material) 및 렌더링 규칙
- 모든 3D 객체의 재질은 빛과 그림자에 반응하는 `MeshStandardMaterial` 또는 `MeshPhysicalMaterial`을 기본으로 사용합니다. (`MeshBasicMaterial` 사용 금지)
- 금속(Metalness)과 거칠기(Roughness) 값을 세밀하게 조절하여 나무, 쇠, 천 등의 질감을 사실적으로 구분해야 합니다.
- 새롭게 추가되는 모든 Mesh에는 반드시 그림자 속성(`castShadow = true`, `receiveShadow = true`)을 활성화합니다.

## 3. 코드 구조 및 모듈화
- 코드는 Modern JavaScript (ES6+) 표준을 따르며, 재사용성을 위해 철저히 모듈화(ESM `import`/`export`)합니다.
- 렌더링 루프(animate)와 씬(Scene) 세팅은 메인 파일에 두고, 개별 배의 모델링 생성 로직은 각각 독립된 파일(예: `viking.js`, `steamboat.js`)로 분리합니다.
- 공통으로 사용되는 재질(Material)은 `materials.js` 같은 공통 파일에서 중앙 관리합니다.

## 4. 애니메이션 및 물리
- `requestAnimationFrame` 루프 내에서 애니메이션을 구현할 때는 배의 전진 속도(velocity)와 부품(예: 증기선의 바퀴, 바이킹선의 노)의 움직임을 수학적 비례식으로 연동하여 어색함이 없도록 합니다.
- 수면 물리나 배의 흔들림(Pitching/Rolling)을 구현할 때는 `Math.sin()`, `Math.cos()` 등의 삼각함수를 활용하여 자연스러운 파동을 생성합니다.

## 5. AI 에이전트 자가 검증(Self-Correction) 프로세스
- 코드를 출력하기 전, 다음 항목을 반드시 머릿속으로 시뮬레이션(Dry-run)하고 논리적 오류가 없음을 확신할 때만 코드를 제안하세요:
  1. 부품 간의 Z축, Y축 결합부위가 벌어지거나 허공에 뜨지 않았는가?
  2. 불필요한 받침대(Base)나 판자가 추가되지 않았는가?
  3. 변수명 오타, 누락된 `import`, 또는 지원하지 않는 Three.js 메서드 호출이 없는가?
- 만약 코드를 수정한 뒤 브라우저 렌더링 시 형태가 어긋날 수 있는 의심 구간(특정 좌표나 각도)이 있다면, 사용자에게 해당 부분의 소수점을 직접 미세 조정하라고 주석이나 메시지로 안내하세요.