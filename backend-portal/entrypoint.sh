#!/bin/sh
set -e

echo "Esperando a que la base de datos PostgreSQL esté lista..."
while ! nc -z ${POSTGRES_HOST:-db} ${POSTGRES_PORT:-5432}; do
  sleep 1
done
echo "PostgreSQL está listo."

echo "Generando migraciones de modelos si es necesario..."
python manage.py makemigrations accounts roles audit common || true

echo "Aplicando migraciones a la base de datos (con --fake-initial para respetar SQL existente)..."
python manage.py migrate --fake-initial

if [ "${SEED_DEMO_USERS:-true}" = "true" ]; then
    echo "Ejecutando seed de usuarios, roles y permisos de prueba..."
    python manage.py seed_demo_data
fi

echo "Iniciando servidor Django en 0.0.0.0:8000..."
exec "$@"
