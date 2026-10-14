#!/usr/bin/env bash
# ==========================================================
#  Despliegue de miconexionrapida.com en AWS Amplify Hosting
#  Crea (o reutiliza) la app, conecta el repo de GitHub, publica la rama main
#  y asocia el dominio de Route 53 con HTTPS. Se puede ejecutar varias veces.
#
#  Requisitos:
#   - AWS CLI con un usuario que tenga los permisos de aws/politica-iam.json
#   - GitHub CLI con sesión iniciada (gh auth login) o la variable GITHUB_TOKEN
#     con un token que tenga acceso al repositorio.
#
#  Uso:  bash aws/desplegar.sh
# ==========================================================
set -euo pipefail

APP_NOMBRE="miconexionrapida"
REGION="${AWS_REGION:-us-east-2}"
REPO="https://github.com/Zombie550211/pagina-ICON"
RAMA="main"
DOMINIO="miconexionrapida.com"

export AWS_REGION="$REGION"
paso() { printf '\n\033[1;33m▶ %s\033[0m\n' "$*"; }

paso "Comprobando credenciales de AWS"
aws sts get-caller-identity --query Arn --output text

TOKEN="${GITHUB_TOKEN:-$(gh auth token 2>/dev/null || true)}"
if [[ -z "$TOKEN" ]]; then
  echo "Falta el token de GitHub: ejecuta 'gh auth login' o exporta GITHUB_TOKEN." >&2
  exit 1
fi

paso "Buscando la app «$APP_NOMBRE» en Amplify ($REGION)"
APP_ID=$(aws amplify list-apps --query "apps[?name=='$APP_NOMBRE'].appId | [0]" --output text)
if [[ "$APP_ID" == "None" || -z "$APP_ID" ]]; then
  paso "Creando la app y conectando $REPO"
  APP_ID=$(aws amplify create-app \
    --name "$APP_NOMBRE" \
    --platform WEB \
    --repository "$REPO" \
    --access-token "$TOKEN" \
    --custom-rules '[{"source":"/<*>","target":"/index.html","status":"404-200"}]' \
    --query app.appId --output text)
else
  echo "Ya existe: $APP_ID"
fi

paso "Configurando la rama $RAMA (se publica sola en cada git push)"
if ! aws amplify get-branch --app-id "$APP_ID" --branch-name "$RAMA" >/dev/null 2>&1; then
  aws amplify create-branch --app-id "$APP_ID" --branch-name "$RAMA" \
    --stage PRODUCTION --enable-auto-build >/dev/null
fi

paso "Lanzando la primera publicación"
JOB_ID=$(aws amplify start-job --app-id "$APP_ID" --branch-name "$RAMA" \
  --job-type RELEASE --query jobSummary.jobId --output text)
echo "Publicación $JOB_ID en curso…"
while :; do
  ESTADO=$(aws amplify get-job --app-id "$APP_ID" --branch-name "$RAMA" --job-id "$JOB_ID" \
    --query job.summary.status --output text)
  case "$ESTADO" in
    SUCCEED) echo "Publicada ✔"; break ;;
    FAILED|CANCELLED) echo "La publicación terminó en $ESTADO. Revisa los registros en la consola de Amplify." >&2; exit 1 ;;
    *) sleep 10 ;;
  esac
done
echo "URL temporal: https://$RAMA.$APP_ID.amplifyapp.com"

paso "Asociando $DOMINIO y www.$DOMINIO (certificado SSL gestionado por Amplify)"
if ! aws amplify get-domain-association --app-id "$APP_ID" --domain-name "$DOMINIO" >/dev/null 2>&1; then
  aws amplify create-domain-association --app-id "$APP_ID" --domain-name "$DOMINIO" \
    --sub-domain-settings "[{\"prefix\":\"\",\"branchName\":\"$RAMA\"},{\"prefix\":\"www\",\"branchName\":\"$RAMA\"}]" >/dev/null
fi
aws amplify get-domain-association --app-id "$APP_ID" --domain-name "$DOMINIO" \
  --query 'domainAssociation.{estado:domainStatus,motivo:statusReason}' --output table

cat <<EOF

Listo. El dominio tarda entre 10 minutos y 1 hora en verificarse y emitir el certificado.
Para ver el estado:
  aws amplify get-domain-association --region $REGION --app-id $APP_ID --domain-name $DOMINIO --query domainAssociation.domainStatus
Cuando diga AVAILABLE, la página estará en https://$DOMINIO
EOF
