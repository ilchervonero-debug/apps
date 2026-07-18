# SEGURIDAD — auditoría de las apps iLStorage

Fecha de auditoría: 2026-07-18. Mantener este archivo al día si se agregan apps o backends.

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

### Paso B — Funciones RPC (el único camino permitido)

```sql
-- login: devuelve el nombre solo si el PIN coincide y está activo. El PIN nunca sale.
create or replace function public.login_pin(p text)
returns table(nombre text)
language sql security definer set search_path = public as $$
  select nombre from usuarios where pin = p and activo = true limit 1;
$$;

-- listar expedientes de un usuario (resumen)
create or replace function public.expedientes_de(u text)
returns setof expedientes
language sql security definer set search_path = public as $$
  select * from expedientes where usuario = u order by created_at desc limit 50;
$$;

-- crear / borrar expediente: análogas, con SECURITY DEFINER y validando el usuario.
grant execute on function public.login_pin(text)      to anon;
grant execute on function public.expedientes_de(text) to anon;
```

### Paso C — Cliente (index.html de ildjcu)

Cambiar las llamadas directas a la tabla por `POST /rest/v1/rpc/login_pin` etc.
**Esto lo hago yo en el repo en cuanto confirmes** (hay que hacerlo junto con el SQL de arriba,
si no la app deja de andar). Es un cambio de fondo del login — por eso lo dejo para acordarlo.

> Mientras tanto, mínimo indispensable: **prender RLS ya** (Paso A). La app quedará caída hasta
> tener las RPC, así que A + B + C conviene hacerlos en la misma tanda.

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

## Checklist para Ángel

- [ ] **ildjcu:** correr §1 A+B en Supabase y avisarme para hacer §1 C (cliente). ⚠️ prioridad
- [ ] **Firebase:** pegar las Reglas de §2 y limitar Authorized domains a ilchervo.com + localhost.
- [x] Cabeceras de seguridad en `vercel.json` (§4).
- [x] Verificado: sin `service_role` ni secretos privados en el repo.
