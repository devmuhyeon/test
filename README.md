# PC 공통 데이트피커

`index.html`을 열면 단일 날짜, 다중 날짜(월 고정/월 이동), 월 선택과 영문 예제를 확인할 수 있습니다.

## 공통 파일 적용

1. `datepicker.css` 내용을 첫 번째 공통 CSS의 아이콘 정의 앞에 삽입합니다.
2. `datepicker.js` 내용을 공통 JS 최하단에 추가합니다. 기존 jQuery 3.6.1 로딩을 유지합니다.
3. JSP에 아래 버튼을 한 줄 넣습니다. jQuery UI 달력과 함께 사용하는 화면에서는 각각의 마크업을 사용합니다.

```html
<button type="button" data-work24-datepicker="day" data-dp-name="visitDate" data-dp-label="방문일">방문일</button>
```

| 속성 | 값 |
| --- | --- |
| `data-work24-datepicker` | `day` 날짜, `month` 월, `multi` 다중 날짜 |
| `data-dp-name` | 폼 전송용 hidden input 이름. `request.getParameter("visitDate")`로 읽을 수 있습니다. |
| `data-dp-value` | 서버 초깃값. `2026-12-05`, `2026-12`, 또는 `2026-12-05,2026-12-12` |
| `data-dp-locked-month` | 다중 선택을 지정 월에 고정할 때 `2026-12` |
| `data-dp-label` | 버튼과 대화상자의 접근 가능한 이름. 화면에 여러 개일 경우 필드명을 지정합니다. |
| `data-dp-lang` | 기본 `ko`, 영문 `en` |

선택값은 각각 `YYYY-MM-DD`, `YYYY-MM`, 날짜 목록을 쉼표로 연결한 문자열입니다. 다중 선택은 **적용**에서 저장하며 빈 목록도 적용할 수 있습니다. 저장값이 바뀌면 hidden input의 `change`와 버튼의 `work24datepicker:change` 이벤트가 발생합니다. 버튼 이벤트의 두 번째 인수는 단일 날짜·월 모드에서 문자열이고 다중 모드에서 날짜 배열입니다. 기본 연도 범위는 1900~2100입니다.

## 키보드

- Enter/Space로 열면 선택 날짜 또는 오늘에 포커스가 갑니다. 지정 월이 오늘과 다르면 해당 월 범위의 날짜에 포커스합니다.
- 방향키로 셀을 이동합니다. Home/End는 행의 처음/끝, Page Up/Down은 이전/다음 달(월 선택은 연도), 날짜에서 Shift+Page Up/Down은 이전/다음 연도로 이동합니다.
- Tab과 Shift+Tab은 레이어의 활성 조작 요소 전체를 순환합니다.
- Enter/Space로 날짜·월을 선택합니다. Escape 또는 닫기로 닫으면 호출 버튼으로 포커스가 돌아옵니다.
- jQuery 3.6.1 환경에서 IE8은 지원할 수 없습니다. 브라우저·스크린리더 조합별 접근성 검증은 별도로 필요합니다.
