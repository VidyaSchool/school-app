import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300 // 5 minutes — needed for AI streaming responses

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '')

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const searchParams = req.nextUrl.searchParams.toString()
  const url = `${BACKEND_URL}/${pathStr}${searchParams ? `?${searchParams}` : ''}`
  
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const authHeader = req.headers.get('authorization') || ''
    const res = await fetch(url, {
      headers: {
        'cookie': cookieHeader,
        ...(authHeader && { 'authorization': authHeader }),
      },
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      let parsedError = errorText
      try {
        const jsonError = JSON.parse(errorText)
        parsedError = jsonError.detail || errorText
      } catch {}
      return NextResponse.json({ detail: parsedError }, { status: res.status })
    }
    
    if (res.headers.get('content-type')?.includes('text/event-stream')) {
      return new NextResponse(res.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    const isNetworkError = error?.cause?.code === 'ECONNREFUSED' || error?.cause?.code === 'ETIMEDOUT' || error?.message?.includes('fetch failed')
    return NextResponse.json(
      { detail: isNetworkError ? 'Backend service is unavailable. Please try again later.' : error.message },
      { status: isNetworkError ? 503 : 500 }
    )
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const url = `${BACKEND_URL}/${pathStr}`

  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const authHeader = req.headers.get('authorization') || ''
    const contentType = req.headers.get('content-type') || ''

    let fetchBody: BodyInit
    let fetchHeaders: Record<string, string>

    if (contentType.includes('multipart/form-data')) {
      // ── Multipart / file upload: forward raw body + preserve boundary ──
      const rawBody = await req.arrayBuffer()
      fetchBody = rawBody
      fetchHeaders = {
        'cookie': cookieHeader,
        'content-type': contentType, // must include boundary=... for FastAPI to parse
        ...(authHeader && { 'authorization': authHeader }),
      }
      if (process.env.NODE_ENV !== 'production') {
        console.log(`PROXY [POST] Multipart upload to ${url} (${rawBody.byteLength} bytes)`)
      }
    } else {
      // ── JSON body (default) ──
      const body = await req.json()
      if (process.env.NODE_ENV !== 'production') {
        console.log(`PROXY [POST] Request to ${url} with body:`, JSON.stringify(body))
      }
      fetchBody = JSON.stringify(body)
      fetchHeaders = {
        'cookie': cookieHeader,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(authHeader && { 'authorization': authHeader }),
      }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: fetchHeaders,
      body: fetchBody,
      // @ts-ignore — required in Node.js to allow streaming body reads
      duplex: 'half',
      cache: 'no-store',
    })

    if (!res.ok) {
      const errorText = await res.text()
      if (process.env.NODE_ENV !== 'production') {
        console.error(`PROXY [POST] Error response from ${url} (status: ${res.status}):`, errorText)
      }
      let parsedError = errorText
      try {
        const jsonError = JSON.parse(errorText)
        parsedError = jsonError.detail || errorText
      } catch {}
      return NextResponse.json({ detail: parsedError }, { status: res.status })
    }

    if (res.headers.get('content-type')?.includes('text/event-stream')) {
      return new NextResponse(res.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    const isNetworkError = error?.cause?.code === 'ECONNREFUSED' || error?.cause?.code === 'ETIMEDOUT' || error?.message?.includes('fetch failed')
    return NextResponse.json(
      { detail: isNetworkError ? 'Backend service is unavailable. Please try again later.' : error.message },
      { status: isNetworkError ? 503 : 500 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const url = `${BACKEND_URL}/${pathStr}`
  
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const authHeader = req.headers.get('authorization') || ''
    const body = await req.json()
    
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'cookie': cookieHeader,
        'Content-Type': 'application/json',
        ...(authHeader && { 'authorization': authHeader }),
      },
      body: JSON.stringify(body),
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      let parsedError = errorText
      try {
        const jsonError = JSON.parse(errorText)
        parsedError = jsonError.detail || errorText
      } catch {}
      return NextResponse.json({ detail: parsedError }, { status: res.status })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    const isNetworkError = error?.cause?.code === 'ECONNREFUSED' || error?.cause?.code === 'ETIMEDOUT' || error?.message?.includes('fetch failed')
    return NextResponse.json(
      { detail: isNetworkError ? 'Backend service is unavailable. Please try again later.' : error.message },
      { status: isNetworkError ? 503 : 500 }
    )
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const url = `${BACKEND_URL}/${pathStr}`
  
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const authHeader = req.headers.get('authorization') || ''
    const body = await req.json()
    
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'cookie': cookieHeader,
        'Content-Type': 'application/json',
        ...(authHeader && { 'authorization': authHeader }),
      },
      body: JSON.stringify(body),
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      let parsedError = errorText
      try {
        const jsonError = JSON.parse(errorText)
        parsedError = jsonError.detail || errorText
      } catch {}
      return NextResponse.json({ detail: parsedError }, { status: res.status })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    const isNetworkError = error?.cause?.code === 'ECONNREFUSED' || error?.cause?.code === 'ETIMEDOUT' || error?.message?.includes('fetch failed')
    return NextResponse.json(
      { detail: isNetworkError ? 'Backend service is unavailable. Please try again later.' : error.message },
      { status: isNetworkError ? 503 : 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const url = `${BACKEND_URL}/${pathStr}`
  
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const authHeader = req.headers.get('authorization') || ''
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'cookie': cookieHeader,
        ...(authHeader && { 'authorization': authHeader }),
      },
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      let parsedError = errorText
      try {
        const jsonError = JSON.parse(errorText)
        parsedError = jsonError.detail || errorText
      } catch {}
      return NextResponse.json({ detail: parsedError }, { status: res.status })
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    const isNetworkError = error?.cause?.code === 'ECONNREFUSED' || error?.cause?.code === 'ETIMEDOUT' || error?.message?.includes('fetch failed')
    return NextResponse.json(
      { detail: isNetworkError ? 'Backend service is unavailable. Please try again later.' : error.message },
      { status: isNetworkError ? 503 : 500 }
    )
  }
}
