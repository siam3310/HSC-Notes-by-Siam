import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pdfUrl = searchParams.get('url');

  if (!pdfUrl) {
    return new NextResponse('Missing PDF URL', { status: 400 });
  }

  try {
    const response = await fetch(pdfUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF from ${pdfUrl}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Length', buffer.length.toString());

    return new NextResponse(buffer, { status: 200, headers });

  } catch (error: any) {
    console.error(`PDF Proxy Error fetching ${pdfUrl}:`, error);
    return new NextResponse(error.message || `Failed to fetch PDF from ${pdfUrl}`, { status: 500 });
  }
}