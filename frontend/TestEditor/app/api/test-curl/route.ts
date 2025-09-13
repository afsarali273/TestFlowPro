import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { curlCommand } = await request.json();
    
    if (!curlCommand || typeof curlCommand !== 'string') {
      return NextResponse.json(
        { error: 'Invalid cURL command' },
        { status: 400 }
      );
    }

    // Security: Basic validation to prevent command injection
    if (curlCommand.includes('&&') || curlCommand.includes('||') || curlCommand.includes(';')) {
      return NextResponse.json(
        { error: 'Invalid characters in cURL command' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    
    try {
      // Add timeout and format options to cURL
      const safeCurlCommand = `${curlCommand} --max-time 30 --silent --show-error --write-out "CURL_STATUS_CODE:%{http_code}|CURL_CONTENT_TYPE:%{content_type}|CURL_TIME_TOTAL:%{time_total}"`;
      
      const { stdout, stderr } = await execAsync(safeCurlCommand);
      const responseTime = Date.now() - startTime;
      
      // Parse cURL output
      const statusMatch = stdout.match(/CURL_STATUS_CODE:(\d+)/);
      const contentTypeMatch = stdout.match(/CURL_CONTENT_TYPE:([^|]*)/);
      const timeMatch = stdout.match(/CURL_TIME_TOTAL:([\d.]+)/);
      
      const status = statusMatch ? parseInt(statusMatch[1]) : 0;
      const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : '';
      const curlTime = timeMatch ? parseFloat(timeMatch[1]) * 1000 : responseTime;
      
      // Extract response body (everything before the status line)
      const responseBody = stdout.replace(/CURL_STATUS_CODE:.*$/, '').trim();
      
      let parsedResponse = responseBody;
      try {
        if (contentType.includes('application/json') && responseBody) {
          parsedResponse = JSON.parse(responseBody);
        }
      } catch {
        // Keep as string if not valid JSON
      }
      
      return NextResponse.json({
        status,
        statusText: getStatusText(status),
        contentType,
        responseTime: Math.round(curlTime),
        response: parsedResponse,
        success: status >= 200 && status < 400
      });
      
    } catch (execError: any) {
      // Handle cURL execution errors
      const responseTime = Date.now() - startTime;
      
      return NextResponse.json({
        status: 0,
        statusText: 'Request Failed',
        error: execError.message || 'cURL execution failed',
        responseTime,
        success: false
      });
    }
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };
  
  return statusTexts[status] || 'Unknown';
}