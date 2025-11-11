# README — `actualizar` (recargosController)

Este documento explica paso a paso qué hace la función `actualizar` del archivo `src/controllers/recargosController.js`, con un enfoque claro en cómo se maneja `req.file` (archivo de planilla). Incluye flujos para: archivo nuevo (upload), reemplazo, eliminación y no-cambio.

## Propósito

La función `actualizar` actualiza un `RecargoPlanilla` existente. Parte de su trabajo es permitir que el cliente:
- Suba una nueva planilla (archivo) para reemplazar la actual.
- Elimine la planilla existente (cuando el frontend no envía archivo pero sí indica borrado implícito).
- Mantenga la planilla tal como está (cuando no hay archivo en la petición y no había planilla previa).

La sección de manejo de archivos se encuentra en el bloque: `// Handle file upload` dentro de `actualizar`.

---

## Resumen ejecutivo (cómo reacciona la función según `req.file`)

1. Si `req.file` existe (cliente subió un archivo):
   - Valida `req.file.originalname` y `req.file.size`. Si inválido, elimina archivo temporal (si existe) y arroja error.
   - Llama `uploadPlanillaToS3(req.file, id, oldS3Key || undefined)` pasando la clave S3 antigua si existe.
   - Si la subida retorna `archivoInfo.s3_key` válido, guarda `planilla_s3key` en la fila del `RecargoPlanilla` (dentro de la transacción) y borra el archivo temporal `req.file.path` (si existe).
   - Si la subida falla o retorna información inválida, arroja error para forzar rollback.

2. Si `req.file` NO existe pero `recargoExistente.planilla_s3key` existe (el recargo tenía un archivo previamente):
   - Se asume que el usuario quiere eliminar la planilla.
   - Actualiza la fila del recargo poniendo `planilla_s3key: null` (dentro de la transacción).
   - Llama `deletePlanillaFromS3(oldS3Key)` para eliminar el archivo remoto en S3.
   - Si la eliminación en S3 falla, se arroja error y la transacción hace rollback.

3. Si `req.file` NO existe y tampoco hay `planilla_s3key` previa:
   - No se hace nada con archivos; se registra `Recargo ${id} - sin cambios en planilla`.

---

## Paso a paso (detallado)

### 1) Validación inicial y búsqueda del recargo
- Recupera `userId` desde `req.user` (verifica autenticación).
- Busca el `RecargoPlanilla` existente (`recargoExistente`) por `id` con la relación de días laborales.
- Valida que existan campos obligatorios: `conductor_id`, `vehiculo_id`, `empresa_id`, `dias_laborales`, etc.

> Nota: todo esto ocurre antes de la sección de archivos; si falla, se hace `safeRollback` y se retorna error 400/401/404.

### 2) Manejo de `req.file` (bloque principal)

- Si `req.file` está presente (se recibió un archivo en la petición multipart/form-data):
  1. Validaciones del archivo:
     - Comprueba `req.file.originalname` y `req.file.size` > 0.
     - Si no cumple, intenta borrar `req.file.path` (el archivo temporal en el servidor) y lanza Error('Archivo inválido o vacío').
  2. Logging: registra que se está procesando la nueva planilla (nombre, tamaño, mime-type).
  3. Determina `oldS3Key = recargoExistente.planilla_s3key` (si existía archivo previo).
  4. Llama: `archivoInfo = await uploadPlanillaToS3(req.file, id, oldS3Key || undefined)`.
     - Observación: el código pasa `oldS3Key` a la función de subida. Según la implementación de `uploadPlanillaToS3`, esto puede servir para sobrescribir o versionar en S3.
  5. Verifica `archivoInfo` y `archivoInfo.s3_key`:
     - Si no existen, lanza Error('No se recibió información válida del archivo subido').
  6. Actualiza el registro en la base de datos: `await recargoExistente.update({ planilla_s3key: archivoInfo.s3_key }, { transaction })`.
     - Esto se hace dentro de la misma transacción que envuelve toda la operación.
  7. Limpieza del archivo local temporal: si `req.file.path` existe, intenta `fs.unlink(req.file.path)` y registra la eliminación.
  8. Logging final sobre éxito del procesamiento.
  9. Si ocurre cualquier error dentro de estos pasos, se `throw` y el `catch` general hace rollback y devuelve 500 (o detalle si está en `development`).

- Si NO viene `req.file` pero `recargoExistente.planilla_s3key` existe (caso de eliminación explícita/implícita):
  1. Asume que el frontend desea eliminar la planilla existente.
  2. Anota `s3KeyToDelete = recargoExistente.planilla_s3key`.
  3. Actualiza el recargo en la DB: `await recargoExistente.update({ planilla_s3key: null }, { transaction })`.
     - Como esto está dentro de la transacción, si la eliminación en S3 falla después, el rollback revertirá este cambio.
  4. Llama `const s3keyEliminado = await deletePlanillaFromS3(s3KeyToDelete)`.
  5. Si `s3keyEliminado` es falso, lanza error y se hará rollback. Si es true, registra éxito.

- Si NO viene `req.file` y NO existe `planilla_s3key` (nunca hubo archivo):
  - Registra: `Recargo ${id} - sin cambios en planilla` y continúa el flujo normal de actualización.

### 3) Limpieza en fallos
- En varios puntos se intenta eliminar archivos temporales locales (`req.file.path`) cuando hay error al subir.
- En el `catch` superior de `actualizar` también hay lógica que, si `req.file && req.file.path`, intenta eliminar el temp file para evitar basura en disco.
- La función `safeRollback(transaction)` se usa para asegurar que si la transacción no fue finalizada, se haga rollback de forma segura.

### 4) Consistencia (orden y atomicidad)
- Las actualizaciones de la columna `planilla_s3key` se hacen dentro de la transacción. Por ejemplo, en el flujo de eliminación el campo DB se pone `null` antes de invocar `deletePlanillaFromS3`. Si la eliminación falla, se lanza error y la transacción hace rollback: la columna volverá a su valor anterior.
- En el flujo de reemplazo (cuando llega `req.file`), la llamada `uploadPlanillaToS3` se realiza antes de actualizar la DB con la nueva `s3_key`. Si `uploadPlanillaToS3` maneja sobrescritura del `oldS3Key` internamente, la eliminación/actualización remota y local queda coherente.

---

## Respuestas HTTP (casos y códigos)

- 201 / 200: Respuesta exitosa con datos normalizados cuando la actualización completa se realiza.
- 400: Validaciones inválidas (por ejemplo, `Horas inválidas`, `Faltan campos requeridos`) o `Archivo inválido o vacío`.
- 401: Usuario no autenticado.
- 404: Recargo no encontrado.
- 500: Error interno del servidor (ej. fallo en S3, en la subida, errores inesperados). En `development` el mensaje real del error se envía en la respuesta para depuración.

---

## Funciones auxiliares implicadas

- `uploadPlanillaToS3(file, recargoId, oldS3Key)`: sube el archivo a S3. Debe devolver un objeto con `s3_key` (clave/URL). El controlador pasa `oldS3Key` para permitir sobrescribir o relacionar la nueva subida con la anterior.

- `deletePlanillaFromS3(s3Key)`: elimina el objeto de S3 y debe devolver `true` si la operación tuvo éxito (o lanzar/retornar falso en caso contrario).

- `fs.unlink(path)`: limpia el archivo temporal local en `req.file.path` si está presente.

---

## Escenarios concretos (ejemplos)

1. Reemplazar archivo (usuario sube uno nuevo):
   - `req.file` presente.
   - `oldS3Key` existe.
   - `uploadPlanillaToS3(req.file, id, oldS3Key)` se ejecuta -> devuelve `s3_key_new`.
   - DB se actualiza con `planilla_s3key = s3_key_new` dentro de la transacción.
   - Temp file eliminado.
   - Respuesta 200 con recargo actualizado.

2. Agregar archivo donde antes no había ninguno:
   - `req.file` presente.
   - `oldS3Key` = null.
   - `uploadPlanillaToS3` guarda el archivo y devuelve `s3_key`.
   - DB se actualiza con la nueva clave.

3. Eliminar archivo existente (frontend envía datos sin archivo, implicando borrado):
   - `req.file` ausente, `recargoExistente.planilla_s3key` existe.
   - DB actualizada a `planilla_s3key = null` dentro de la transacción.
   - `deletePlanillaFromS3` elimina el objeto remoto.
   - Si `deletePlanillaFromS3` falla -> error -> rollback -> DB no queda en null.

4. No cambio en planilla:
   - `req.file` ausente y `recargoExistente.planilla_s3key` ausente.
   - No se realizan operaciones sobre S3 ni DB relacionadas con la planilla.

---

## Buenas prácticas y mejoras sugeridas

- Asegurar que `uploadPlanillaToS3` y `deletePlanillaFromS3` lancen excepciones claras o devuelvan booleanos bien documentados para que el controlador maneje fallos correctamente.
- Considerar contar con un mecanismo de retry para operaciones S3 en fallos transitorios.
- Registrar (audit) la acción de reemplazo/borrado (por ejemplo, guardar en el historial la `planilla_s3key` anterior y usuario que realizó la acción).
- Si la eliminación remota es costosa, se podría dejar la eliminación real fuera de la transacción (ejecutarla después del commit) y registrar una tarea asíncrona para borrar el objeto en S3. Pero el patrón actual (borrar dentro de la transacción y rollback si falla) garantiza consistencia fuerte entre DB y S3.

---

## Pruebas rápidas (curl)

1) Subir/actualizar planilla (multipart):

```bash
curl -X PUT "https://tu-api/api/recargos/:id" \
  -H "Authorization: Bearer <token>" \
  -F "recargo_data={\"conductor_id\":\"...\", \"vehiculo_id\":\"...\", \"empresa_id\":\"...\", \"dias_laborales\": [...] }" \
  -F "file=@/ruta/a/planilla.xlsx" \
  -i
```

2) Eliminar planilla (sin archivo, enviar datos que actualicen recargo):

```bash
curl -X PUT "https://tu-api/api/recargos/:id" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "conductor_id":"...", "vehiculo_id":"...", "empresa_id":"...", "dias_laborales": [...] }'
```

Si en respuesta la API no recibe `req.file` pero el recargo tenía `planilla_s3key`, el controlador interpreta que debe eliminarla.

---

## Resumen final

La función `actualizar` maneja `req.file` con tres caminos claros: subir/replace, eliminar (cuando no llega archivo pero existía uno) o no tocar la planilla (cuando no hay archivo y no existía). Todas las operaciones críticas sobre la columna `planilla_s3key` se hacen dentro de la transacción para preservar la consistencia y se intenta limpiar archivos temporales locales en éxito o fallo.

Si quieres, puedo:
- Añadir tests unitarios/integración (mock S3) para cada escenario.
- Extraer la lógica de manejo de archivos a una función separada para reutilizarla y testearla con mayor facilidad.

---

Archivo generado automáticamente desde la función `actualizar` en `src/controllers/recargosController.js`.

## Parche recomendado para el backend — Alinear con el frontend

Contexto corto:
- El frontend ahora puede enviar, en las actualizaciones (PUT multipart/form-data):
   - `recargo_data` (JSON) como antes.
   - `planilla` (File) cuando el usuario sube un archivo nuevo.
   - Si el usuario NO sube archivo pero existe una planilla previamente asociada, el frontend añadirá opcionalmente:
      - `planilla_s3key` (string) — la clave S3 original
      - `keep_planilla` = "true" — flag explícita para indicar conservar la planilla

Problema actual:
- El controlador `actualizar` actualmente interpreta la ausencia de `req.file` y la existencia de `recargoExistente.planilla_s3key` como orden de eliminación de la planilla (set NULL + delete S3). Esto hace que, cuando el frontend abre un recargo y lo guarda sin tocar la planilla, el backend elimine la planilla existente.

Solución recomendada (backend):
- Antes de asumir que la ausencia de `req.file` implica eliminación, verificar si la petición entrante explícitamente solicita mantener la planilla. Para ello chequear, en orden práctico:
   1. Si `req.body.keep_planilla === 'true'` (o valor booleano true).
   2. Si `req.body.planilla_s3key` existe (multipart) OR si en `recargo_data` (JSON) viene `planilla_s3key`.

Patch sugerido (insertar en la sección `// Handle file upload` de `actualizar`):

```js
// --- PARCHE SUGERIDO ---
// Normalizar lectura del recargoData cuando viene en multipart (recargo_data como string)
let incomingRecargoData = {};
if (req.body && req.body.recargo_data) {
   try {
      incomingRecargoData = JSON.parse(req.body.recargo_data);
   } catch (err) {
      incomingRecargoData = req.body.recargo_data || {};
   }
} else {
   incomingRecargoData = req.body || {};
}

// Determinar si el cliente pide explícitamente conservar la planilla
const incomingKeepPlanilla = (
   (req.body && (req.body.keep_planilla === 'true' || req.body.keep_planilla === true)) ||
   Boolean(req.body && req.body.planilla_s3key) ||
   Boolean(incomingRecargoData && incomingRecargoData.planilla_s3key)
);

// Lógica de manejo de archivos (respetando la señal incomingKeepPlanilla)
if (req.file) {
   // flujo existente: subir/replace file (mantener la llamada a uploadPlanillaToS3)
   // ... subir a S3 y actualizar recargoExistente.planilla_s3key = nuevo_s3_key
} else if (!req.file && recargoExistente.planilla_s3key && !incomingKeepPlanilla) {
   // Solo eliminar si NO hay señal explícita de mantener
   // -> actualizar DB set planilla_s3key = null y deletePlanillaFromS3(oldKey)
} else {
   // No se hace nada con la planilla (mantener la existente) o no había ninguna
}
// --- FIN PARCHE SUGERIDO ---
```

Notas importantes sobre el patch
- `incomingRecargoData.planilla_s3key` cubre el caso en que el frontend incluya la clave S3 dentro del JSON `recargo_data`.
- `req.body.planilla_s3key` cubre el caso en que el frontend envie la clave S3 como campo multipart separado (el cliente añadirá `planilla_s3key` y `keep_planilla` en el FormData cuando no suba un archivo nuevo).
- Aceptar tanto `'true'` (string) como boolean `true` para `keep_planilla` hace la verificación robusta frente a distintas librerías que serialicen el multipart/form-data.

Pruebas recomendadas (curl)

1) Actualizar SIN cambiar la planilla (preservar):

```bash
curl -X PUT "https://tu-api/api/recargos/:id" \
   -H "Authorization: Bearer <token>" \
   -F "recargo_data={\"conductor_id\":\"...\", \"vehiculo_id\":\"...\", \"empresa_id\":\"...\", \"dias_laborales\": [...] }" \
   -F "planilla_s3key=<la_clave_s3_existente>" \
   -F "keep_planilla=true" \
   -i
```

2) Actualizar Y eliminar planilla (intención explícita de borrar):

```bash
curl -X PUT "https://tu-api/api/recargos/:id" \
   -H "Authorization: Bearer <token>" \
   -H "Content-Type: application/json" \
   -d '{ "conductor_id":"...", "vehiculo_id":"...", "empresa_id":"...", "dias_laborales": [...] }' \
   -i
```

(*El segundo ejemplo es el flujo actual: si no llega `req.file` y no viene `keep_planilla` ni `planilla_s3key`, el controlador debe interpretar esto como petición de eliminación si había antes una planilla.)

Pruebas automáticas sugeridas
- Unit test / integration test (con S3 mock):
   - Caso A: recargo con planilla previa, petición con `keep_planilla=true` → DB no debe setear `planilla_s3key=null`, no debe llamar a delete S3.
   - Caso B: recargo con planilla previa, petición SIN `keep_planilla` y SIN `req.file` → debe setear `planilla_s3key=null` y borrar S3.
   - Caso C: petición con `req.file` → debe subir, actualizar `planilla_s3key` con la nueva clave.

Registro y telemetría
- Registra un log informativo cuando la petición incluye `keep_planilla` o `planilla_s3key` para facilitar auditoría.

Si quieres, puedo generar un patch propuesto para `src/controllers/recargosController.js` con el diff concreto (basado en tu código actual). Para eso necesito el archivo `src/controllers/recargosController.js` en el repo o pegar aquí su contenido. ¿Lo agrego yo (creo el diff) o lo prefieres revisar primero manualmente y aplicar? 

---
Fin de la sección de parche.
