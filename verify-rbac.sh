#!/bin/bash
# Gym House — role-based access control verification
BASE="http://localhost:5199"
cd "$(dirname "$0")"

login() {
  curl -s -X POST "$BASE/api/auth" -H "Content-Type: application/json" \
    --data "{\"action\":\"signin\",\"email\":\"$1\",\"password\":\"$2\"}" -D ./h.txt -o /dev/null
  grep -i "set-cookie" ./h.txt | sed 's/.*gymhouse_session=\([^;]*\).*/\1/' | tr -d '\r'
}
code() { curl -s -H "Cookie: gymhouse_session=$1" -o /dev/null -w "%{http_code}" "$BASE$2"; }
body() { curl -s -H "Cookie: gymhouse_session=$1" "$BASE$2"; }
chk() { [ "$2" = "$3" ] && echo "  $1 -> $2  OK" || echo "  $1 -> $2  FAIL (expected $3)"; }

M=$(login alice@demogym.com member123)
A=$(login admin@demogym.com admin1234)
R=$(login reception@demogym.com reception123)

echo "=== MEMBER (alice) ==="
chk "/member   " "$(code "$M" /member)" 200
chk "/admin    " "$(code "$M" /admin)" 403
chk "/reception" "$(code "$M" /reception)" 403
echo "  content: $(body "$M" /member | grep -o 'Alice Johnson\|My QR Pass\|Attendance History\|Unlimited Premium' | sort -u | tr '\n' ' ')"

echo ""
echo "=== ADMIN (sarah) — superset access ==="
chk "/admin    " "$(code "$A" /admin)" 200
chk "/member   " "$(code "$A" /member)" 200
chk "/reception" "$(code "$A" /reception)" 200
echo "  content: $(body "$A" /admin | grep -o 'Admin Dashboard\|Active Members\|Monthly Revenue' | sort -u | tr '\n' ' ')"

echo ""
echo "=== RECEPTION ==="
chk "/reception" "$(code "$R" /reception)" 200
chk "/admin    " "$(code "$R" /admin)" 403
chk "/member   " "$(code "$R" /member)" 403
echo "  content: $(body "$R" /reception | grep -o 'Reception Desk\|Check In\|Recent Activity' | sort -u | tr '\n' ' ')"

echo ""
echo "=== ANON ==="
chk "/member   " "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/member")" 401
# 401 (not authenticated) is correct here — 403 is for authenticated-but-forbidden.
chk "/admin    " "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/admin")" 401
chk "/         " "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/")" 200

echo ""
echo "=== BAD PASSWORD ==="
BAD=$(curl -s -X POST "$BASE/api/auth" -H "Content-Type: application/json" \
  --data '{"action":"signin","email":"alice@demogym.com","password":"wrong"}' -o /dev/null -w "%{http_code}")
chk "POST auth " "$BAD" 401

echo ""
echo "=== SIGN OUT invalidates session ==="
curl -s -X POST "$BASE/api/auth" -H "Content-Type: application/json" -H "Cookie: gymhouse_session=$M" \
  --data '{"action":"signout"}' -o /dev/null
chk "/member after signout" "$(code "$M" /member)" 401

rm -f ./h.txt
