import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { canEditRecipe } from '@/lib/recipes'
import crypto from 'crypto'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

async function getRecipeOwner(id: string): Promise<{ id: string; created_by: string; cover_image_url: string | null } | null> {
  const { rows } = await db.execute({
    sql: 'SELECT id, created_by, cover_image_url FROM recipes WHERE id = ?',
    args: [id],
  })
  if (!rows[0]) return null
  return {
    id: rows[0].id as string,
    created_by: rows[0].created_by as string,
    cover_image_url: rows[0].cover_image_url as string | null,
  }
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getSession()

  if (!session.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const recipe = await getRecipeOwner(id)
  if (!recipe) {
    return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 })
  }
  if (!canEditRecipe(recipe, session.user)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'FormData no válido' }, { status: 400 })
  }

  const file = formData.get('image')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Falta el campo image' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de imagen no permitido (JPEG, PNG, WebP, AVIF)' }, { status: 400 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'La imagen no puede superar 5 MB' }, { status: 400 })
  }

  // Subir primero — si falla, la BD no se toca y la imagen anterior sigue intacta
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const token = crypto.randomBytes(6).toString('hex')
  const blob = await put(`recipes/${id}/${token}.${ext}`, file, {
    access: 'public',
    addRandomSuffix: false,
  })

  // Guardar nueva URL en BD
  await db.execute({
    sql: 'UPDATE recipes SET cover_image_url = ?, updated_at = datetime(\'now\') WHERE id = ?',
    args: [blob.url, id],
  })

  // Borrar la imagen anterior (fire-and-forget): si falla solo es storage leak, la BD ya está íntegra
  if (recipe.cover_image_url) {
    del(recipe.cover_image_url).catch(() => undefined)
  }

  return NextResponse.json({ ok: true, url: blob.url })
}

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getSession()

  if (!session.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const recipe = await getRecipeOwner(id)
  if (!recipe) {
    return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 })
  }
  if (!canEditRecipe(recipe, session.user)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  // Limpiar BD primero; si del() falla, la imagen queda huérfana en Blob pero la BD está limpia
  await db.execute({
    sql: 'UPDATE recipes SET cover_image_url = NULL, updated_at = datetime(\'now\') WHERE id = ?',
    args: [id],
  })

  if (recipe.cover_image_url) {
    del(recipe.cover_image_url).catch(() => undefined)
  }

  return NextResponse.json({ ok: true })
}
