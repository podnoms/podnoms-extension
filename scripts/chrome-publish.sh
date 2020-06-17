set -a
. ./.env.development
set +a

echo $GAPI_CLIENT_ID

ACCESS_TOKEN=$(curl "https://accounts.google.com/o/oauth2/token" -d "client_id=${GAPI_CLIENT_ID}&client_secret=${GAPI_CLIENT_SECRET}&refresh_token=${GAPI_CLIENT_REFRESH}&grant_type=refresh_token&redirect_uri=urn:ietf:wg:oauth:2.0:oob" | jq -r .access_token)
curl -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "x-goog-api-version: 2" -X PUT -T ./build/send-2-podnoms.zip \
    -v "https://www.googleapis.com/upload/chromewebstore/v1.1/items/${GAPI_EXTENSION_ID}"

curl -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "x-goog-api-version: 2" \
    -H "Content-Length: 0" \
    -X POST -v "https://www.googleapis.com/chromewebstore/v1.1/items/${GAPI_EXTENSION_ID}/publish"
