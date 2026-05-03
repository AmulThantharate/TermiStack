#!/bin/bash

# Configuration
BASE_URL="http://localhost:8080"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Starting Smoke Test for User Management API..."

# 1. Health Check
echo -n "1. Checking Health: "
HEALTH=$(curl -s $BASE_URL/health | grep -o "UP")
if [ "$HEALTH" == "UP" ]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    exit 1
fi

# 2. Create User
echo -n "2. Creating User: "
RESPONSE=$(curl -s -X POST $BASE_URL/users \
     -H "Content-Type: application/json" \
     -d '{"name": "Smoke Test User", "email": "smoke@test.com"}')

USER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$USER_ID" ]; then
    echo -e "${GREEN}PASS (ID: $USER_ID)${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi

# 3. Get User
echo -n "3. Getting User: "
GET_USER=$(curl -s $BASE_URL/users/$USER_ID)
if [[ $GET_USER == *"smoke@test.com"* ]]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    exit 1
fi

# 4. Update User
echo -n "4. Updating User: "
UPDATE_RESPONSE=$(curl -s -X PUT $BASE_URL/users/$USER_ID \
     -H "Content-Type: application/json" \
     -d '{"name": "Updated Smoke User", "email": "smoke@test.com"}')

if [[ $UPDATE_RESPONSE == *"Updated Smoke User"* ]]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    exit 1
fi

# 5. Get All Users
echo -n "5. Listing All Users: "
LIST_USERS=$(curl -s $BASE_URL/users)
if [[ $LIST_USERS == *"$USER_ID"* ]]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    exit 1
fi

# 6. Delete User
echo -n "6. Deleting User: "
DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $BASE_URL/users/$USER_ID)
if [ "$DELETE_STATUS" == "204" ]; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL (Status: $DELETE_STATUS)${NC}"
    exit 1
fi

# 7. Final Verify
echo -n "7. Final Cleanup Verification: "
FINAL_LIST=$(curl -s $BASE_URL/users)
if [[ $FINAL_LIST == *"$USER_ID"* ]]; then
    echo -e "${RED}FAIL (User still exists)${NC}"
    exit 1
else
    echo -e "${GREEN}PASS${NC}"
fi

echo ""
echo -e "${GREEN}✅ All Smoke Tests Passed Successfully!${NC}"
