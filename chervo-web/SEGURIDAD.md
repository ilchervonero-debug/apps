# SEGURIDAD — auditoría de las apps iLStorage

Fecha de auditoría: 2026-07-18. Mantener este archivo al día si se agregan apps o backends.

---

## ▶ LUNES 11:00 — orden de pasos (runbook)

Hacer en la PC. Estado hoy: **nada prendido todavía** (decisión de Ángel: son 2 usuarios,
riesgo bajo el finde). Orden:

1. **ildjcu / Supabase** (lo más importante):
   1. Ángel + Claude juntos: definir el diseño con **token de sesión** (ver §1, para que el PIN
      y los expedientes no sean accesibles directo ni spoofeables).
   2. Ángel: pegar el SQL final en Supabase → SQL Editor (RLS + tabla `sesiones` + funciones).
   3. Claude: pushear el `index.html` de ildjcu ya adaptado a las funciones.
   4. Probar juntos: entra por PIN, el admin ve su panel, se crean/leen/borran expedientes. OK.
2. **Firebase** (bitacorapp, ilme, gastos-ruta26): Ángel pega las Reglas de §2 en la consola y
   limita *Authorized domains* a `ilchervo.com` + `localhost`.
3. Marcar el checklist del final y actualizar la fecha de arriba.

> `vercel.json` (cabeceras, §4) ya quedó hecho y subido el 2026-07-18.

## Resumen (qué guarda datos y dónde)

| App | Backend | Datos | Riesgo hoy |
|-----|---------|-------|-----------|
| **ildjcu** | Supabase (`mvuyntiuiwjjjjsshzcb`) | tablas `usuarios` (nombre, **pin**, activo) y `expedientes` (usuario, datos) | **ALTO** — ver §1 |
| **bitacorapp** | Firebase `bitacorapp-3df06` (Firestore + Google) | `usuarios/{uid}/proyectos` | Medio — depende de reglas §2 |
| **ilme** | Firebase `bitacorapp-3df06` | `usuarios/{uid}/ilme/data` | Medio — depende de reglas §2 |
| **gastos-ruta26** | Firebase `bitacorapp-3df06` | colección compartida `gastos_ruta26_1042` | Medio — allowlist solo en cliente §2 |
| demoliciones, ilvolt, ilwall, ildraw, cielorraso, ilsanitaria, ilcalc, guidecad, apucore | — | solo `localStorage` (no sale del dispositivo) | Bajo |

**Aclaración importante sobre "variables de entorno":** estas apps son **estáticas** (HTML que
corre en el navegador). La `apiKey` de Firebase y la key `sb_publishable_…` de Supabase son
**claves públicas por diseño** — aunque las muevas a variables de entorno igual viajan al
navegador y son visibles. **No son secretos.** Lo que de verdad protege los datos NO es esconder
la clave, sino **RLS (Supabase) y las Reglas de Seguridad (Firebase)**. No hay ninguna
`service_role` ni secreto privado hardcodeado en el repo (verificado). Así que la tarea real es
§1 y §2, no mover claves a `.env`.

---

## §1 · Supabase (ildjcu) — RLS + login por PIN  ⚠️ PRIORIDAD

**Problema:** el login por PIN corre en el cliente con la clave pública. Hace
`GET usuarios?select=nombre&pin=eq.<pin>`, más POST/PATCH/DELETE sobre `usuarios` y
`expedientes`. **Si RLS está apagado, cualquiera que abra el código puede** volcar todos los
usuarios y sus PIN, borrar usuarios y leer/borrar todos los expedientes.

**Ojo:** con solo "prender RLS y dar SELECT al rol anónimo" NO alcanza — si anon puede leer
`usuarios`, también puede pedir `select=nombre,pin` y llevarse todos los PIN. La forma correcta
es **no dar acceso directo a las tablas** y hacer el login y los expedientes por **funciones RPC**
`SECURITY DEFINER`, para que el PIN nunca salga de la base.

### Paso A — Prender RLS y cerrar el acceso directo (correr en Supabase → SQL)

```sql
alter table public.usuarios   enable row level security;
alter table public.expedientes enable row level security;
-- sin políticas para el rol anónimo => nadie lee/escribe las tablas directo
revoke all on public.usuarios   from anon;
revoke all on public.expedientes from anon;
```

**Dos agujeros extra a tapar (por eso hace falta token, no solo login_pin):**
- El **panel admin** hace `GET usuarios?select=id,nombre,pin,activo` → **lista todos los PINs**.
  Eso no puede seguir yendo directo a la tabla.
- Los expedientes se filtran por nombre en el cliente (`usuario=eq.<nombre>`). Como el cliente
  solo guarda un string con el nombre, cualquiera podría pedir los de otro. Hace falta que el
  servidor sepa **quién es** por un token, no por un nombre que manda el cliente.

### Paso B — Diseño con token de sesión (se arma y prueba el lunes juntos)

```sql
-- tabla de sesiones (token -> usuario)
create table if not exists public.sesiones (
  token uuid primary key default gen_random_uuid(),
  usuario text not null,
  es_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.sesiones enable row level security;   -- sin políticas: nadie la toca directo

-- login: valida PIN y devuelve un token. El PIN nunca sale de la base.
create or replace function public.login_pin(p text)
returns table(token uuid, nombre text, es_admin boolean)
language plpgsql security definer set search_path = public as $$
declare u record;
begin
  select nombre into u from usuarios where pin = p and activo = true limit 1;
  if u is null then return; end if;
  return query
    insert into sesiones(usuario, es_admin)
    values (u.nombre, u.nombre = 'ADMIN')   -- ⚠ poner acá el nombre real del admin
    returning sesiones.token, sesiones.usuario, (select es_admin from sesiones s where s.token = sesiones.token);
end $$;

-- de acá para abajo, cada función recibe el TOKEN y resuelve el usuario server-side:
-- expedientes_listar(tk), expedientes_crear(tk, datos), expedientes_borrar(tk, id),
-- expedientes_abrir(tk, id)  → todas validan el token en `sesiones`.
-- admin_usuarios_listar(tk)  → exige es_admin; devuelve nombre/activo SIN el pin.
-- admin_usuario_crear/toggle/borrar(tk, ...) → exigen es_admin.
grant execute on function public.login_pin(text) to anon;
-- (grant execute de las demás cuando se creen)
```

> El SQL completo de las funciones de expedientes y admin lo terminamos el lunes junto con el
> cambio del cliente, así lo probamos de una y no queda a medias.

### Paso C — Cliente (index.html de ildjcu) — lo hace Claude el lunes

Guardar el `token` que devuelve `login_pin` y mandar todas las llamadas a
`POST /rest/v1/rpc/<funcion>` con ese token, en vez de pegarle directo a las tablas.
Se pushea **junto** con el SQL de Paso A+B, si no la app deja de entrar.

---

## §2 · Firebase (bitacorapp, ilme, gastos-ruta26) — Reglas de Firestore

La `apiKey` pública es normal. La protección son las **Reglas de Seguridad** (consola Firebase →
Firestore → Reglas) y los **dominios autorizados** (Authentication → Settings → Authorized
domains: dejar solo `ilchervo.com` y `localhost`).

Reglas recomendadas (cada quien ve solo lo suyo; gastos-ruta26 restringido por email):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // bitacorapp e ilme: subárbol por usuario
    match /usuarios/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // gastos-ruta26: colección compartida, solo emails de la lista
    match /gastos_ruta26_1042/{doc} {
      allow read, write: if request.auth != null &&
        request.auth.token.email in [
          // pegar acá los mismos emails de RESPONSABLE_POR_EMAIL
        ];
    }
  }
}
```

> El `RESPONSABLE_POR_EMAIL` del cliente es solo comodidad de UI: **se puede saltar**. La lista de
> emails en las Reglas (arriba) es la que manda de verdad.

---

## §3 · CORS

- **Supabase:** la API REST responde a cualquier origen por diseño; no se restringe por CORS. La
  defensa es RLS/RPC (§1), no CORS.
- **Firebase:** el SDK maneja CORS solo. El equivalente a "restringir origen" son los **Authorized
  domains** de Authentication (§2): solo `ilchervo.com` + `localhost`.

---

## §4 · Cabeceras (Vercel) — hecho en el repo

`vercel.json` raíz (el que Vercel usa) ahora manda `X-Frame-Options: SAMEORIGIN` +
`X-Content-Type-Options: nosniff` + `Referrer-Policy` + `Permissions-Policy` (cámara off,
micrófono self, geo off) + `X-XSS-Protection`. Antes faltaba `X-Frame-Options` (clickjacking).

Pendiente opcional: una CSP estricta rompería los scripts inline y los CDN (Firebase, gstatic,
sheetjs). Se deja anotado; no se aplica para no romper las apps.

---

## Checklist (para el LUNES — ver runbook arriba)

- [ ] **ildjcu:** armar diseño con token (§1 B), pegar SQL en Supabase, pushear cliente (§1 C),
      probar. ⚠️ prioridad
- [ ] **Firebase:** pegar las Reglas de §2 y limitar Authorized domains a ilchervo.com + localhost.
- [x] Cabeceras de seguridad en `vercel.json` (§4) — hecho 2026-07-18.
- [x] Verificado: sin `service_role` ni secretos privados en el repo.

> Decisión 2026-07-18: se deja SIN prender nada el fin de semana (2 usuarios, riesgo bajo).
> Todo se ejecuta el lunes 11:00 con la PC. Recordatorio programado.
