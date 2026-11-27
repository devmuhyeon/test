# PC 공통 데이트피커

`index.html`을 열면 단일 날짜, 다중 날짜(월 고정/월 이동), 월 선택, 근무일 선택과 영문 예제를 확인할 수 있습니다.

데모는 첨부된 첫 번째 CSS에 컴포넌트 CSS를 삽입한 `common.css`, 두 번째 CSS인 `layout.css`, `jquery-ui.css`, 그리고 첨부 JS에 컴포넌트를 추가한 `common.js`를 로드합니다. 공통 소스의 `/cm/static/` 경로에 있는 이미지와 폰트는 고용24 서버에서 제공됩니다.

## 공통 파일 적용

1. `datepicker.css` 내용을 첫 번째 공통 CSS의 아이콘 정의 앞에 삽입합니다.
2. `datepicker.js` 내용을 공통 JS 최하단에 추가합니다. 기존 jQuery 3.6.1 로딩을 유지합니다.
3. JSP에 아래 버튼을 한 줄 넣습니다. jQuery UI 달력과 함께 사용하는 화면에서는 각각의 마크업을 사용합니다.

```html
<!-- A타입: 단일 날짜 -->
<button type="button" class="date_picker_btn" w24-datepicker="single"></button>

<!-- B타입: 다중 날짜 -->
<button type="button" class="date_picker_btn" w24-datepicker="multiple"></button>

<!-- C타입: 월 선택 -->
<button type="button" class="date_picker_btn" w24-datepicker="month"></button>

<!-- D타입: 근무일 선택 -->
<button type="button" class="date_picker_btn" w24-datepicker="workday"></button>
```

| 속성 | 값 |
| --- | --- |
| `w24-datepicker` | `single` 단일 날짜, `multiple` 다중 날짜, `month` 월, `workday` 근무일 |
| `data-dp-name` | 폼 전송용 hidden input 이름. `request.getParameter("visitDate")`로 읽을 수 있습니다. |
| `data-dp-value` | 서버 초깃값. `2026-12-05`, `2026-12`, 또는 `2026-12-05,2026-12-12` |
| `data-dp-locked-month` | 다중 선택을 지정 월에 고정할 때 `2026-12` |
| `data-dp-lang` | 기본 `ko`, 영문 `en` |

선택값은 각각 `YYYY-MM-DD`, `YYYY-MM`, 날짜 목록을 쉼표로 연결한 문자열입니다. 다중 선택은 **적용**에서 저장하며 빈 목록도 적용할 수 있습니다. 저장값이 바뀌면 hidden input의 `change`와 버튼의 `work24datepicker:change` 이벤트가 발생합니다. 버튼 이벤트의 두 번째 인수는 단일 날짜·월 모드에서 문자열이고 다중 모드에서 날짜 배열입니다. 기본 연도 범위는 1900~2100입니다.

버튼 안의 `span.blind`에 `방문일`처럼 필드명을 넣으면 선택값과 함께 버튼의 `aria-label`을 자동 생성합니다. 버튼이 비어 있으면 유형별 기본 이름을 지정하고 `span.blind`를 생성합니다. 기존 `button.btn_calendar`는 현재 마크업과 초기화 방식을 그대로 사용합니다.

## 주말과 공휴일 설정

```html
<button type="button" class="date_picker_btn" w24-datepicker="workday" data-dp-name="workDates" data-dp-count-target="#workday-count" data-dp-holidays="2026-12-25" data-dp-holidays-add="2026-12-24,2026-12-31" data-dp-holidays-exclude="2026-12-24"><span class="blind">근무일 선택</span></button>
<label for="workday-count">선택한 근무일 수</label>
<input id="workday-count" name="workdayCount" type="text" readonly>
```

| 속성 | 값 |
| --- | --- |
| `data-dp-disable-weekends` | `true`이면 토·일 선택 불가, `false`이면 주말 선택 가능. `workday`는 생략 시 `true`, 나머지 유형은 `false` |
| `data-dp-count-target` | 근무일 개수를 쓸 같은 폼 내 `input` 선택자 |
| `data-dp-holidays` | JSP에서 전달하는 기본 공휴일 목록 |
| `data-dp-holidays-add` | 기본 목록에 추가할 날짜 |
| `data-dp-holidays-exclude` | 기본·추가 목록에서 공휴일 처리를 해제할 날짜 |

날짜는 `YYYY-MM-DD`로 지정하고 여러 날짜는 쉼표로 구분합니다. 공휴일 제외가 기본·추가 공휴일보다 우선합니다. 주말 비활성화가 켜져 있으면 공휴일 목록에서 제외한 토·일도 선택할 수 없습니다. 일 단위인 `single`, `multiple`, `workday`에 적용됩니다. 근무일은 여러 날짜를 선택한 뒤 적용하면 지정한 입력란에 일수가 반영됩니다. 국가 공휴일 데이터는 화면의 JSP에서 전달합니다.

## 키보드

- Enter/Space로 열면 선택 날짜 또는 오늘에 포커스가 갑니다. 지정 월이 오늘과 다르면 해당 월 범위의 날짜에 포커스합니다.
- 방향키로 셀을 이동합니다. Home/End는 행의 처음/끝, Page Up/Down은 이전/다음 달(월 선택은 연도), 날짜에서 Shift+Page Up/Down은 이전/다음 연도로 이동합니다.
- Tab과 Shift+Tab은 레이어의 활성 조작 요소 전체를 순환합니다.
- Enter/Space로 날짜·월을 선택합니다. Escape 또는 닫기로 닫으면 호출 버튼으로 포커스가 돌아옵니다.
- jQuery 3.6.1 환경에서 IE8은 지원할 수 없습니다. 브라우저·스크린리더 조합별 접근성 검증은 별도로 필요합니다.
