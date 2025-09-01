const { CurlParser } = require('./frontend/TestEditor/lib/ai/curl-parser.ts')

const curlCommand = `curl 'https://www.propertyguru.com.sg/api/consumer/recommendation?type=ldp&locale=en&listingId=24839769&maxItems=8&propertyType=SEMI&listingType=SALE&price=9380000&floorArea=7509&bedrooms=5' \\
  -H 'accept: application/json, text/plain, */*' \\
  -H 'accept-language: en-US,en;q=0.9,or-IN;q=0.8,or;q=0.7' \\
  -b 'pgutid=26e60836-f627-4177-b1fa-e1a15310a670; _ga=GA1.3.817323002.1742705374' \\
  -H 'priority: u=1, i' \\
  -H 'referer: https://www.propertyguru.com.sg/listing/for-sale-landed7772-brand-new-semi-detached-with-resort-style-pool-24839769' \\
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'`

try {
  const parsed = CurlParser.parse(curlCommand)
  console.log('Parsed cURL:', JSON.stringify(parsed, null, 2))
  
  const testSuite = CurlParser.generateTestSuite(parsed)
  console.log('Generated TestSuite:', JSON.stringify(testSuite, null, 2))
} catch (error) {
  console.error('Error:', error.message)
}