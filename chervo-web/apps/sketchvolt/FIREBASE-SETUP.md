# SketchVolt · Auth + Nube (Firebase) — instructivo

Reutilizamos el proyecto de Firebase existente (el de bitácora). Los datos de SketchVolt van a una
colección aparte (`sketchvolt_proyectos`) y quedan aislados por chico vía Security Rules.

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
