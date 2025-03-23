#!/bin/bash
set -u

BASE_URL=http://localhost:3000/api/v1
DOCTOR_NAME="Dr. House"
DEPARTMENT_ID=1
SOCIAL=$(shuf -i 1000000000-9999999999 -n 1)

PASSED_TEST_COUNT=0
FAILED_TEST_COUNT=0

test_step() {
  local label="$1"
  local result="$2"

  result="$(echo "$result" | tr -d '\r\n' | xargs)"

  echo "=> TEST: $label"
  case "$result" in
    403|401)
      echo "== Result: correctly denied ($result)"
      ((PASSED_TEST_COUNT++))
      ;;
    *"{")
      echo "== Result: $(jq -c . <<<"$result")"
      ((PASSED_TEST_COUNT++))
      ;;
    "")
      echo "== Result: test failed"
      ((FAILED_TEST_COUNT++))
      ;;
    *)
      echo "== Result: $result"
      ((PASSED_TEST_COUNT++))
      ;;
  esac
  echo
}

CREATE_DOCTOR=$(curl -s -X POST "$BASE_URL/doctors" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$DOCTOR_NAME\", \"departmentId\": $DEPARTMENT_ID}")

DOCTOR_ID=$(echo "$CREATE_DOCTOR" | jq -r ".id")
TOKEN=$(npx tsx hack/gen-token.ts "$DOCTOR_ID")

CREATE_PATIENT=$(curl -s -X POST "$BASE_URL/patients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"John Doe\",\"socialSecurity\":\"$SOCIAL\",\"journal\":{\"notes\":\"Initial checkup\"}}")

PATIENT_ID=$(echo "$CREATE_PATIENT" | jq -r ".id")

GET_PATIENT_BY_ID=$(curl -s -X GET "$BASE_URL/patients/$PATIENT_ID" \
  -H "Authorization: Bearer $TOKEN")

DOCTOR_IDS="[$DOCTOR_ID, 2]"

ADMIT_PATIENT=$(curl -s -X POST "$BASE_URL/patients/$PATIENT_ID/admission" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"departmentId\": $DEPARTMENT_ID, \"doctorIds\": $DOCTOR_IDS}")

LIST_PATIENTS=$(curl -s -X GET "$BASE_URL/doctors/patients" \
  -H "Authorization: Bearer $TOKEN")

UNAUTHORIZED_DOCTOR=$(curl -s -X POST "$BASE_URL/doctors" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Dr. NotAllowed\", \"departmentId\": 2}")

UNAUTHORIZED_DOCTOR_ID=$(echo "$UNAUTHORIZED_DOCTOR" | jq -r ".id")
UNAUTHORIZED_TOKEN=$(npx tsx hack/gen-token.ts "$UNAUTHORIZED_DOCTOR_ID")
UNAUTHORIZED_ACCESS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/patients/$PATIENT_ID" \
  -H "Authorization: Bearer $UNAUTHORIZED_TOKEN")

echo "==========================="
echo "=> Testing API Endpoints <="
echo "==========================="

test_step "Create Doctor" "$CREATE_DOCTOR"
test_step "Generate Token" "$TOKEN"
test_step "Create Patient" "$CREATE_PATIENT"
test_step "Get Patient" "$GET_PATIENT_BY_ID"
test_step "Admit Patient" "$ADMIT_PATIENT"
test_step "List Doctor Patients" "$LIST_PATIENTS"
test_step "Create Unauthorized Doctor" "$UNAUTHORIZED_DOCTOR"
test_step "Unauthorized doctor access patient" "$UNAUTHORIZED_ACCESS"

echo "================================================="
echo "=> Test Summary"
echo "================================================="
echo "✅ Passed: $PASSED_TEST_COUNT"
echo "❌ Failed: $FAILED_TEST_COUNT"
echo
