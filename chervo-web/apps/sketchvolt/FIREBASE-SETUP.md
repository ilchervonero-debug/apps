# SketchVolt · Auth + Nube (Firebase) — instructivo

**YA WIREADO** (v79): reutiliza el proyecto de Bitácora `bitacorapp-3df06`. El `firebaseConfig` está
embebido en `index.html`; login Google + Magic Link y sync local-first ya están en código.
Los datos van a `usuarios/{uid}/sketchvolt/{id}` (aislados por chico, aparte de la bitácora).

## Falta SOLO tocar la consola (una vez)
1. **Authentication → Sign-in method**: activar **Correo → Vínculo de correo (Magic Link)**.
   (Google ya está activo por la bitácora.)
2. **Firestore → Reglas**: pegar `firestore.rules` y **Publicar** (cubre bitácora + sketchvolt sin romper nada).
3. **Authentication → Settings → Authorized domains**: confirmar que esté **ilchervo.com**
   (ya debería, porque la bitácora corre en el mismo dominio).

## Cómo funciona
- Botón de cuenta en el home (arriba a la derecha). Sin sesión = ícono de persona.
- Aceptar = Google · Cancelar = enlace por correo.
- **Local-first**: localStorage sigue siendo la fuente; al entrar, la nube hace *merge* (unión por id,
  gana el `mod` más nuevo, **nunca borra** trabajo) y sube lo que faltaba. Offline funciona igual.
- Las Reglas rechazan lo ajeno (permission-denied = el "403" del spec).

## Límite a vigilar
Firestore = 1 MB por documento. Hoy cada PROYECTO es un doc. Si un proyecto con muchos planos pesa
más de 1 MB, hay que partir por planta (queda como mejora futura).

---
## (Histórico) instructivo original

## Qué tenés que hacer en la consola de Firebase (una vez)

1. **Registrar una Web App** (si no hay una para web):
   Configuración del proyecto → Tus apps → `</>` (Web) → registrar "SketchVolt".
   Copiame el objeto **`firebaseConfig`** que te muestra (apiKey, authDomain, projectId, appId, etc.).
   *(La apiKey web NO es secreta: la seguridad la dan las Reglas + Auth. Se puede versionar.)*

2. **Habilitar métodos de acceso** (Authentication → Sign-in method):
   - **Google** (OAuth) — activar.
   - **Correo electrónico → Vínculo de correo (sin contraseña / Magic Link)** — activar.
   *(Sin contraseñas, para que los chicos no las pierdan.)*

3. **Firestore Database** → Crear (modo producción).

4. **Publicar las reglas**: pegar el contenido de `firestore.rules` en
   Firestore → Reglas → Publicar. (O `firebase deploy --only firestore:rules`.)

## Qué hago yo cuando me pases el `firebaseConfig`

- Cargo el SDK de Firebase (con SRI / versión fija) y un `firebase-config.js`.
- Login con Google y Magic Link.
- Cada proyecto/plano se guarda en `sketchvolt_proyectos/{id}` con su campo **`user_id`** = uid del token.
- Todas las lecturas se filtran por el usuario del token; las Reglas rechazan lo ajeno (403 / permission-denied).
- Mantengo el **guardado local (offline)** como caché: si no hay red, se sincroniza al reconectar.

## Nota de privacidad (menores)
Esto mueve datos de los 299 chicos a la nube de Google. Recomendado igual:
- No pedir PII innecesaria (ocultar Cliente/Obra/Dibujante/Empresa para el uso escolar).
- Dejar la app también usable offline/local.
