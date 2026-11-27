# PC 공통 데이트피커

`index.html`을 열면 단일 날짜, 다중 날짜(월 고정/월 이동), 월 선택, 날짜 선택과 영문 예제를 확인할 수 있습니다.

데모는 첨부된 첫 번째 CSS에 컴포넌트 CSS를 삽입한 `common.css`, 두 번째 CSS인 `layout.css`, `jquery-ui.css`, 그리고 첨부 JS에 컴포넌트를 추가한 `common.js`를 로드합니다. 공통 소스의 `/cm/static/` 경로에 있는 이미지와 폰트는 고용24 서버에서 제공됩니다.

## 공통 파일 적용

1. `datepicker.css` 내용을 첫 번째 공통 CSS의 아이콘 정의 앞에 삽입합니다.
2. `datepicker.js` 내용을 공통 JS 최하단에 추가합니다. 기존 jQuery 3.6.1 로딩을 유지합니다.
3. JSP에서 기존 `.box_table_group.box_datepicker > .cell > .box_ipt` 안에 `.input_txt`와 `.btn_calendar`를 배치합니다. 달력 유형은 버튼의 `w24-datepicker`로 지정합니다. jQuery UI 달력과 함께 사용하는 화면에서는 각각의 마크업을 사용합니다.

```html
<div class="box_table_group box_datepicker">
    <div class="cell">
        <span class="box_ipt">
            <input type="text" class="input_txt" placeholder="YYYY-MM-DD">
            <button type="button" class="btn_calendar" w24-datepicker="single"><span class="blind">달력선택</span></button>
        </span>
    </div>
</div>
```

위 기본 입력란만으로 동작합니다. 폼 전송이 필요할 때 `name`을 지정합니다. 연결된 `label`, `aria-label`, `aria-labelledby`, `title`이 있으면 사용하며, 모두 없으면 달력 버튼의 이름으로 입력란에 `aria-label`을 생성합니다. 기존 입력란의 `id`, 직접 입력과 연결된 이벤트를 유지합니다. `single`·`month`는 기존 입력란의 `name`으로 값을 전송합니다. 기간 월 선택은 시작·종료 입력란에 각각 `w24-datepicker="month"`를, 기간 날짜 선택은 각각 `w24-datepicker="single"`을 지정합니다. 기존 jQuery UI에 바인딩된 필드를 전환할 경우, 해당 필드는 기존 초기화 대상에서 빼고 새 버튼에만 `w24-datepicker`를 적용합니다.

| 속성 | 값 |
| --- | --- |
| `w24-datepicker` | `single` 단일 날짜, `multiple` 다중 날짜, `month` 월, `workday` 근무일 |
| `data-dp-value` | 서버 초깃값. `2026-12-05`, `2026-12`, 또는 `2026-12-05,2026-12-12` |
| `data-dp-locked-month` | 다중 선택을 지정 월에 고정할 때 `2026-12` |
| `data-dp-lang` | 기본 `ko`, 영문 `en` |

선택값은 각각 `YYYY-MM-DD`, `YYYY-MM`, 날짜 목록을 쉼표로 연결한 문자열입니다. 다중 선택은 **적용**에서 저장하며 빈 목록도 적용할 수 있습니다. 저장값이 바뀌면 hidden input의 `change`와 버튼의 `work24datepicker:change` 이벤트가 발생합니다. 버튼 이벤트의 두 번째 인수는 단일 날짜·월 모드에서 문자열이고 다중 모드에서 날짜 배열입니다.

버튼 안의 `span.blind`에 `방문일`처럼 필드명을 넣으면 선택값과 함께 버튼의 `aria-label`을 자동 생성합니다. 버튼이 비어 있으면 유형별 기본 이름을 지정하고 `span.blind`를 생성합니다. `w24-datepicker`가 없는 기존 버튼에는 이 컴포넌트가 연결되지 않습니다.

폼의 전송 이름은 `input`에 `name`으로 지정합니다. 다중 날짜와 근무일은 같은 이름의 hidden input에 날짜 목록을 저장합니다. 날짜를 직접 입력할 때 여러 건은 `YYYY-MM-DD` 형식의 날짜를 쉼표로 구분합니다.

## 날짜 여러 개와 기간 입력

| 방식 | 선택 및 입력 | 표시 예시 |
| --- | --- | --- |
| 다중 날짜 선택 | `multiple` 또는 `workday`에서 원하는 날짜를 개별 선택·해제한 뒤 **적용** | `2026-12-05 외 3일` |
| 기간 날짜 선택 | `single` 입력란 두 개에 시작일과 종료일을 각각 선택 | 시작일 `2026-12-05`, 종료일 `2026-12-08` |
| 기간 월 선택 | `month` 입력란 두 개에 시작월과 종료월을 각각 선택 | 시작월 `2026-10`, 종료월 `2026-12` |

## 연도 범위

기본 연도 목록은 표시 중인 연도 앞뒤 10년입니다. 2026년을 보고 있으면 2016~2036년을 표시하며, 다른 연도로 이동하면 목록의 기준 연도가 바뀝니다.

개별 버튼에 `data-dp-min-year="1950" data-dp-max-year="2050"`를 지정하면 해당 달력에 고정 범위를 적용합니다. 한쪽만 지정하면 그쪽 선택 경계만 고정하고, 반대쪽 연도 목록은 표시 중인 연도 기준으로 계산합니다. 속성이 생략된 쪽은 기본 연도 목록을 벗어나도 달력 이동으로 날짜를 선택할 수 있습니다. 연도는 1000~9999를 받으며, 월 고정 설정이 있으면 지정 월이 우선합니다.

## 주말과 공휴일 설정

전체 달력의 공휴일은 `common.js` 하단의 데이트피커 코드에 있는 `commonHolidays` 배열에서 관리합니다. 배열에는 실제 운영에서 공통으로 제외할 날짜를 등록합니다.

```js
var commonHolidays = ['2026-12-30', '2026-12-31'];
```

특정 달력의 공휴일은 해당 `button`에 `data-dp-holidays-add="2026-12-24"`를 지정합니다. 버튼의 `data-dp-holidays-exclude`는 그 달력에서만 공통·개별 공휴일 처리를 해제합니다. 월 선택은 일 단위 공휴일의 영향을 받지 않습니다.

```html
<label for="work-dates">날짜</label>
<div class="w24dp_field">
    <input type="text" id="work-dates" name="workDates">
    <button type="button" class="btn_calendar" w24-datepicker="workday" data-dp-count-target="#w24dp_date_count" data-dp-holidays="2026-12-25" data-dp-holidays-add="2026-12-24,2026-12-31" data-dp-holidays-exclude="2026-12-24"><span class="blind">달력선택</span></button>
</div>
<label for="w24dp_date_count">날짜 개수</label>
<input id="w24dp_date_count" name="workdayCount" type="text">
```

| 속성 | 값 |
| --- | --- |
| `data-dp-disable-weekends` | `true`이면 토·일 선택 불가, `false`이면 주말 선택 가능. `workday`는 생략 시 `true`, 나머지 유형은 `false` |
| `data-dp-count-target` | 날짜 개수를 쓸 `input` 선택자. 가까운 `data-dp-scope` 영역에서 먼저 찾고, 영역이 없으면 같은 폼에서 찾습니다. 반복 배치할 때는 달력과 결과 입력란을 각각의 `data-dp-scope`로 감쌉니다. |
| `data-dp-holidays` | 기존 마크업의 버튼별 공휴일 목록. 새 버튼은 `data-dp-holidays-add` 사용 |
| `data-dp-holidays-add` | 기본 목록에 추가할 날짜 |
| `data-dp-holidays-exclude` | 기본·추가 목록에서 공휴일 처리를 해제할 날짜 |

날짜는 `YYYY-MM-DD`로 지정하고 여러 날짜는 쉼표로 구분합니다. 공휴일 제외가 기본·추가 공휴일보다 우선합니다. 주말 비활성화가 켜져 있으면 공휴일 목록에서 제외한 토·일도 선택할 수 없습니다. 일 단위인 `single`, `multiple`, `workday`에 적용됩니다. 근무일은 여러 날짜를 선택한 뒤 적용하면 지정한 입력란에 일수가 반영됩니다. 공통으로 반영할 국가 공휴일도 `commonHolidays`에 등록합니다.

현재 달력 하단에 나타나는 다음 달 날짜도 선택할 수 있습니다. 다중 선택에서는 다음 달로 이동하고 선택 목록에 반영됩니다. 월 고정과 날짜 제한도 적용됩니다.

**오늘**은 현재 표시 중인 달에 오늘이 있으면 비활성화됩니다. 월 선택의 **이번 달**은 표시 중인 연도에 이번 달이 있으면 비활성화됩니다. 버튼이 활성화되어 있으면 현재 날짜가 있는 화면으로 이동합니다.

## 키보드

- Enter/Space로 열면 선택 날짜 또는 오늘에 포커스가 갑니다. 지정 월이 오늘과 다르면 해당 월 범위의 날짜에 포커스합니다.
- 방향키로 셀을 이동합니다. Home/End는 행의 처음/끝, Page Up/Down은 이전/다음 달(월 선택은 연도), 날짜에서 Shift+Page Up/Down은 이전/다음 연도로 이동합니다.
- Tab과 Shift+Tab은 달력의 활성 조작 요소와 열기 버튼을 순환합니다. 열기 버튼을 다시 누르거나 Enter/Space로 실행하면 달력이 닫힙니다.
- Enter/Space로 날짜·월을 선택합니다. Escape 또는 닫기로 닫으면 호출 버튼으로 포커스가 돌아옵니다.
- jQuery 3.6.1 환경에서 IE8은 지원할 수 없습니다. 브라우저·스크린리더 조합별 접근성 검증은 별도로 필요합니다.
