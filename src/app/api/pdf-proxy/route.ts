// src/app/api/pdf-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pdfUrl = searchParams.get('url');

  if (!pdfUrl) {
    return new NextResponse('Missing PDF URL', { status: 400 });
  }

  try {
    const response = await fetch(pdfUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Length', buffer.length.toString());

    return new NextResponse(buffer, { status: 200, headers });

  } catch (error: any) {
          console.error('PDF Proxy Error:', error, 'Attempted URL:', pdfUrl);
          return new NextResponse(`Failed to fetch PDF (${pdfUrl || 'unknown URL'}): ${error.message || 'Unknown error'}`, { status: 500 });
  }
}
