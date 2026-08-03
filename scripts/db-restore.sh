#!/bin/bash
# Script de restauration de base de données PostgreSQL (Disaster Recovery)

set -e

echo "⚠️  ATTENTION: Ce script va écraser la base de données actuelle !"
read -p "Êtes-vous sûr de vouloir continuer ? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Restauration annulée."
    exit 1
fi

if [ -z "$1" ]; then
    echo "Erreur: Veuillez fournir le chemin vers le fichier de dump (.dump)"
    echo "Usage: ./db-restore.sh backup_20260724_030000.dump"
    exit 1
fi

DUMP_FILE=$1
DB_URL=${DATABASE_URL:-"postgresql://postgres:password@localhost:5432/regional_express"}

echo "🔄 Restauration en cours depuis $DUMP_FILE..."
pg_restore -d "$DB_URL" -c -O -x "$DUMP_FILE"

echo "✅ Restauration terminée avec succès !"
