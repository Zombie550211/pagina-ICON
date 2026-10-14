# Despliegue en AWS Amplify — miconexionrapida.com

La web es estática (HTML, CSS, JS e imágenes). Amplify Hosting la publica desde GitHub
(`Zombie550211/pagina-ICON`, rama `main`) y la vuelve a publicar sola en cada `git push`.
El dominio `miconexionrapida.com` está en Route 53, así que Amplify crea los registros DNS
y el certificado HTTPS automáticamente.

Archivos que usa Amplify (en la raíz del repo):

| Archivo           | Para qué sirve                                                               |
|-------------------|------------------------------------------------------------------------------|
| `amplify.yml`     | Copia solo la web a `dist/` y publica eso (la carpeta `aws/` no se publica). |
| `customHttp.yml`  | Cabeceras de seguridad (HSTS, nosniff…) y caché de HTML, CSS/JS e imágenes.   |

## 1. Dar permisos al usuario de AWS

El usuario `crm-migration` no tiene permisos de Amplify ni de Route 53. Alguien con acceso de
administrador debe añadirle la política de [`politica-iam.json`](politica-iam.json):

```bash
aws iam put-user-policy \
  --user-name crm-migration \
  --policy-name HostingMiConexionRapida \
  --policy-document file://aws/politica-iam.json
```

(O desde la consola: IAM → Usuarios → crm-migration → Agregar permisos → Crear política insertada
→ pestaña JSON → pegar el contenido del archivo.)

## 2. Desplegar

Desde la raíz del proyecto, con sesión de GitHub iniciada (`gh auth status`):

```bash
AWS_PROFILE=connecting bash aws/desplegar.sh
```

El script:

1. crea la app `miconexionrapida.com` en Amplify (us-east-1) y la conecta al repo;
2. configura la rama `main` como producción con publicación automática;
3. lanza la primera publicación y espera a que termine (muestra la URL temporal `*.amplifyapp.com`);
4. asocia `miconexionrapida.com` y `www.miconexionrapida.com` con certificado SSL.

Se puede ejecutar más de una vez: si la app o el dominio ya existen, los reutiliza.
El dominio tarda entre 10 minutos y 1 hora en quedar `AVAILABLE`.

### Alternativa sin script (consola)

1. Amplify → **Crear nueva aplicación** → GitHub → autorizar → repo `pagina-ICON`, rama `main`.
2. Amplify detecta `amplify.yml`; no hay que cambiar nada → **Guardar e implementar**.
3. **Administración de dominios** → Agregar dominio → `miconexionrapida.com` → marcar raíz y `www` → Guardar.

## 3. Después de publicar

- **Google Ads:** rellena los identificadores en `js/ads.js`, haz commit y push; Amplify publica solo.
  En Google Ads, la URL final de los anuncios es `https://miconexionrapida.com/`.
- **Comprobar:** `https://miconexionrapida.com` carga con candado, y `www` redirige al mismo sitio.
- **Coste:** Amplify cobra por minutos de compilación y GB servidos; para una landing con este
  tamaño suele quedar dentro de la capa gratuita o en pocos dólares al mes.

## Estado actual

- App de Amplify: `miconexionrapida.com` (ID `d29fnjhejrrdt`, región **us-east-1**; us-east-2 llegó al límite de apps).
- Usuario con permisos en este equipo: perfil `connecting` (`connecting-deploy`).
- URL de Amplify: https://main.d29fnjhejrrdt.amplifyapp.com
- Vista previa en GitHub Pages: https://zombie550211.github.io/pagina-ICON/
- `www.miconexionrapida.com` redirige con 301 a `https://miconexionrapida.com`.
